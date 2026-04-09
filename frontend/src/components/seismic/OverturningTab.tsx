import { useEffect, useState, type ReactNode } from 'react'
import type { AppColors, DirectionOverturningOut, OverturningResponse } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computeOverturning } from '../../services/api'
import { BadgeStrip, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface Props {
  c: AppColors
  isDark: boolean
}

function Row({ label, value, c }: { label: string; value: ReactNode; c: AppColors }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        padding: '8px 0',
        borderBottom: `1px solid ${c.border}33`,
      }}
    >
      <span style={{ fontSize: 12, color: c.textSec }}>{label}</span>
      <span style={{ fontSize: 12 }}>{value}</span>
    </div>
  )
}

function CoeffValue({ value, limit, c }: { value: number; limit: number; c: AppColors }) {
  const ok = value >= limit
  return (
    <span style={{ color: ok ? c.green : c.red, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>
      {value.toFixed(2)}
    </span>
  )
}

function DirectionCard({ dir, label, c }: { dir: DirectionOverturningOut; label: string; c: AppColors }) {
  const overOk = dir.ok_renvers
  const slideOk = dir.ok_glissement

  return (
    <SurfacePanel eyebrow={label} title="Stabilité">
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textMuted, fontWeight: 700, marginBottom: 8 }}>
            Renversement
          </div>
          <Row label="Moment renversant" value={<span className="mono">{dir.M_renvers.toFixed(1)} kN·m</span>} c={c} />
          <Row label="Moment stabilisant" value={<span className="mono">{dir.M_stab.toFixed(1)} kN·m</span>} c={c} />
          <Row label="Coefficient" value={<CoeffValue value={dir.coeff_renvers} limit={1.3} c={c} />} c={c} />
          <Row label="Limite" value="≥ 1.30" c={c} />
          <Row label="Statut" value={<strong style={{ color: overOk ? c.green : c.red }}>{overOk ? 'OK' : 'NON'}</strong>} c={c} />
        </div>

        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textMuted, fontWeight: 700, marginBottom: 8 }}>
            Glissement
          </div>
          <Row label="Force sismique V" value={<span className="mono">{dir.F_glissement.toFixed(1)} kN</span>} c={c} />
          <Row label="Force résistante μ·W" value={<span className="mono">{dir.F_resistance.toFixed(1)} kN</span>} c={c} />
          <Row label="Coefficient" value={<CoeffValue value={dir.coeff_glissement} limit={1.25} c={c} />} c={c} />
          <Row label="Limite" value="≥ 1.25" c={c} />
          <Row label="Statut" value={<strong style={{ color: slideOk ? c.green : c.red }}>{slideOk ? 'OK' : 'NON'}</strong>} c={c} />
        </div>
      </div>
    </SurfacePanel>
  )
}

export default function OverturningTab({ c }: Props) {
  const { stories } = useStructuralStore()
  const { Vxd, Vyd } = useSeismicStore()
  const { psi, lx, ly, mu } = useProjectStore()

  const [result, setResult] = useState<OverturningResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Vx = parseFloat(Vxd) || 0
  const Vy = parseFloat(Vyd) || 0
  const hasV = Vx > 0 || Vy > 0
  const hasDimensions = lx > 0 && ly > 0
  const totalWeight = stories.reduce((sum, story) => sum + (parseFloat(story.weight) || 0), 0)

  function buildStories() {
    return stories.map((story) => ({
      hk: parseFloat(story.elevation) || 3,
      wg: parseFloat(story.weight) || 0,
      wq: 0,
      dek_x: 0,
      dek_y: 0,
      elevation: parseFloat(story.elevation) || 0,
    }))
  }

  useEffect(() => {
    if (!hasV || !hasDimensions || stories.length === 0 || totalWeight <= 0) {
      setResult(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await computeOverturning(
          {
            stories: buildStories(),
            V_x: Vx > 0 ? Vx : 1,
            V_y: Vy > 0 ? Vy : 1,
            Ft_x: 0,
            Ft_y: 0,
            psi,
            lx,
            ly,
            mu,
            W_total: totalWeight,
          },
          controller.signal,
        )
        setResult(response)
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message ?? 'Erreur de calcul')
        }
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [stories, Vxd, Vyd, psi, lx, ly, mu, hasDimensions, hasV, totalWeight, Vx, Vy])

  const allOk = result
    ? result.x.ok_renvers && result.x.ok_glissement && result.y.ok_renvers && result.y.ok_glissement
    : false

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BadgeStrip
        items={[
          { label: 'Lx', value: `${lx.toFixed(1)} m`, color: c.blue },
          { label: 'Ly', value: `${ly.toFixed(1)} m`, color: c.purple },
          { label: 'μ', value: mu.toFixed(2), color: c.amber },
          { label: 'W total', value: `${totalWeight.toFixed(0)} kN`, color: c.green },
        ]}
      />

      {!hasV || !hasDimensions ? (
        <StateBanner tone="warning">
          {!hasV ? 'Calculez d’abord l’effort tranchant et renseignez Vxd / Vyd. ' : ''}
          {!hasDimensions ? 'Renseignez également Lx et Ly dans les paramètres généraux.' : ''}
        </StateBanner>
      ) : null}

      {loading ? <StateBanner tone="info">Calcul des contrôles de renversement et de glissement…</StateBanner> : null}
      {error ? <StateBanner tone="danger">{error}</StateBanner> : null}

      {result && !loading ? (
        <>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <DirectionCard dir={result.x} label="Direction X" c={c} />
            <DirectionCard dir={result.y} label="Direction Y" c={c} />
          </div>
          <StateBanner tone={allOk ? 'success' : 'danger'}>
            {allOk ? 'Stabilité d’ensemble vérifiée.' : 'Stabilité d’ensemble non vérifiée.'}
          </StateBanner>
        </>
      ) : null}
    </div>
  )
}
