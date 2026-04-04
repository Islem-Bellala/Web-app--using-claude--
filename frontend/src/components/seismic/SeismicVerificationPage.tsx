/**
 * Bunyan — Seismic Verification Page (RPA 2024)
 * 4 horizontal tabs:
 *   1. Effort V       — base shear (embeds BaseShearPage)
 *   2. Déplacements   — §4.5.2 + §5.10 displacement check
 *   3. P-Δ            — §5.9 stability index
 *   4. Renversement   — §5.5 overturning + sliding
 */

import { useState } from 'react'
import type { AppColors } from '../../types'
import BaseShearPage from './BaseShearPage'
import DisplacementsTab from './DisplacementsTab'
import PDeltaTab from './PDeltaTab'
import OverturningTab from './OverturningTab'

interface Props {
  c: AppColors
  isDark: boolean
}

type Tab = 'effort-v' | 'deplacements' | 'p-delta' | 'renversement'

const TABS: { id: Tab; label: string }[] = [
  { id: 'effort-v',      label: 'Effort V'       },
  { id: 'deplacements',  label: 'Déplacements'   },
  { id: 'p-delta',       label: 'P-Δ'            },
  { id: 'renversement',  label: 'Renversement'   },
]

export default function SeismicVerificationPage({ c, isDark }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('effort-v')

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: c.bg, overflow: 'hidden',
      fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
    }}>
      {/* Page header */}
      <div style={{ padding: '16px 16px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', color: c.blue,
          textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>
          BUNYAN — VÉRIFICATIONS SISMIQUES
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 12px', color: c.text }}>
          Vérification sismique — RPA 2024
        </h1>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: `1px solid ${c.border}`,
        }}>
          {TABS.map(tab => {
            const isActive = tab.id === activeTab
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${c.blue}` : '2px solid transparent',
                  color: isActive ? c.blue : c.textSec,
                  fontWeight: isActive ? 700 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  marginBottom: -1,
                  transition: 'color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = c.text
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = c.textSec
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content — scrolls independently */}
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {activeTab === 'effort-v' && (
          <div style={{ height: '100%', overflow: 'hidden' }}>
            <BaseShearPage c={c} />
          </div>
        )}
        {activeTab === 'deplacements' && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <DisplacementsTab c={c} isDark={isDark} />
          </div>
        )}
        {activeTab === 'p-delta' && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <PDeltaTab c={c} isDark={isDark} />
          </div>
        )}
        {activeTab === 'renversement' && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            <OverturningTab c={c} isDark={isDark} />
          </div>
        )}
      </div>
    </div>
  )
}
