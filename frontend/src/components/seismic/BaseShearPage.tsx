import { useEffect, useRef, useState } from 'react'
import type { AppColors, BaseShearResult } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computeBaseShear } from '../../services/api'
import { BadgeStrip, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface ResultCardProps {
  label: string
  value: string | number
  unit?: string
  accent: string
  c: AppColors
}

function ResultCard({ label, value, unit, accent, c }: ResultCardProps) {
  return (
    <div
      style={{
        minWidth: 104,
        flex: 1,
        padding: '12px 14px',
        borderRadius: 18,
        border: `1px solid ${accent}30`,
        background: `${accent}10`,
      }}
    >
      <div style={{ fontSize: 10, color: c.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: accent, fontFamily: 'IBM Plex Mono, monospace' }}>
        {value}
      </div>
      {unit ? <div style={{ marginTop: 4, fontSize: 11, color: c.textSec }}>{unit}</div> : null}
    </div>
  )
}

function Check80({ label, Vdyn, Vstat, c }: { label: string; Vdyn: number | null; Vstat: number; c: AppColors }) {
  if (!Vdyn || !Vstat) {
    return <StateBanner tone="warning">{label} : effort dynamique non renseigné, contrôle 80 % indisponible.</StateBanner>
  }

  const threshold = 0.8 * Vstat
  const ok = Vdyn >= threshold
  const coeff = ok ? null : (threshold / Vdyn).toFixed(3)

  return (
    <StateBanner tone={ok ? 'success' : 'danger'}>
      {label} : {ok ? 'condition vérifiée' : 'condition non vérifiée'}.
      <br />
      Vdyn = <strong>{Vdyn.toFixed(1)} kN</strong> | 0.8 × V = <strong>{threshold.toFixed(1)} kN</strong>
      {!ok ? (
        <>
          <br />
          Coefficient de majoration à appliquer : <strong>{coeff}</strong>
        </>
      ) : null}
    </StateBanner>
  )
}

function DirectionPanel({
  dir,
  result,
  Vdyn,
  color,
  c,
}: {
  dir: string
  result: BaseShearResult | null
  Vdyn: number | null
  color: string
  c: AppColors
}) {
  if (!result) return null

  return (
    <SurfacePanel eyebrow={`Direction ${dir}`} title={`Résultats ${dir}`}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <ResultCard label="Temp" value={result.T_emp.toFixed(3)} unit="s" accent={c.purple} c={c} />
        <ResultCard label="T0" value={result.T0.toFixed(3)} unit="s" accent={color} c={c} />
        <ResultCard label="λ" value={result.lambda_coef} unit="coeff." accent={c.amber} c={c} />
        <ResultCard label="Sad/g" value={result.Sad_g.toFixed(4)} accent={c.green} c={c} />
        <ResultCard label="V" value={result.V.toFixed(1)} unit="kN" accent={c.red} c={c} />
        {result.Ft > 0 ? <ResultCard label="Ft" value={result.Ft.toFixed(1)} unit="sommet" accent={c.amber} c={c} /> : null}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: '12px 14px',
          borderRadius: 16,
          border: `1px solid ${c.border}`,
          background: c.elevated,
          color: c.textSec,
          fontFamily: 'IBM Plex Mono, monospace',
          lineHeight: 1.7,
        }}
      >
        V = <span style={{ color: c.amber }}>{result.lambda_coef}</span> × <span style={{ color: c.green }}>{result.Sad_g.toFixed(4)}</span> ×{' '}
        <span style={{ color: c.text }}>{result.W.toFixed(0)}</span> = <span style={{ color: c.red }}>{result.V.toFixed(1)} kN</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <Check80 label={`Sens ${dir}`} Vdyn={Vdyn} Vstat={result.V} c={c} />
      </div>
    </SurfacePanel>
  )
}

interface BaseShearPageProps {
  c: AppColors
}

export default function BaseShearPage({ c }: BaseShearPageProps) {
  const project = useProjectStore()
  const seismic = useSeismicStore()
  const structural = useStructuralStore()

  const [resultX, setResultX] = useState<BaseShearResult | null>(null)
  const [resultY, setResultY] = useState<BaseShearResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  function storiesPayload() {
    return [...structural.stories]
      .map((story) => ({
        name: story.name.trim(),
        elevation: parseFloat(story.elevation),
        weight: parseFloat(story.weight),
      }))
      .filter((story) => story.elevation > 0 && story.weight > 0)
      .sort((a, b) => a.elevation - b.elevation)
  }

  function isReady() {
    const stories = storiesPayload()
    return stories.length >= 1 && Math.max(...stories.map((story) => story.elevation), 0) > 0
  }

  async function fetchDirection(QF: number, R: number, TCalculated: string, signal: AbortSignal) {
    const stories = storiesPayload()
    const hn = Math.max(...stories.map((story) => story.elevation))

    return computeBaseShear(
      {
        zone: project.zone === '0' ? 'I' : project.zone,
        site_class: project.site,
        importance_group: project.group,
        QF,
        R,
        frame_system: seismic.frameSys,
        hn,
        T_calculated: TCalculated ? parseFloat(TCalculated) : null,
        stories,
      },
      signal,
    )
  }

  useEffect(() => {
    if (!isReady()) {
      setResultX(null)
      setResultY(null)
      return
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setApiErr(null)
      try {
        const [x, y] = await Promise.all([
          fetchDirection(seismic.twoDir ? seismic.QFx : seismic.QF, seismic.twoDir ? seismic.Rx : seismic.R, seismic.Tx, controller.signal),
          fetchDirection(seismic.twoDir ? seismic.QFy : seismic.QF, seismic.twoDir ? seismic.Ry : seismic.R, seismic.Ty, controller.signal),
        ])
        setResultX(x)
        setResultY(y)
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
  }, [
    project.group,
    project.site,
    project.zone,
    seismic.QF,
    seismic.QFx,
    seismic.QFy,
    seismic.R,
    seismic.Rx,
    seismic.Ry,
    seismic.Tx,
    seismic.Ty,
    seismic.frameSys,
    seismic.twoDir,
    structural.stories.map((story) => `${story.elevation}:${story.weight}`).join(','),
  ])

  const totalWeight = structural.stories.reduce((sum, story) => sum + (parseFloat(story.weight) || 0), 0)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BadgeStrip
        items={[
          { label: 'Zone', value: project.zone || '—', color: c.blue },
          { label: 'Site', value: project.site || '—', color: c.green },
          { label: 'Groupe', value: project.group || '—', color: c.purple },
          { label: 'Poids total', value: `${totalWeight.toFixed(0)} kN`, color: c.amber },
        ]}
      />

      {apiErr ? <StateBanner tone="danger">{apiErr}</StateBanner> : null}
      {loading ? <StateBanner tone="info">Calcul de l’effort tranchant en cours…</StateBanner> : null}

      {!resultX && !loading ? (
        <StateBanner tone="warning">
          Vérifiez les paramètres généraux, les niveaux et les poids du projet avant de lancer le calcul.
        </StateBanner>
      ) : null}

      {(seismic.Vxd || seismic.Vyd) ? (
        <StateBanner tone="info">
          Efforts dynamiques renseignés : {seismic.Vxd ? `Vxd = ${seismic.Vxd} kN` : 'Vxd non saisi'} |{' '}
          {seismic.Vyd ? `Vyd = ${seismic.Vyd} kN` : 'Vyd non saisi'}
        </StateBanner>
      ) : null}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <DirectionPanel dir="X" result={resultX} Vdyn={seismic.Vxd ? parseFloat(seismic.Vxd) : null} color={c.blue} c={c} />
        <DirectionPanel dir="Y" result={resultY} Vdyn={seismic.Vyd ? parseFloat(seismic.Vyd) : null} color={c.purple} c={c} />
      </div>
    </div>
  )
}
