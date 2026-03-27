/**
 * Bunyan — Login / Register Page
 * Full-page auth form. NOT inside the sidebar+topbar shell.
 * French UI text, works with dark/light theme system.
 */

import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import type { AppColors } from '../../types'

interface LoginPageProps {
  c: AppColors
  isDark: boolean
}

export default function LoginPage({ c, isDark }: LoginPageProps) {
  const [mode, setMode]           = useState<'login' | 'register'>('login')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [fullName, setFullName]   = useState('')

  const { login, register, isLoading, error, clearError } = useAuthStore()

  function handleToggle() {
    setMode(m => m === 'login' ? 'register' : 'login')
    clearError()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'login') {
      await login(email, password)
    } else {
      await register(email, password, fullName || undefined)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: c.elevated,
    border: `1px solid ${c.border}`,
    borderRadius: 8,
    color: c.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    color: c.textSec,
    marginBottom: 5,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: c.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 380,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.text, letterSpacing: '-0.02em' }}>
            StructCalc
          </div>
          <div style={{ fontSize: 11, color: c.textMuted, marginTop: 3 }}>
            RPA 2024 · CBA93 · BAEL91
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: c.text, marginTop: 18 }}>
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: isDark ? '#3b0f0f' : '#fef2f2',
            border: `1px solid ${c.red}`,
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 13,
            color: c.red,
            marginBottom: 18,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'register' && (
            <div>
              <label style={labelStyle}>Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Optionnel"
                style={inputStyle}
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Adresse e-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '11px',
              background: isLoading ? c.borderLight : c.blue,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: isLoading ? 'default' : 'pointer',
              marginTop: 4,
              transition: 'background 0.15s',
            }}
          >
            {isLoading
              ? 'Chargement…'
              : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: c.textMuted }}>
          {mode === 'login' ? (
            <>
              Pas de compte ?{' '}
              <button type="button" onClick={handleToggle} style={{
                background: 'none', border: 'none', color: c.blue,
                cursor: 'pointer', fontSize: 13, padding: 0,
              }}>
                Inscrivez-vous
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button type="button" onClick={handleToggle} style={{
                background: 'none', border: 'none', color: c.blue,
                cursor: 'pointer', fontSize: 13, padding: 0,
              }}>
                Connectez-vous
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
