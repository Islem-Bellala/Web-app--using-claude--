/**
 * StructCalc — Main Application
 * ================================
 * Root component with sidebar navigation.
 * Each page is a separate module — easy to add new ones.
 *
 * Current pages:
 *   - Spectre RPA 2024  ← Session 2
 *
 * Coming soon:
 *   - Effort tranchant V
 *   - Combinaisons sismiques
 *   - Ferraillage CBA93
 *   - Dashboard de vérification
 */

import { useState } from 'react'
import SpectrumChart from './components/seismic/SpectrumChart.jsx'

// ─── Navigation items ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    section: 'Sismique — RPA 2024',
    items: [
      { id: 'spectrum',     label: 'Spectre de réponse',   icon: '📈', ready: true },
      { id: 'base_shear',   label: 'Effort tranchant V',   icon: '⚡', ready: false },
      { id: 'combinations', label: 'Combinaisons',         icon: '🔗', ready: false },
    ]
  },
  {
    section: 'Ferraillage BA',
    items: [
      { id: 'beams',   label: 'Poutres — CBA93',   icon: '🏗️', ready: false },
      { id: 'columns', label: 'Poteaux — CBA93',   icon: '🏛️', ready: false },
      { id: 'walls',   label: 'Voiles — CBA93',    icon: '🧱', ready: false },
    ]
  },
  {
    section: 'Connexion',
    items: [
      { id: 'robot', label: 'Robot Structural', icon: '🔌', ready: false },
      { id: 'etabs', label: 'ETABS',            icon: '🔌', ready: false },
    ]
  },
]

// ─── Page renderer ────────────────────────────────────────────────────────────

function renderPage(pageId) {
  switch (pageId) {
    case 'spectrum':   return <SpectrumChart />
    default:           return <ComingSoon pageId={pageId} />
  }
}

// ─── Coming Soon placeholder ─────────────────────────────────────────────────

function ComingSoon({ pageId }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 16, color: 'var(--text-muted)',
    }}>
      <div style={{ fontSize: 48 }}>🚧</div>
      <div style={{ fontSize: 18, color: 'var(--text-secondary)', fontWeight: 600 }}>
        En développement
      </div>
      <div style={{ fontSize: 13 }}>
        Module <code style={{ color: 'var(--accent-blue)' }}>{pageId}</code> — Session prochaine
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: 20, fontWeight: 700,
          background: 'linear-gradient(135deg, #f8fafc, #94a3b8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}>
          StructCalc
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
          RPA 2024 · CBA93 · BAEL91
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {NAV_ITEMS.map(group => (
          <div key={group.section} style={{ marginBottom: 8 }}>

            {/* Section label */}
            <div style={{
              fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--text-muted)', padding: '10px 20px 6px',
            }}>
              {group.section}
            </div>

            {/* Items */}
            {group.items.map(item => {
              const isActive = item.id === activePage
              return (
                <button
                  key={item.id}
                  onClick={() => item.ready && onNavigate(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    gap: 10, padding: '9px 20px',
                    background: isActive ? '#1e3a5f' : 'transparent',
                    border: 'none',
                    borderLeft: isActive
                      ? '2px solid var(--accent-blue)'
                      : '2px solid transparent',
                    color: item.ready
                      ? (isActive ? 'var(--text-primary)' : 'var(--text-secondary)')
                      : 'var(--text-muted)',
                    cursor: item.ready ? 'pointer' : 'default',
                    fontSize: 13, textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {!item.ready && (
                    <span style={{
                      fontSize: 9, letterSpacing: '0.05em',
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-muted)',
                      borderRadius: 4, padding: '2px 5px',
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

      {/* Footer */}
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11, color: 'var(--text-muted)',
      }}>
        v0.1.0 — Session 3
      </div>
    </aside>
  )
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [activePage, setActivePage] = useState('spectrum')

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      {/* Main content */}
      <main style={{
        flex: 1, overflowY: 'auto',
        background: 'var(--bg-base)',
      }}>
        {renderPage(activePage)}
      </main>

    </div>
  )
}
