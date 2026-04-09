import { useEffect, useRef, useState } from 'react'
import type { AppColors, CombinationsResponse, CombinationOut } from '../../types'
import { useProjectStore } from '../../stores'
import { computeCombinations } from '../../services/api'
import { BadgeStrip, PageHero, PageShell, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface ComboRowProps {
  combo: CombinationOut
  idx: number
  c: AppColors
}

function ComboRow({ combo, idx, c }: ComboRowProps) {
  const isHorizontal = combo.seismic_id === 'E1' || combo.seismic_id === 'E2'
  const color = isHorizontal ? c.blue : c.purple

  function formatCoeff(value: number) {
    if (value === 0) return '—'
    return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '36px 60px minmax(220px, 1fr) 56px 56px 56px',
        gap: 8,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 14,
        border: `1px solid ${color}22`,
        background: `${color}10`,
      }}
    >
      <div style={{ fontSize: 11, color: c.textMuted, fontFamily: 'IBM Plex Mono, monospace', textAlign: 'right' }}>
        {idx + 1}
      </div>
      <div
        style={{
          padding: '5px 8px',
          borderRadius: 999,
          background: `${color}18`,
          color,
          fontSize: 11,
          fontWeight: 700,
          textAlign: 'center',
          fontFamily: 'IBM Plex Mono, monospace',
        }}
      >
        {combo.id}
      </div>
      <div style={{ fontSize: 12, color: c.text, fontFamily: 'IBM Plex Mono, monospace' }}>{combo.label}</div>
      <div style={{ textAlign: 'center', color: combo.ex_coeff !== 0 ? c.blue : c.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
        {formatCoeff(combo.ex_coeff)}
      </div>
      <div style={{ textAlign: 'center', color: combo.ey_coeff !== 0 ? c.purple : c.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
        {formatCoeff(combo.ey_coeff)}
      </div>
      <div style={{ textAlign: 'center', color: combo.ez_coeff !== 0 ? c.amber : c.textMuted, fontFamily: 'IBM Plex Mono, monospace' }}>
        {formatCoeff(combo.ez_coeff)}
      </div>
    </div>
  )
}

interface CombinationsPageProps {
  c: AppColors
}

export default function CombinationsPage({ c }: CombinationsPageProps) {
  const project = useProjectStore()

  const [result, setResult] = useState<CombinationsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const isReady = !!project.zone && !!project.group && project.zone !== '0'

  useEffect(() => {
    if (!isReady) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setApiErr(null)
      try {
        const response = await computeCombinations(
          { zone: project.zone, group: project.group, psi: project.psi },
          controller.signal,
        )
        setResult(response)
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') return
        const message = (error as Error).message.toLowerCase()
        setApiErr(
          message.includes('failed to fetch') || message.includes('network')
            ? 'Backend non démarré - lancez `uvicorn backend.main:app --reload --port 8000`.'
            : (error as Error).message,
        )
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [isReady, project.group, project.psi, project.zone])

  return (
    <PageShell c={c}>
      <PageHero
        eyebrow="Charges sismiques"
        title="Combinaisons automatiques"
        description="Surveillez rapidement l’impact de la zone sismique, du groupe d’importance et du coefficient ψ sur les combinaisons réglementaires actives."
        aside={<>La composante verticale n’est ajoutée que lorsque le seuil réglementaire Av·I l’exige.</>}
      />

      <BadgeStrip
        items={[
          { label: 'Zone', value: project.zone || '—', color: c.blue },
          { label: 'Groupe', value: project.group || '—', color: c.purple },
          { label: 'ψ', value: project.psi.toFixed(2), color: c.amber },
        ]}
      />

      {!isReady ? (
        <StateBanner tone="warning">
          Définissez d’abord la zone sismique et le groupe d’importance dans les paramètres généraux avant d’ouvrir cette vue.
        </StateBanner>
      ) : null}

      {apiErr ? <StateBanner tone="danger">{apiErr}</StateBanner> : null}
      {loading ? <StateBanner tone="info">Calcul des combinaisons en cours…</StateBanner> : null}

      {result ? (
        <>
          <BadgeStrip
            items={[
              { label: 'Av·I', value: result.av_i.toFixed(3), color: result.include_vertical ? c.red : c.green },
              { label: 'Composante verticale', value: result.include_vertical ? 'Oui' : 'Non', color: result.include_vertical ? c.red : c.green },
              { label: 'Combinaisons', value: String(result.total_count), color: c.blue },
            ]}
          />

          {result.include_vertical ? (
            <StateBanner tone="warning">
              La composante verticale est incluse : Av·I = <strong>{result.av_i.toFixed(3)}</strong> &gt; 0.25.
            </StateBanner>
          ) : null}

          <SurfacePanel eyebrow="Tableau de sortie" title="Liste des combinaisons" flushTop>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 60px minmax(220px, 1fr) 56px 56px 56px',
                gap: 8,
                padding: '0 12px 10px',
                color: c.textMuted,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              <div style={{ textAlign: 'right' }}>N°</div>
              <div style={{ textAlign: 'center' }}>Réf.</div>
              <div>Combinaison</div>
              <div style={{ textAlign: 'center', color: c.blue }}>Ex</div>
              <div style={{ textAlign: 'center', color: c.purple }}>Ey</div>
              <div style={{ textAlign: 'center', color: c.amber }}>Ez</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {result.combinations.map((combo, idx) => (
                <ComboRow key={combo.id} combo={combo} idx={idx} c={c} />
              ))}
            </div>
          </SurfacePanel>
        </>
      ) : null}
    </PageShell>
  )
}
