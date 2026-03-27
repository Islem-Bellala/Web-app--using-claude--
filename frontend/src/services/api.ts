/**
 * Bunyan — Typed API Service
 * Centralises all backend communication with typed request/response payloads.
 * Components must NEVER use raw fetch directly — use these functions instead.
 */

import type {
  WilayaInfo,
  CommuneInfo,
  SpectrumRequest,
  SpectrumApiResponse,
  BaseShearRequest,
  BaseShearResult,
  TokenResponse,
  User,
  ProjectSummary,
  ProjectFull,
  ProjectState,
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  // Read token directly from localStorage to avoid circular import with authStore
  const token = localStorage.getItem('bunyan_access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(
  path: string,
  options: RequestInit,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  })

  // On 401: attempt token refresh then retry once
  if (res.status === 401) {
    const { useAuthStore } = await import('../stores/authStore')
    const refreshed = await useAuthStore.getState().refreshTokens()
    if (refreshed) {
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          ...(options.headers ?? {}),
        },
      })
      if (retry.ok) return retry.json() as Promise<T>
      const retryErr = await retry.json().catch(() => ({ detail: `HTTP ${retry.status}` }))
      throw new Error((retryErr as { detail?: string }).detail ?? `Erreur ${retry.status}`)
    }
    throw new Error('Session expirée')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error((err as { detail?: string }).detail ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<T>
}

// ── Annex A — Wilaya / Commune / Zone ─────────────────────────────────────────

export async function fetchWilayas(signal?: AbortSignal): Promise<WilayaInfo[]> {
  return request<WilayaInfo[]>('/wilayas', { method: 'GET' }, signal)
}

export async function fetchCommunes(
  wilayaCode: string,
  signal?: AbortSignal,
): Promise<CommuneInfo[]> {
  return request<CommuneInfo[]>(`/wilayas/${wilayaCode}/communes`, { method: 'GET' }, signal)
}

export async function fetchZone(
  wilayaCode: string,
  commune?: string,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({ wilaya_code: wilayaCode })
  if (commune) params.set('commune', commune)
  const data = await request<{ zone: string }>(`/zone?${params.toString()}`, { method: 'GET' }, signal)
  return data.zone
}

// ── Seismic Calculations ──────────────────────────────────────────────────────

export async function computeSpectrum(
  params: SpectrumRequest,
  signal?: AbortSignal,
): Promise<SpectrumApiResponse> {
  return request<SpectrumApiResponse>(
    '/spectrum',
    { method: 'POST', body: JSON.stringify(params) },
    signal,
  )
}

export async function computeBaseShear(
  params: BaseShearRequest,
  signal?: AbortSignal,
): Promise<BaseShearResult> {
  return request<BaseShearResult>(
    '/base_shear',
    { method: 'POST', body: JSON.stringify(params) },
    signal,
  )
}

// ── Auth API ──────────────────────────────────────────────────────────────────
// These bypass the 401-retry logic to avoid circular refresh loops.

async function authRequest<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
    throw new Error((err as { detail?: string }).detail ?? `Erreur ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function apiLogin(email: string, password: string): Promise<TokenResponse> {
  return authRequest<TokenResponse>('/auth/login', { email, password })
}

export async function apiRegister(
  email: string,
  password: string,
  full_name?: string,
): Promise<TokenResponse> {
  return authRequest<TokenResponse>('/auth/register', { email, password, full_name })
}

export async function apiRefreshToken(refreshToken: string): Promise<TokenResponse> {
  return authRequest<TokenResponse>('/auth/refresh', { refresh_token: refreshToken })
}

export async function apiGetMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Session invalide')
  return res.json() as Promise<User>
}

// ── Projects API ──────────────────────────────────────────────────────────────

export async function apiCreateProject(name: string, description?: string): Promise<ProjectFull> {
  return request<ProjectFull>('/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function apiListProjects(): Promise<ProjectSummary[]> {
  return request<ProjectSummary[]>('/projects', { method: 'GET' })
}

export async function apiGetProject(id: string): Promise<ProjectFull> {
  return request<ProjectFull>(`/projects/${id}`, { method: 'GET' })
}

export async function apiUpdateProject(
  id: string,
  name?: string,
  description?: string,
): Promise<ProjectFull> {
  return request<ProjectFull>(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, description }),
  })
}

export async function apiSaveProjectState(id: string, state: ProjectState): Promise<ProjectFull> {
  return request<ProjectFull>(`/projects/${id}/state`, {
    method: 'PUT',
    body: JSON.stringify({ state }),
  })
}

export async function apiDeleteProject(id: string): Promise<void> {
  await request<void>(`/projects/${id}`, { method: 'DELETE' })
}
