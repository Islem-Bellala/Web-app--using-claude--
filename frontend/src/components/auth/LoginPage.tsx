/**
 * Bunyan — Login / Register Page (Phase 6: Atlas theme)
 * Full-page auth form. NOT inside the sidebar+topbar shell.
 */

import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'

export default function LoginPage() {
  const [mode, setMode]         = useState<'login' | 'register'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

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

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-5 bg-atlas-bg dark:bg-atlas-dark-bg">
      <div className="w-full max-w-sm bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl px-8 py-9">

        {/* ── Logo / header ────────────────────────────────────────── */}
        <div className="text-center mb-7">
          {/* Green badge with logo */}
          <div className="inline-flex items-center gap-2 bg-atlas-topbar dark:bg-atlas-dark-topbar px-4 py-2 rounded-lg mb-4">
            <span className="text-atlas-gold font-bold text-lg font-arabic">بنيان</span>
            <span className="text-atlas-gold font-semibold text-sm tracking-wide">Bunyan</span>
          </div>
          <p className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted tracking-wide">
            Plateforme de vérification structurelle
          </p>
          <h1 className="mt-5 text-base font-semibold text-atlas-text dark:text-atlas-dark-text">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </h1>
        </div>

        {/* ── Error message ─────────────────────────────────────────── */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg border border-atlas-danger/50 bg-atlas-danger/10 text-atlas-danger text-xs">
            {error}
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec mb-1.5">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Optionnel"
                autoComplete="name"
                className="w-full px-3 py-2.5 rounded-md text-sm
                  bg-atlas-bg dark:bg-atlas-dark-bg
                  border border-atlas-border dark:border-atlas-dark-border
                  text-atlas-text dark:text-atlas-dark-text
                  placeholder:text-atlas-text-muted dark:placeholder:text-atlas-dark-text-muted
                  outline-none focus:border-atlas-gold focus:ring-1 focus:ring-atlas-gold/30 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec mb-1.5">
              Adresse e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="vous@exemple.com"
              autoComplete="email"
              className="w-full px-3 py-2.5 rounded-md text-sm
                bg-atlas-bg dark:bg-atlas-dark-bg
                border border-atlas-border dark:border-atlas-dark-border
                text-atlas-text dark:text-atlas-dark-text
                placeholder:text-atlas-text-muted dark:placeholder:text-atlas-dark-text-muted
                outline-none focus:border-atlas-gold focus:ring-1 focus:ring-atlas-gold/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full px-3 py-2.5 rounded-md text-sm
                bg-atlas-bg dark:bg-atlas-dark-bg
                border border-atlas-border dark:border-atlas-dark-border
                text-atlas-text dark:text-atlas-dark-text
                placeholder:text-atlas-text-muted dark:placeholder:text-atlas-dark-text-muted
                outline-none focus:border-atlas-gold focus:ring-1 focus:ring-atlas-gold/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-1 py-2.5 rounded-md text-sm font-semibold transition-colors
              bg-atlas-gold text-atlas-green hover:bg-atlas-gold/90
              disabled:opacity-60 disabled:cursor-default"
          >
            {isLoading
              ? 'Chargement…'
              : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>

        {/* ── Mode toggle ───────────────────────────────────────────── */}
        <p className="text-center mt-5 text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted">
          {mode === 'login' ? (
            <>
              Pas de compte ?{' '}
              <button type="button" onClick={handleToggle}
                className="text-atlas-gold hover:underline cursor-pointer">
                Inscrivez-vous
              </button>
            </>
          ) : (
            <>
              Déjà inscrit ?{' '}
              <button type="button" onClick={handleToggle}
                className="text-atlas-gold hover:underline cursor-pointer">
                Connectez-vous
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
