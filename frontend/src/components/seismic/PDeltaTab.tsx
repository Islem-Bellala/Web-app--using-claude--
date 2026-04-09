import { useEffect, useState } from 'react'
import type { AppColors, PDeltaResponse, StoryPDeltaOut } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computePDelta } from '../../services/api'
import { BadgeStrip, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface Props {
  c: AppColors
  isDark: boolean
}

function verdictColor(verdict: string, c: AppColors) {
  if (verdict === 'ok') return c.green
  if (verdict === 'amplify') return c.amber
  return c.red
}

function verdictLabel(story: StoryPDeltaOut) {
  if (story.verdict === 'ok') return 'Stable'
  if (story.verdict === 'amplify') return `Amplifier ×${story.amplification.toFixed(3)}`
  return 'Instable'
}

function DirectionSection({ dir, c }: { dir: PDeltaResponse['x']; c: AppColors }) {
  const globalTone = dir.max_theta > 0.2 ? 'danger' : dir.max_theta >= 0.1 ? 'warning' : 'success'

  return (
    <SurfacePanel eyebrow={`Direction ${dir.direction}`} title={`Indice de stabilité ${dir.direction}`}>
      <StateBanner tone={globalTone}>
        θmax = <strong>{dir.max_theta.toFixed(4)}</strong>
        {dir.max_theta > 0.2
          ? ' - structure instable.'
          : dir.max_theta >= 0.1
            ? ' - amplification requise.'
            : ' - structure stable.'}
      </StateBanner>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: c.elevated }}>
              {['Niveau', 'hk (m)', 'Pk (kN)', 'Vk (kN)', 'Δk (m)', 'θk', 'Verdict'].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'right',
                    color: c.textMuted,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderBottom: `1px solid ${c.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dir.stories.map((story) => (
              <tr key={story.level} style={{ background: `${verdictColor(story.verdict, c)}12` }}>
                <td style={{ padding: '6px 10px', color: c.textSec, fontWeight: 600 }}>N{story.level}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{story.hk.toFixed(2)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.green }}>{story.Pk.toFixed(1)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.blue }}>{story.Vk.toFixed(1)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.purple }}>{story.delta_k.toFixed(6)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: verdictColor(story.verdict, c), fontWeight: 700 }}>
                  {story.theta_k.toFixed(4)}
                </td>
                <td style={{ padding: '6px 10px', color: verdictColor(story.verdict, c), fontWeight: 700 }}>{verdictLabel(story)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfacePanel>
  )
}

export default function PDeltaTab({ c }: Props) {
  const { stories } = useStructuralStore()
  const { R, Rx, Ry, QF, QFx, QFy, twoDir, Vxd, Vyd } = useSeismicStore()
  const { psi } = useProjectStore()

  const [result, setResult] = useState<PDeltaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Vx = parseFloat(Vxd) || 0
  const Vy = parseFloat(Vyd) || 0
  const hasV = Vx > 0 || Vy > 0
  const avgR = ((twoDir ? Rx : R) + (twoDir ? Ry : R)) / 2
  const avgQF = ((twoDir ? QFx : QF) + (twoDir ? QFy : QF)) / 2

  function buildStories() {
    return stories.map((story, index) => {
      const elevation = parseFloat(story.elevation) || 0
      const previousElevation = index > 0 ? (parseFloat(stories[index - 1].elevation) || 0) : 0
      const hk = index === 0 ? elevation : elevation - previousElevation

      return {
        hk: hk > 0 ? hk : elevation,
        wg: parseFloat(story.weight) || 0,
        wq: 0,
        dek_x: (parseFloat(story.dek_x) || 0) / 100,
        dek_y: (parseFloat(story.dek_y) || 0) / 100,
        elevation,
      }
    })
  }

  useEffect(() => {
    if (!hasV || stories.length === 0) {
      setResult(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await computePDelta(
          {
            stories: buildStories(),
            R: avgR,
            QF: avgQF,
            psi,
            V_x: Vx > 0 ? Vx : 1,
            V_y: Vy > 0 ? Vy : 1,
            Ft_x: 0,
            Ft_y: 0,
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
  }, [stories, R, Rx, Ry, QF, QFx, QFy, twoDir, Vxd, Vyd, psi, avgQF, avgR, hasV, Vx, Vy])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BadgeStrip
        items={[
          { label: 'R moyen', value: avgR.toFixed(2), color: c.red },
          { label: 'QF moyen', value: avgQF.toFixed(2), color: c.amber },
          { label: 'ψ', value: psi.toFixed(2), color: c.blue },
          { label: 'Vxd / Vyd', value: `${Vx.toFixed(0)} / ${Vy.toFixed(0)} kN`, color: c.purple },
        ]}
      />

      {!hasV ? (
        <StateBanner tone="warning">
          Calculez d’abord l’effort tranchant et renseignez les valeurs dynamiques Vxd / Vyd avant d’ouvrir ce contrôle.
        </StateBanner>
      ) : null}

      {loading ? <StateBanner tone="info">Calcul du contrôle P-delta en cours…</StateBanner> : null}
      {error ? <StateBanner tone="danger">{error}</StateBanner> : null}

      {result && !loading ? (
        <>
          <DirectionSection dir={result.x} c={c} />
          <DirectionSection dir={result.y} c={c} />
        </>
      ) : null}
    </div>
  )
}
