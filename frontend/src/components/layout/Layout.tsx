import SpectrumChart from '../seismic/SpectrumChart'
import BaseShearPage from '../seismic/BaseShearPage'
import CombinationsPage from '../seismic/CombinationsPage'
import ProjectParams from '../general/ProjectParams'
import ProjectList from '../general/ProjectList'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../../stores/uiStore'
import { useProjectStore } from '../../stores/projectStore'
import { getColors } from '../../theme'
import type { AppColors } from '../../types'

const PROJECT_REQUIRED = new Set(['params', 'spectrum', 'base_shear', 'combinations'])

function ComingSoon({ c }: { c: AppColors }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 14, color: c.textMuted,
    }}>
      <div style={{ fontSize: 44 }}>🚧</div>
      <div style={{ fontSize: 17, color: c.textSec, fontWeight: 600 }}>En développement</div>
      <div style={{ fontSize: 13 }}>Session prochaine</div>
    </div>
  )
}

export default function Layout() {
  const { theme, activePage } = useUIStore()
  const { currentProjectId } = useProjectStore()
  const isDark = theme === 'dark'
  const c = getColors(isDark)

  function renderPage() {
    // If the requested page needs a project but none is open, fall back to the list
    if (PROJECT_REQUIRED.has(activePage) && !currentProjectId) {
      return <ProjectList c={c} />
    }
    switch (activePage) {
      case 'projects':     return <ProjectList      c={c} />
      case 'params':       return <ProjectParams    c={c} />
      case 'spectrum':     return <SpectrumChart    c={c} isDark={isDark} />
      case 'base_shear':   return <BaseShearPage    c={c} />
      case 'combinations': return <CombinationsPage c={c} />
      default:             return <ComingSoon c={c} />
    }
  }

  return (
    <div style={{
      height: '100vh', width: '100vw', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: c.bg, transition: 'background 0.2s',
    }}>
      <Topbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
