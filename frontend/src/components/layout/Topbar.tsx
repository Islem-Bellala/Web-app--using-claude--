/**
 * Topbar — Atlas-themed top navigation bar (48px)
 */

import { useUIStore, useAuthStore, useProjectStore } from '../../stores'

interface TopbarProps {
  sidebarOpen: boolean
  onOpenSidebar: () => void
}

export default function Topbar({ sidebarOpen, onOpenSidebar }: TopbarProps) {
  const { theme, toggleTheme } = useUIStore()
  const { user, logout } = useAuthStore()
  const { currentProjectId, currentProjectName, isSaving, saveCurrentProject } = useProjectStore()

  const isDark = theme === 'dark'

  // User initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '?'

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-atlas-topbar dark:bg-atlas-dark-topbar">
      {/* ── Left: hamburger + flag hint + logo ──────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger — visible when sidebar is collapsed */}
        {!sidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="text-white/60 hover:text-white transition-colors text-base leading-none"
            title="Ouvrir la navigation"
          >
            ☰
          </button>
        )}

        {/* Flag hint: 3 thin vertical bars — Algerian green / white / red */}
        <div className="flex gap-0.5 h-5">
          <div className="w-1 rounded-sm bg-[#006233]" />
          <div className="w-1 rounded-sm bg-white" />
          <div className="w-1 rounded-sm bg-[#d21034]" />
        </div>

        {/* Logo */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-atlas-gold font-bold text-base font-arabic">
            بنيان
          </span>
          <span className="text-atlas-gold font-semibold text-sm tracking-wide">
            Bunyan
          </span>
        </div>

        {/* Project name */}
        {currentProjectId && currentProjectName && (
          <>
            <span className="text-white/20 text-sm">·</span>
            <span className="text-white/50 text-xs truncate max-w-48">
              {currentProjectName}
            </span>
          </>
        )}
      </div>

      {/* ── Right: save, theme, user ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Save button — only when project is open */}
        {currentProjectId && (
          <button
            type="button"
            onClick={saveCurrentProject}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-colors
              bg-atlas-gold text-atlas-green hover:bg-atlas-gold/90 disabled:opacity-60 disabled:cursor-default"
          >
            {isSaving ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-atlas-green/30 border-t-atlas-green rounded-full animate-spin" />
                Sauvegarde…
              </>
            ) : (
              'Sauvegarder'
            )}
          </button>
        )}

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-7 h-7 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? '☀' : '☽'}
        </button>

        {/* User avatar */}
        <div className="w-7 h-7 rounded-full bg-atlas-gold/20 border border-atlas-gold/40 flex items-center justify-center">
          <span className="text-atlas-gold text-xs font-semibold">{initials}</span>
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          className="text-white/40 hover:text-white/70 text-xs transition-colors px-1"
        >
          Déconnexion
        </button>
      </div>
    </header>
  )
}
