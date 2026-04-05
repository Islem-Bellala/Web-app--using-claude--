import { useState } from 'react'
import type { AppColors } from '../../types'
import BaseShearPage from './BaseShearPage'
import DisplacementsTab from './DisplacementsTab'
import PDeltaTab from './PDeltaTab'
import OverturningTab from './OverturningTab'
import { BadgeStrip, PageHero, PageShell } from '../shared/PageChrome'

interface Props {
  c: AppColors
  isDark: boolean
}

type Tab = 'effort-v' | 'deplacements' | 'p-delta' | 'renversement'

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: 'effort-v', label: 'Effort V', description: 'Effort tranchant à la base' },
  { id: 'deplacements', label: 'Déplacements', description: 'Contrôle inter-étages et dérives' },
  { id: 'p-delta', label: 'P-delta', description: 'Indice de stabilité et amplification' },
  { id: 'renversement', label: 'Renversement', description: 'Stabilité au renversement et glissement' },
]

export default function SeismicVerificationPage({ c, isDark }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('effort-v')
  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

  return (
    <PageShell c={c} className="page-shell--tight">
      <PageHero
        eyebrow="Vérifications sismiques"
        title="Contrôles RPA 2024"
        description="Passez d’un contrôle à l’autre dans un flux continu, avec le même niveau de lisibilité pour les entrées, les états et les verdicts."
        aside={<>Module actif : <strong>{active.label}</strong><br />{active.description}</>}
      />

      <BadgeStrip
        items={[
          { label: 'Contrôles', value: '4 modules', color: c.blue },
          { label: 'Cadre', value: 'RPA 2024', color: c.green },
          { label: 'Vue active', value: active.label, color: c.purple },
        ]}
      />

      <div className="verification-tabs" style={{ ...({ '--page-blue': c.blue } as React.CSSProperties), marginBottom: 16 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`verification-tab ${tab.id === activeTab ? 'is-active' : ''}`.trim()}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ minHeight: 0 }}>
        {activeTab === 'effort-v' ? <BaseShearPage c={c} /> : null}
        {activeTab === 'deplacements' ? <DisplacementsTab c={c} isDark={isDark} /> : null}
        {activeTab === 'p-delta' ? <PDeltaTab c={c} isDark={isDark} /> : null}
        {activeTab === 'renversement' ? <OverturningTab c={c} isDark={isDark} /> : null}
      </div>
    </PageShell>
  )
}
