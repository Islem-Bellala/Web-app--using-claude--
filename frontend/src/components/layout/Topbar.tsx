import { useAuthStore } from '../../stores/authStore'
import { useProjectStore } from '../../stores/projectStore'
import { useUIStore } from '../../stores/uiStore'
import { PAGE_META } from './navigation'

export default function Topbar() {
  const { activePage, sidebarOpen, setSidebarOpen, theme, toggleTheme } = useUIStore()
  const { user, logout } = useAuthStore()
  const { currentProjectId, currentProjectName, isSaving, saveCurrentProject } = useProjectStore()

  const meta = PAGE_META[activePage] ?? PAGE_META.default
  const initials = user ? (user.full_name ?? user.email).slice(0, 2).toUpperCase() : 'BN'
  const userLabel = user?.full_name?.trim() || user?.email || 'Compte'

  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-topbar__menu"
        aria-label={sidebarOpen ? 'Fermer la navigation' : 'Ouvrir la navigation'}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? '×' : '≡'}
      </button>

      <div className="app-brand">
        <div className="app-brand__title">
          <span className="font-arabic">بنيان</span> Bunyan
        </div>
        <div className="app-brand__subtitle">RPA 2024 · CBA93 · BAEL91</div>
      </div>

      <div className="app-topbar__center">
        <div className="app-context">
          <div className="app-context__eyebrow">{meta.eyebrow}</div>
          <div className="app-context__title">{meta.title}</div>
          <div className="app-context__subtitle">{meta.description}</div>
        </div>
      </div>

      <div className="app-topbar__actions">
        {currentProjectId ? (
          <div className="app-project-pill">
            <span className="app-project-pill__label">Projet actif</span>
            <span className="app-project-pill__sep">:</span>
            <span className="app-project-pill__value">{currentProjectName || 'Projet sans nom'}</span>
          </div>
        ) : null}

        {currentProjectId ? (
          <button type="button" className="app-action-button" onClick={saveCurrentProject} disabled={isSaving}>
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        ) : null}

        <button
          type="button"
          className="app-secondary-button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          title={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        <button type="button" className="app-account-button" onClick={logout} title="Se déconnecter">
          <span className="app-account-button__avatar">{initials}</span>
          <span className="app-account-button__label">
            <strong>{userLabel}</strong>
            <span>Déconnexion</span>
          </span>
        </button>
      </div>
    </header>
  )
}
