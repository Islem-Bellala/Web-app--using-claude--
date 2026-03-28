/**
 * Bunyan — App entry (Phase 6)
 * Auth gate → Layout shell → page routing.
 * All state lives in Zustand stores; no prop drilling of colors.
 */

import { useEffect } from 'react'
import Layout from './components/layout/Layout'
import SpectrumChart from './components/seismic/SpectrumChart'
import BaseShearPage from './components/seismic/BaseShearPage'
import ProjectParams from './components/general/ProjectParams'
import ProjectList from './components/general/ProjectList'
import LoginPage from './components/auth/LoginPage'
import { useUIStore, useAuthStore } from './stores'

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-atlas-text-muted dark:text-atlas-dark-text-muted">
      <div className="text-5xl">🚧</div>
      <div className="text-base font-medium text-atlas-text-sec dark:text-atlas-dark-text-sec">En développement</div>
      <div className="text-sm">Session prochaine</div>
    </div>
  )
}

function PageContent() {
  const { activePage } = useUIStore()
  switch (activePage) {
    case 'projects':   return <ProjectList />
    case 'params':     return <ProjectParams />
    case 'spectrum':   return <SpectrumChart />
    case 'base_shear': return <BaseShearPage />
    default:           return <ComingSoon />
  }
}

export default function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => { checkAuth() }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-atlas-bg dark:bg-atlas-dark-bg">
        <span className="text-sm text-atlas-text-muted dark:text-atlas-dark-text-muted">Chargement…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Layout>
      <PageContent />
    </Layout>
  )
}
