import { useUIStore } from '../../stores/uiStore'
import { useProjectStore } from '../../stores/projectStore'
import { NAV_GROUPS, PROJECT_REQUIRED } from './navigation'

export default function Sidebar() {
  const { activePage, setActivePage, setSidebarOpen } = useUIStore()
  const { currentProjectId } = useProjectStore()

  function handleSelect(page: string, disabled: boolean) {
    if (disabled) return
    setActivePage(page)
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 980px)').matches) {
      setSidebarOpen(false)
    }
  }

  return (
    <aside className="app-sidebar">
      {NAV_GROUPS.map((group) => (
        <section key={group.section} className="app-sidebar__section">
          <div className="app-sidebar__section-title">{group.section}</div>
          {group.items.map((item) => {
            const needsProject = PROJECT_REQUIRED.has(item.id)
            const disabled = !item.ready || (needsProject && !currentProjectId)
            const isActive = activePage === item.id
            const tag = !item.ready ? 'Bientôt' : needsProject && !currentProjectId ? 'Projet requis' : 'Accès'

            return (
              <button
                key={item.id}
                type="button"
                className={`app-nav-item ${isActive ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''}`.trim()}
                onClick={() => handleSelect(item.id, disabled)}
                title={disabled && needsProject ? 'Ouvrez un projet avant d’accéder à ce module.' : undefined}
              >
                <span className="app-nav-item__icon">{item.icon}</span>
                <span className="app-nav-item__label">{item.label}</span>
                <span className="app-nav-item__tag">{tag}</span>
              </button>
            )
          })}
        </section>
      ))}

      <div className="app-sidebar__footer">
        <strong>Calculs protégés</strong>
        <span>
          Cette refonte agit sur la couche interface. Les formules, les structures d’état et les appels
          backend restent inchangés.
        </span>
      </div>
    </aside>
  )
}
