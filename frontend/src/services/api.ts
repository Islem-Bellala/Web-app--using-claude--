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
} from '../types'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    signal,
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  })
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
