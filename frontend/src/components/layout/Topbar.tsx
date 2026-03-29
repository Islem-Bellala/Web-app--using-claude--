import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useProjectStore } from '../../stores/projectStore'
import { getColors } from '../../theme'

export default function Topbar() {
  const { theme, toggleTheme } = useUIStore()
  const { user, logout } = useAuthStore()
  const { currentProjectId, currentProjectName, isSaving, saveCurrentProject } = useProjectStore()

  const isDark = theme === 'dark'
  const c = getColors(isDark)

  const initials = user
    ? (user.full_name ?? user.email).slice(0, 2).toUpperCase()
    : '?'

  return (
    <header style={{
      height: 48, flexShrink: 0,
      background: c.surface,
      borderBottom: `1px solid ${c.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 16px', gap: 12,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: c.text, letterSpacing: '-0.02em', lineHeight: 1 }}>
          بنيان Bunyan
        </span>
        <span style={{ fontSize: 9, color: c.textMuted, marginTop: 1 }}>
          RPA 2024 · CBA93 · BAEL91
        </span>
      </div>

      {/* Project name — center */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {currentProjectId && (
          <span style={{ fontSize: 13, color: c.textSec }}>
            Projet : <strong style={{ color: c.text }}>{currentProjectName}</strong>
          </span>
        )}
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {currentProjectId && (
          <button type="button" onClick={saveCurrentProject} disabled={isSaving} style={{
            background: isSaving ? c.borderLight : c.green,
            border: 'none', borderRadius: 6, padding: '4px 12px',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: isSaving ? 'default' : 'pointer',
          }}>
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
        )}

        <button type="button" onClick={toggleTheme} style={{
          background: c.elevated, border: `1px solid ${c.border}`,
          borderRadius: 7, padding: '4px 10px', cursor: 'pointer',
          color: c.textSec, fontSize: 12,
        }}>
          {isDark ? '☀️' : '🌙'}
        </button>

        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: c.blue, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {initials}
        </div>

        <button type="button" onClick={logout} style={{
          background: 'none', border: 'none', color: c.textMuted,
          cursor: 'pointer', fontSize: 12, padding: 0,
        }}>
          Déconnexion
        </button>
      </div>
    </header>
  )
}
