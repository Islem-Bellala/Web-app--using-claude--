import { useEffect } from 'react'
import LoginPage from './components/auth/LoginPage'
import Layout from './components/layout/Layout'
import { useUIStore, useAuthStore } from './stores'
import { getColors } from './theme'

export default function App() {
  const { theme } = useUIStore()
  const { isAuthenticated, isInitializing, checkAuth } = useAuthStore()

  const isDark = theme === 'dark'
  const c = getColors(isDark)

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isInitializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background:
            'radial-gradient(circle at top, rgba(37, 99, 235, 0.14), transparent 32%), ' + c.bg,
        }}
      >
        <div
          style={{
            width: 'min(420px, 100%)',
            padding: 28,
            borderRadius: 24,
            border: `1px solid ${c.border}`,
            background: c.surface,
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: `3px solid ${c.border}`,
              borderTopColor: c.blue,
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.blue, fontWeight: 700 }}>
            Initialisation
          </div>
          <div style={{ fontSize: 24, lineHeight: 1.1, margin: '10px 0 8px', color: c.text, fontWeight: 700 }}>
            Vérification de la session
          </div>
          <div style={{ color: c.textSec, fontSize: 14, lineHeight: 1.6 }}>
            Bunyan prépare votre environnement de travail et recharge les accès sécurisés.
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage c={c} isDark={isDark} />
  }

  return <Layout />
}
