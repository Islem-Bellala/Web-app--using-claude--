import { useEffect } from 'react'
import LoginPage from './components/auth/LoginPage'
import Layout from './components/layout/Layout'
import { useUIStore, useAuthStore } from './stores'
import { getColors } from './theme'

export default function App() {
  const { theme } = useUIStore()
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()

  const isDark = theme === 'dark'
  const c = getColors(isDark)

  useEffect(() => { checkAuth() }, [])

  if (isLoading) {
    return (
      <div style={{ display:'flex', height:'100vh', alignItems:'center', justifyContent:'center', background:c.bg }}>
        <span style={{ color:c.textMuted, fontSize:14 }}>Chargement…</span>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage c={c} isDark={isDark} />
  }

  return <Layout />
}
