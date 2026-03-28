/**
 * Sidebar — Atlas-themed navigation sidebar (200px, collapsible)
 * Grouped by design code.
 */

import { useUIStore } from '../../stores'

interface NavItem {
  id: string
  label: string
  ready: boolean
}

interface NavGroup {
  section: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    section: 'Général',
    items: [
      { id: 'params',   label: 'Paramètres',       ready: true  },
    ],
  },
  {
    section: 'Sismique — RPA 2024',
    items: [
      { id: 'spectrum',   label: 'Spectre de réponse', ready: true  },
      { id: 'base_shear', label: 'Effort tranchant',   ready: true  },
    ],
  },
  {
    section: 'Béton armé',
    items: [
      { id: 'beams',   label: 'Poutres',  ready: false },
      { id: 'columns', label: 'Poteaux',  ready: false },
      { id: 'walls',   label: 'Voiles',   ready: false },
    ],
  },
]

export default function Sidebar() {
  const { activePage, sidebarOpen, setActivePage, setSidebarOpen } = useUIStore()

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-200
        bg-atlas-sidebar dark:bg-atlas-dark-sidebar
        border-r border-atlas-border dark:border-atlas-dark-border"
      className={sidebarOpen ? 'w-[200px]' : 'w-0'}
    >
      {/* Hamburger toggle inside sidebar header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-atlas-border dark:border-atlas-dark-border">
        <span className="text-xs uppercase tracking-widest text-atlas-text-muted dark:text-atlas-dark-text-muted font-medium">
          Navigation
        </span>
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="text-atlas-text-muted dark:text-atlas-dark-text-muted hover:text-atlas-text dark:hover:text-atlas-dark-text transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV.map(group => (
          <div key={group.section} className="mb-1">
            {/* Section header */}
            <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-[0.12em] text-atlas-text-muted dark:text-atlas-dark-text-muted select-none">
              {group.section}
            </div>

            {/* Items */}
            {group.items.map(item => {
              const isActive = item.id === activePage
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => item.ready && setActivePage(item.id)}
                  className={[
                    'w-full flex items-center gap-2 px-4 py-2 text-xs text-left transition-colors border-l-[3px]',
                    isActive
                      ? 'border-atlas-gold bg-atlas-gold/10 text-atlas-text dark:text-atlas-dark-text font-medium'
                      : item.ready
                      ? 'border-transparent text-atlas-text-sec dark:text-atlas-dark-text-sec hover:bg-atlas-gold/5 hover:text-atlas-text dark:hover:text-atlas-dark-text cursor-pointer'
                      : 'border-transparent text-atlas-text-muted dark:text-atlas-dark-text-muted cursor-default',
                  ].join(' ')}
                >
                  <span className="flex-1 leading-none">{item.label}</span>
                  {!item.ready && (
                    <span className="text-[9px] bg-atlas-border dark:bg-atlas-dark-border text-atlas-text-muted dark:text-atlas-dark-text-muted rounded px-1 py-0.5 uppercase tracking-wide leading-none">
                      Bientôt
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Mes projets */}
      <div className="border-t border-atlas-border dark:border-atlas-dark-border">
        <button
          type="button"
          onClick={() => setActivePage('projects')}
          className={[
            'w-full flex items-center gap-2 px-4 py-3 text-xs text-left transition-colors border-l-[3px]',
            activePage === 'projects'
              ? 'border-atlas-gold bg-atlas-gold/10 text-atlas-text dark:text-atlas-dark-text font-medium'
              : 'border-transparent text-atlas-text-sec dark:text-atlas-dark-text-sec hover:bg-atlas-gold/5 hover:text-atlas-text dark:hover:text-atlas-dark-text',
          ].join(' ')}
        >
          <span>Mes projets</span>
        </button>
      </div>
    </aside>
  )
}
