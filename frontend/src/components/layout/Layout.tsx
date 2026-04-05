import type { CSSProperties } from 'react'
import SpectrumChart from '../seismic/SpectrumChart'
import CombinationsPage from '../seismic/CombinationsPage'
import SeismicVerificationPage from '../seismic/SeismicVerificationPage'
import ProjectParams from '../general/ProjectParams'
import ProjectList from '../general/ProjectList'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../../stores/uiStore'
import { useProjectStore } from '../../stores/projectStore'
import { getColors } from '../../theme'
import { PAGE_META, PROJECT_REQUIRED } from './navigation'

export default function Layout() {
  const { theme, activePage, sidebarOpen, setSidebarOpen } = useUIStore()
  const { currentProjectId } = useProjectStore()
  const isDark = theme === 'dark'
  const c = getColors(isDark)

  const meta = PAGE_META[activePage] ?? PAGE_META.default

  function renderPage() {
    if (PROJECT_REQUIRED.has(activePage) && !currentProjectId) {
      return <ProjectList c={c} />
    }

    switch (activePage) {
      case 'projects':
        return <ProjectList c={c} />
      case 'params':
        return <ProjectParams c={c} />
      case 'spectrum':
        return <SpectrumChart c={c} isDark={isDark} />
      case 'combinations':
        return <CombinationsPage c={c} />
      case 'verification':
        return <SeismicVerificationPage c={c} isDark={isDark} />
      default:
        return (
          <div className="app-empty-page">
            <div className="app-empty-page__card">
              <div className="app-empty-page__eyebrow">{meta.eyebrow}</div>
              <h1 className="app-empty-page__title">{meta.title}</h1>
              <div className="app-empty-page__description">
                {meta.description} Cette fonctionnalité reste volontairement hors du périmètre de cette passe UI.
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div
      className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}
      style={
        {
          '--shell-bg': c.bg,
          '--shell-surface': c.surface,
          '--shell-elevated': c.elevated,
          '--shell-border': c.border,
          '--shell-border-strong': c.borderLight,
          '--shell-text': c.text,
          '--shell-text-sec': c.textSec,
          '--shell-text-muted': c.textMuted,
          '--shell-blue': c.blue,
          '--shell-green': c.green,
          '--shell-amber': c.amber,
          '--shell-red': c.red,
          '--shell-purple': c.purple,
        } as CSSProperties
      }
    >
      <Topbar />
      <div className="app-shell__body">
        <Sidebar />
        <button
          type="button"
          className="app-shell__overlay"
          aria-label="Fermer la navigation"
          onClick={() => setSidebarOpen(false)}
        />
        <main className="app-main">{renderPage()}</main>
      </div>
    </div>
  )
}
