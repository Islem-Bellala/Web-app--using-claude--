/**
 * Bunyan — Auth Store (Zustand)
 * Manages authentication state: user, tokens, loading, error.
 * Tokens are persisted to localStorage for session continuity.
 */

import { create } from 'zustand'
import type { AuthState, User } from '../types/auth'
import { apiLogin, apiRegister, apiRefreshToken, apiGetMe } from '../services/api'

const LS_ACCESS  = 'bunyan_access_token'
const LS_REFRESH = 'bunyan_refresh_token'

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  accessToken:     null,
  refreshToken:    null,
  isAuthenticated: false,
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
      set({ isLoading: false })
      return
    }
    set({ isLoading: true })
    try {
      const user = await apiGetMe(stored)
      const refresh = localStorage.getItem(LS_REFRESH)
      set({
        user,
        accessToken:     stored,
        refreshToken:    refresh,
        isAuthenticated: true,
        isLoading:       false,
      })
    } catch {
      // Token expired — try refresh
      const refresh = localStorage.getItem(LS_REFRESH)
      if (refresh) {
        set({ refreshToken: refresh })
        const ok = await get().refreshTokens()
        if (!ok) set({ isLoading: false })
      } else {
        localStorage.removeItem(LS_ACCESS)
        set({ isLoading: false })
      }
    }
  },

  // ── clearError ────────────────────────────────────────────────────────────

  clearError() {
    set({ error: null })
  },
}))
