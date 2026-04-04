import { useUIStore } from '../../stores/uiStore'
import { useAuthStore } from '../../stores/authStore'
import { useProjectStore } from '../../stores/projectStore'
import { getColors } from '../../theme'

// Pages that require an open project before they can be accessed
const PROJECT_REQUIRED = new Set(['params', 'spectrum', 'combinations', 'verification'])

interface NavItem { id: string; label: string; icon: string; ready: boolean }
interface NavGroup { section: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    section: 'Général',
    items: [
      { id:'projects', label:'Projets',             icon:'📁', ready:true },
      { id:'params',   label:'Paramètres généraux', icon:'⚙️', ready:true },
    ],
  },
  {
    section: 'Sismique — RPA 2024',
    items: [
      { id:'spectrum',     label:'Spectre de réponse',    icon:'📈', ready:true  },
      { id:'combinations', label:'Combinaisons',           icon:'🔗', ready:true  },
      { id:'verification', label:'Vérification sismique',  icon:'✅', ready:true  },
    ],
  },
  {
    section: 'Ferraillage BA',
    items: [
      { id:'beams',   label:'Poutres — CBA93', icon:'🏗️', ready:false },
      { id:'columns', label:'Poteaux — CBA93', icon:'🏛️', ready:false },
      { id:'walls',   label:'Voiles — CBA93',  icon:'🧱', ready:false },
    ],
  },
  {
    section: 'Connexion',
    items: [
      { id:'robot', label:'Robot Structural', icon:'🔌', ready:false },
      { id:'etabs', label:'ETABS',            icon:'🔌', ready:false },
    ],
  },
]

export default function Sidebar() {
  const { theme, activePage, setActivePage, toggleTheme } = useUIStore()
  const { logout } = useAuthStore()
  const { currentProjectId } = useProjectStore()

  const isDark = theme === 'dark'
  const c = getColors(isDark)

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: c.surface,
      borderRight: `1px solid ${c.border}`,
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 6 }}>
            <div style={{
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: c.textMuted, padding: '10px 18px 5px',
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const isActive = item.id === activePage
              const needsProject = PROJECT_REQUIRED.has(item.id)
              const disabled = !item.ready || (needsProject && !currentProjectId)
              return (
                <button type="button" key={item.id}
                  onClick={() => !disabled && setActivePage(item.id)}
                  title={needsProject && !currentProjectId ? 'Ouvrez un projet d\'abord' : undefined}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 9, padding: '8px 18px',
                    background: isActive ? (isDark ? '#1e3a5f' : '#dbeafe') : 'transparent',
                    border: 'none',
                    borderLeft: isActive ? `2px solid ${c.blue}` : '2px solid transparent',
                    color: disabled ? c.textMuted : (isActive ? c.blue : c.textSec),
                    cursor: disabled ? 'default' : 'pointer',
                    fontSize: 13, textAlign: 'left',
                    opacity: needsProject && !currentProjectId ? 0.5 : 1,
                  }}>
                  <span style={{ fontSize: 14 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {!item.ready && (
                    <span style={{
                      fontSize: 9, background: c.elevated,
                      color: c.textMuted, borderRadius: 4, padding: '2px 5px',
                    }}>
                      BIENTÔT
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{
        padding: '12px 18px', borderTop: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button type="button" onClick={logout} style={{
          background: 'none', border: 'none', color: c.textMuted,
          cursor: 'pointer', fontSize: 12, padding: 0,
        }}>
          Déconnexion
        </button>
        <button type="button" onClick={toggleTheme} style={{
          background: c.elevated, border: `1px solid ${c.border}`,
          borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
          color: c.textSec, fontSize: 12,
        }}>
          {isDark ? '☀️ Clair' : '🌙 Sombre'}
        </button>
      </div>
    </aside>
  )
}
