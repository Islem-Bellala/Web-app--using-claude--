/**
 * Bunyan — Auth Store (Zustand)
 * Manages authentication state: user, tokens, loading, error.
 * Tokens are persisted to localStorage for session continuity.
 */

import { create } from 'zustand'
import type { AuthState, User } from '../types/auth'
import { apiLogin, apiRegister, apiRefreshToken, apiGetMe } from '../services/api'
import { useUIStore } from './uiStore'

const LS_ACCESS  = 'bunyan_access_token'
const LS_REFRESH = 'bunyan_refresh_token'

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  accessToken:     null,
  refreshToken:    null,
  isAuthenticated: false,
  isInitializing:  false,
  isLoading:       false,
  error:           null,

  // ── login ──────────────────────────────────────────────────────────────────

  async login(email, password) {
    set({ isLoading: true, error: null })
    try {
      const tokens = await apiLogin(email, password)
      const user   = await apiGetMe(tokens.access_token)
      localStorage.setItem(LS_ACCESS,  tokens.access_token)
      localStorage.setItem(LS_REFRESH, tokens.refresh_token)
      useUIStore.getState().resetToProjects()
      set({
        user,
        accessToken:     tokens.access_token,
        refreshToken:    tokens.refresh_token,
        isAuthenticated: true,
        isLoading:       false,
      })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  // ── register ───────────────────────────────────────────────────────────────

  async register(email, password, fullName) {
    set({ isLoading: true, error: null })
    try {
      const tokens = await apiRegister(email, password, fullName)
      const user   = await apiGetMe(tokens.access_token)
      localStorage.setItem(LS_ACCESS,  tokens.access_token)
      localStorage.setItem(LS_REFRESH, tokens.refresh_token)
      useUIStore.getState().resetToProjects()
      set({
        user,
        accessToken:     tokens.access_token,
        refreshToken:    tokens.refresh_token,
        isAuthenticated: true,
        isLoading:       false,
      })
    } catch (err) {
      set({ isLoading: false, error: (err as Error).message })
    }
  },

  // ── logout ─────────────────────────────────────────────────────────────────

  logout() {
    localStorage.removeItem(LS_ACCESS)
    localStorage.removeItem(LS_REFRESH)
    useUIStore.getState().resetToProjects()
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null })
  },

  // ── refreshTokens ──────────────────────────────────────────────────────────

  async refreshTokens() {
    const { refreshToken } = get()
    if (!refreshToken) return false
    try {
      const tokens = await apiRefreshToken(refreshToken)
      const user   = await apiGetMe(tokens.access_token)
      localStorage.setItem(LS_ACCESS,  tokens.access_token)
      localStorage.setItem(LS_REFRESH, tokens.refresh_token)
      set({
        user,
        accessToken:     tokens.access_token,
        refreshToken:    tokens.refresh_token,
        isAuthenticated: true,
      })
      return true
    } catch {
      get().logout()
      return false
    }
  },

  // ── checkAuth ─────────────────────────────────────────────────────────────

  async checkAuth() {
    const stored = localStorage.getItem(LS_ACCESS)
    if (!stored) {
      // No token — show LoginPage immediately, skip loading spinner
      return
    }
    set({ isInitializing: true })

    const AUTH_TIMEOUT_MS = 4000
    function withTimeout<T>(p: Promise<T>): Promise<T> {
      return Promise.race([
        p,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('auth_timeout')), AUTH_TIMEOUT_MS)
        ),
      ])
    }

    try {
      const user = await withTimeout(apiGetMe(stored))
      const refresh = localStorage.getItem(LS_REFRESH)
      useUIStore.getState().resetToProjects()
      set({
        user,
        accessToken:     stored,
        refreshToken:    refresh,
        isAuthenticated: true,
        isInitializing:  false,
      })
    } catch {
      // Token expired, network error, or timeout — try refresh
      const refresh = localStorage.getItem(LS_REFRESH)
      if (refresh) {
        set({ refreshToken: refresh })
        try {
          const ok = await withTimeout(get().refreshTokens())
          if (ok) useUIStore.getState().resetToProjects()
          // refreshTokens() handles auth state; always clear isInitializing
          set({ isInitializing: false })
        } catch {
          // Refresh timed out — clear everything and show login
          get().logout()
          set({ isInitializing: false })
        }
      } else {
        localStorage.removeItem(LS_ACCESS)
        set({ isInitializing: false })
      }
    }
  },

  // ── clearError ────────────────────────────────────────────────────────────

  clearError() {
    set({ error: null })
  },
}))
