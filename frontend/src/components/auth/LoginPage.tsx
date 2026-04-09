import { useState, type CSSProperties } from 'react'
import { useAuthStore } from '../../stores/authStore'
import type { AppColors } from '../../types'

interface LoginPageProps {
  c: AppColors
  isDark: boolean
}

export default function LoginPage({ c, isDark }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')

  const { login, register, isLoading, error, clearError } = useAuthStore()

  function handleToggle() {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    clearError()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (mode === 'login') {
      await login(email, password)
      return
    }
    await register(email, password, fullName || undefined)
  }

  const vars = {
    '--page-bg': c.bg,
    '--page-bg-soft': `${c.elevated}ee`,
    '--page-surface': c.surface,
    '--page-elevated': c.elevated,
    '--page-border': c.border,
    '--page-text': c.text,
    '--page-text-sec': c.textSec,
    '--page-text-muted': c.textMuted,
    '--page-blue': c.blue,
    '--page-green': c.green,
    '--page-amber': c.amber,
    '--page-red': c.red,
    '--page-purple': c.purple,
  } as CSSProperties

  return (
    <div className="auth-shell" style={vars}>
      <div className="auth-layout">
        <section className="auth-showcase">
          <div className="auth-showcase__eyebrow">Plateforme de vérification structurale</div>
          <div className="auth-showcase__title">
            <span className="font-arabic">بنيان</span> Bunyan
          </div>
          <div className="auth-showcase__body">
            Un environnement de travail conçu pour des ingénieurs structure, avec un parcours plus clair, des
            écrans plus lisibles et une lecture technique plus rapide des résultats.
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <strong>Workflow guidé</strong>
              <span>Des paramètres généraux jusqu’aux vérifications sismiques, chaque écran suit le même langage visuel.</span>
            </div>
            <div className="auth-feature">
              <strong>Calculs inchangés</strong>
              <span>Cette refonte améliore l’interface et l’expérience sans modifier la logique métier ni les formules.</span>
            </div>
            <div className="auth-feature">
              <strong>Prêt pour le quotidien</strong>
              <span>Lisibilité, retours de statut et responsive solide pour reprendre rapidement un projet en cours.</span>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card__brand">
            <strong>
              <span className="font-arabic">بنيان</span> Bunyan
            </strong>
            <span>RPA 2024 · CBA93 · BAEL91</span>
          </div>

          <div className="auth-card__heading">
            <h1>{mode === 'login' ? 'Connexion sécurisée' : 'Créer un compte'}</h1>
            <p>
              {mode === 'login'
                ? 'Rouvrez vos projets, vérifiez votre session et reprenez vos contrôles sans friction.'
                : 'Créez votre accès Bunyan pour gérer vos projets et centraliser les vérifications structurales.'}
            </p>
          </div>

          {error ? <div className="auth-alert">{error}</div> : null}

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <div className="auth-field">
                <label htmlFor="full-name">Nom complet</label>
                <input
                  id="full-name"
                  className="auth-input"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Optionnel"
                  autoComplete="name"
                />
              </div>
            ) : null}

            <div className="auth-field">
              <label htmlFor="email">Adresse e-mail</label>
              <input
                id="email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Mot de passe</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Chargement…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
            </button>
          </form>

          <div className="auth-toggle">
            {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà inscrit ? '}
            <button type="button" onClick={handleToggle}>
              {mode === 'login' ? 'Créer un accès' : 'Revenir à la connexion'}
            </button>
          </div>

          {!isDark ? null : (
            <div className="auth-toggle">
              Le mode sombre est actif. Vous pourrez le modifier une fois connecté depuis l’en-tête principal.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
