import { useEffect, useState } from 'react'
import type { AppColors, DisplacementsResponse, StoryDisplacementOut } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computeDisplacements } from '../../services/api'
import { BadgeStrip, StateBanner, SurfacePanel } from '../shared/PageChrome'

interface Props {
  c: AppColors
  isDark: boolean
}

function StatusPill({ ok, c }: { ok: boolean; c: AppColors }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 82,
        minHeight: 30,
        padding: '0 10px',
        borderRadius: 999,
        background: ok ? `${c.green}18` : `${c.red}18`,
        color: ok ? c.green : c.red,
        border: `1px solid ${ok ? c.green : c.red}44`,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {ok ? 'OK' : 'NON'}
    </span>
  )
}

function DirectionTable({
  dir,
  c,
}: {
  dir: DisplacementsResponse['x'] | DisplacementsResponse['y']
  c: AppColors
}) {
  const format6 = (value: number) => value.toFixed(6)
  const formatPct = (value: number) => `${(value * 100).toFixed(3)}%`

  function rowBackground(story: StoryDisplacementOut) {
    if (story.ok_ne && story.ok_ld) return `${c.green}10`
    if (!story.ok_ne && !story.ok_ld) return `${c.red}10`
    return `${c.amber}12`
  }

  return (
    <SurfacePanel eyebrow={`Direction ${dir.direction}`} title={`Contrôle ${dir.direction}`}>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ color: c.textSec, fontSize: 12 }}>
          Non-effondrement : <StatusPill ok={dir.all_ok_ne} c={c} />
        </div>
        <div style={{ color: c.textSec, fontSize: 12 }}>
          Limitation des dommages : <StatusPill ok={dir.all_ok_ld} c={c} />
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: c.elevated }}>
              {['Niveau', 'hk (m)', 'δek (m)', 'δk (m)', 'Δk (m)', 'Δk/hk', 'Lim. NE', 'NE', 'νA·Δk', 'Lim. LD', 'LD'].map((header) => (
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
              <tr key={story.level} style={{ background: rowBackground(story) }}>
                <td style={{ padding: '6px 10px', color: c.textSec, fontWeight: 600 }}>N{story.level}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{story.hk.toFixed(2)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.textSec }}>{format6(story.dek)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.purple }}>{format6(story.dk)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.blue }}>{format6(story.delta_k)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{formatPct(story.drift)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.textSec }}>{format6(story.drift_limit_ne)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center' }}>{story.ok_ne ? 'OK' : 'NON'}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace' }}>{format6(story.damage_value)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'IBM Plex Mono, monospace', color: c.textSec }}>{format6(story.damage_limit)}</td>
                <td style={{ padding: '6px 10px', textAlign: 'center' }}>{story.ok_ld ? 'OK' : 'NON'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SurfacePanel>
  )
}

export default function DisplacementsTab({ c }: Props) {
  const { stories } = useStructuralStore()
  const { R, Rx, Ry, QF, QFx, QFy, twoDir } = useSeismicStore()
  const { structureType, nonStructuralType } = useProjectStore()

  const [result, setResult] = useState<DisplacementsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasDek = stories.some((story) => (parseFloat(story.dek_x) || 0) > 0 || (parseFloat(story.dek_y) || 0) > 0)
  const effectiveR = twoDir ? (Rx + Ry) / 2 : R
  const effectiveQF = twoDir ? (QFx + QFy) / 2 : QF

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
    if (!hasDek || stories.length === 0) {
      setResult(null)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await computeDisplacements(
          {
            stories: buildStories(),
            R: effectiveR,
            QF: effectiveQF,
            structure_type: structureType,
            non_structural_type: nonStructuralType,
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
  }, [stories, R, Rx, Ry, QF, QFx, QFy, twoDir, structureType, nonStructuralType, hasDek, effectiveQF, effectiveR])

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <BadgeStrip
        items={[
          { label: 'R', value: twoDir ? `${Rx} / ${Ry}` : String(R), color: c.red },
          { label: 'QF', value: twoDir ? `${QFx.toFixed(2)} / ${QFy.toFixed(2)}` : QF.toFixed(2), color: c.amber },
          { label: 'Structure', value: structureType, color: c.blue },
          { label: 'Éléments', value: nonStructuralType, color: c.purple },
        ]}
      />

      {!hasDek ? (
        <StateBanner tone="warning">
          Renseignez d’abord les déplacements élastiques (δek) dans les paramètres du projet, pour chaque niveau et chaque direction.
        </StateBanner>
      ) : null}

      {loading ? <StateBanner tone="info">Calcul des déplacements en cours…</StateBanner> : null}
      {error ? <StateBanner tone="danger">{error}</StateBanner> : null}

      {result && !loading ? (
        <>
          <DirectionTable dir={result.x} c={c} />
          <DirectionTable dir={result.y} c={c} />
        </>
      ) : null}
    </div>
  )
}
