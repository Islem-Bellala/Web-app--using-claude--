import { useEffect, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { AppColors, SpectrumPoint } from '../../types'
import { useProjectStore, useSeismicStore } from '../../stores'
import { computeSpectrum } from '../../services/api'
import { BadgeStrip, PageHero, PageShell, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface SpectrumBranchState {
  A: number | string
  I: number | string
  S: number | string
  T1: number | string
  T2: number | string
  T3: number | string
  peak: number
  floor: number
  pts: SpectrumPoint[]
}

interface VerticalBranchState {
  Av?: number | string
  I?: number | string
  T1: number | string
  T2: number | string
  T3: number | string
  peak: number
  floor: number
  pts: SpectrumPoint[]
}

interface SpectrumState {
  hData: SpectrumBranchState
  vData: VerticalBranchState
  spectrum_type: string
}

const TYPE1_ZONES = new Set(['IV', 'V', 'VI'])

const EMPTY_H: SpectrumBranchState = {
  A: '—',
  I: '—',
  S: '—',
  T1: '—',
  T2: '—',
  T3: '—',
  peak: 0,
  floor: 0,
  pts: [],
}

const EMPTY_V: VerticalBranchState = {
  T1: '—',
  T2: '—',
  T3: '—',
  peak: 0,
  floor: 0,
  pts: [],
}

function MetricCard({
  label,
  value,
  unit,
  accent,
  c,
}: {
  label: string
  value: number | string
  unit?: string
  accent: string
  c: AppColors
}) {
  return (
    <div
      style={{
        minWidth: 108,
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
      <div style={{ marginTop: 8, fontSize: 24, fontWeight: 700, color: accent, fontFamily: 'IBM Plex Mono, monospace' }}>
        {value}
      </div>
      {unit ? <div style={{ marginTop: 4, fontSize: 11, color: c.textSec }}>{unit}</div> : null}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  c,
}: {
  active?: boolean
  payload?: Array<{ payload: SpectrumPoint }>
  c: AppColors
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${c.border}`,
        background: c.surface,
        padding: '10px 12px',
        boxShadow: '0 18px 38px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div style={{ color: c.textSec, fontSize: 12 }}>
        T = <strong style={{ color: c.text }}>{point.T.toFixed(2)} s</strong>
      </div>
      <div style={{ color: c.textSec, fontSize: 12, marginTop: 4 }}>
        Sa/g = <strong style={{ color: c.green }}>{point.Sa_g.toFixed(4)}</strong>
      </div>
    </div>
  )
}

function SpectrumPanel({
  data,
  color,
  T1,
  T2,
  T3,
  floor,
  peak,
  label,
  subtitle,
  c,
}: {
  data: SpectrumPoint[]
  color: string
  T1: number | string
  T2: number | string
  T3: number | string
  floor: number
  peak: number
  label: string
  subtitle: string
  c: AppColors
}) {
  return (
    <SurfacePanel eyebrow={subtitle} title={label} flushTop>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <MetricCard label="Palier" value={peak.toFixed(3)} accent={color} c={c} />
        <MetricCard label="Plancher" value={floor.toFixed(3)} accent={c.amber} c={c} />
        <MetricCard label="T1" value={T1} unit="s" accent={c.textSec} c={c} />
        <MetricCard label="T2" value={T2} unit="s" accent={c.textSec} c={c} />
        <MetricCard label="T3" value={T3} unit="s" accent={c.textSec} c={c} />
      </div>
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 10, bottom: 22, left: 4 }}>
            <CartesianGrid stroke={c.border} strokeDasharray="4 4" />
            <XAxis
              dataKey="T"
              type="number"
              domain={[0, 4]}
              ticks={[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]}
              tick={{ fill: c.textSec, fontSize: 10 }}
              label={{ value: 'T (s)', position: 'insideBottom', offset: -12, fill: c.textSec, fontSize: 10 }}
            />
            <YAxis
              tick={{ fill: c.textSec, fontSize: 10 }}
              label={{ value: 'Sa/g', angle: -90, position: 'insideLeft', offset: 13, fill: c.textSec, fontSize: 10 }}
            />
            <Tooltip content={<ChartTooltip c={c} />} />
            <ReferenceLine x={typeof T1 === 'number' ? T1 : undefined} stroke={c.borderLight} strokeDasharray="4 3" />
            <ReferenceLine x={typeof T2 === 'number' ? T2 : undefined} stroke={c.borderLight} strokeDasharray="4 3" />
            <ReferenceLine x={typeof T3 === 'number' ? T3 : undefined} stroke={c.borderLight} strokeDasharray="4 3" />
            <ReferenceLine y={peak} stroke={`${c.red}55`} strokeDasharray="3 3" />
            <ReferenceLine y={floor} stroke={`${c.amber}55`} strokeDasharray="3 3" />
            <Line dataKey="Sa_g" dot={false} strokeWidth={2.5} stroke={color} isAnimationActive animationDuration={280} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SurfacePanel>
  )
}

function exportTxt(data: SpectrumBranchState | VerticalBranchState, filename: string) {
  const lines = data.pts.map((point) => point.T.toFixed(2).padEnd(10) + point.Sa_g.toFixed(6))
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

interface SpectrumChartProps {
  c: AppColors
  isDark: boolean
}

export default function SpectrumChart({ c }: SpectrumChartProps) {
  const project = useProjectStore()
  const seismic = useSeismicStore()

  const [specX, setSpecX] = useState<SpectrumState | null>(null)
  const [specY, setSpecY] = useState<SpectrumState | null>(null)
  const [specV, setSpecV] = useState<SpectrumState | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState<string | null>(null)

  const zone = project.zone === '0' ? 'I' : project.zone
  const isZone0 = project.zone === '0'

  useEffect(() => {
    const controller = new AbortController()

    async function fetchOne(QF: number, R: number, setState: (next: SpectrumState) => void) {
      const data = await computeSpectrum(
        { zone, site_class: project.site, importance_group: project.group, QF, R, T_step: 0.01 },
        controller.signal,
      )

      setState({
        hData: {
          A: data.A,
          I: data.I,
          S: data.S,
          T1: data.horizontal.T1,
          T2: data.horizontal.T2,
          T3: data.horizontal.T3,
          peak: data.horizontal.peak,
          floor: data.horizontal.floor,
          pts: data.horizontal.points,
        },
        vData: {
          Av: data.Av,
          I: data.I,
          T1: data.vertical.T1,
          T2: data.vertical.T2,
          T3: data.vertical.T3,
          peak: data.vertical.peak,
          floor: data.vertical.floor,
          pts: data.vertical.points,
        },
        spectrum_type: data.spectrum_type,
      })
    }

    async function fetchAll() {
      setLoading(true)
      setApiErr(null)
      try {
        if (!seismic.twoDir) {
          await fetchOne(seismic.QF, seismic.R, (next) => {
            setSpecX(next)
            setSpecV(next)
          })
          setSpecY(null)
        } else {
          await Promise.all([
            fetchOne(seismic.QFx, seismic.Rx, setSpecX),
            fetchOne(seismic.QFy, seismic.Ry, (next) => {
              setSpecY(next)
              setSpecV(next)
            }),
          ])
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          const message = (error as Error).message.toLowerCase()
          setApiErr(
            message.includes('failed to fetch') || message.includes('network')
              ? 'Backend non démarré - lancez `uvicorn backend.main:app --reload --port 8000`.'
              : (error as Error).message,
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    return () => controller.abort()
  }, [
    project.group,
    project.site,
    seismic.QF,
    seismic.QFx,
    seismic.QFy,
    seismic.R,
    seismic.Rx,
    seismic.Ry,
    seismic.twoDir,
    zone,
  ])

  const isType1 = TYPE1_ZONES.has(zone)
  const hX = specX?.hData ?? EMPTY_H
  const hY = specY?.hData ?? EMPTY_H
  const vertical = specV?.vData ?? EMPTY_V

  return (
    <PageShell c={c}>
      <PageHero
        eyebrow="Analyse spectrale"
        title="Spectre de réponse de calcul"
        description="Visualisez les composantes horizontales et verticales avec une lecture plus claire des paramètres réglementaires, des paliers et des périodes de transition."
        aside={
          <>
            Type de spectre : <strong>{isType1 ? 'Type 1' : 'Type 2'}</strong>
            <br />
            {isZone0 ? 'Zone 0 - spectre indicatif uniquement.' : 'Les points sont recalculés automatiquement à chaque changement d’entrée.'}
          </>
        }
      />

      <BadgeStrip
        items={[
          { label: 'Zone', value: project.zone || '—', color: c.blue },
          { label: 'Site', value: project.site || '—', color: c.green },
          { label: 'Groupe', value: project.group || '—', color: c.purple },
          { label: 'Mode', value: seismic.twoDir ? 'X / Y séparées' : 'Direction unique', color: c.text },
        ]}
      />

      {isZone0 ? <StateBanner tone="warning">Zone 0 sélectionnée : le spectre affiché reste indicatif.</StateBanner> : null}
      {apiErr ? <StateBanner tone="danger">{apiErr}</StateBanner> : null}
      {loading && !specX ? <StateBanner tone="info">Connexion au backend et calcul du spectre…</StateBanner> : null}

      <SurfacePanel eyebrow="Paramètres issus du calcul" title="Coefficients actifs">
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <MetricCard label="A" value={hX.A} unit="zone" accent={c.amber} c={c} />
          <MetricCard label="I" value={hX.I} unit="importance" accent={c.purple} c={c} />
          <MetricCard label="S" value={hX.S} unit="site" accent={c.green} c={c} />
          {!seismic.twoDir ? (
            <>
              <MetricCard label="QF" value={seismic.QF.toFixed(2)} unit="qualité" accent={c.amber} c={c} />
              <MetricCard label="R" value={seismic.R} unit="comportement" accent={c.red} c={c} />
            </>
          ) : (
            <>
              <MetricCard label="QFx" value={seismic.QFx.toFixed(2)} unit="direction X" accent={c.blue} c={c} />
              <MetricCard label="Rx" value={seismic.Rx} unit="direction X" accent={c.blue} c={c} />
              <MetricCard label="QFy" value={seismic.QFy.toFixed(2)} unit="direction Y" accent={c.purple} c={c} />
              <MetricCard label="Ry" value={seismic.Ry} unit="direction Y" accent={c.purple} c={c} />
            </>
          )}
        </div>
      </SurfacePanel>

      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {!seismic.twoDir ? (
          <>
            <SpectrumPanel
              data={hX.pts}
              color={c.blue}
              T1={hX.T1}
              T2={hX.T2}
              T3={hX.T3}
              floor={hX.floor}
              peak={hX.peak}
              label="Sad(T) / g"
              subtitle="Équation 3.15"
              c={c}
            />
            <SpectrumPanel
              data={vertical.pts}
              color={c.purple}
              T1={vertical.T1}
              T2={vertical.T2}
              T3={vertical.T3}
              floor={vertical.floor}
              peak={vertical.peak}
              label="Svd(T) / g"
              subtitle="Équation 3.16"
              c={c}
            />
          </>
        ) : (
          <>
            <SpectrumPanel
              data={hX.pts}
              color={c.blue}
              T1={hX.T1}
              T2={hX.T2}
              T3={hX.T3}
              floor={hX.floor}
              peak={hX.peak}
              label="Sadx(T) / g"
              subtitle="Direction X - équation 3.15"
              c={c}
            />
            <SpectrumPanel
              data={hY.pts}
              color={c.purple}
              T1={hY.T1}
              T2={hY.T2}
              T3={hY.T3}
              floor={hY.floor}
              peak={hY.peak}
              label="Sady(T) / g"
              subtitle="Direction Y - équation 3.15"
              c={c}
            />
            <SpectrumPanel
              data={vertical.pts}
              color={c.green}
              T1={vertical.T1}
              T2={vertical.T2}
              T3={vertical.T3}
              floor={vertical.floor}
              peak={vertical.peak}
              label="Svd(T) / g"
              subtitle="Équation 3.16"
              c={c}
            />
          </>
        )}
      </div>

      <SurfacePanel
        eyebrow="Exports"
        title="Exploiter les courbes"
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="project-ghost-button"
              onClick={() => window.alert('Export Robot disponible lorsque le bridge sera connecté.')}
            >
              Export Robot
            </button>
            <button
              type="button"
              className="project-button"
              onClick={() => specX && exportTxt(specX.hData, `RPA24_Sad_Zone${project.zone}_${project.site}.txt`)}
            >
              Export Sad
            </button>
            <button
              type="button"
              className="project-secondary-button"
              onClick={() => specV && exportTxt(specV.vData, `RPA24_Svd_Zone${project.zone}_${project.site}.txt`)}
            >
              Export Svd
            </button>
          </div>
        }
      >
        <div style={{ color: c.textSec, lineHeight: 1.7 }}>
          Les exports texte conservent uniquement <span className="mono">T</span> et <span className="mono">Sa/g</span> pour rester compatibles avec un import externe simple.
        </div>
      </SurfacePanel>
    </PageShell>
  )
}
