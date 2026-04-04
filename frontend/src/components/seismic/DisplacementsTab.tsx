/**
 * Bunyan — Déplacements Tab (§4.5.2 + §5.10)
 * Auto-calculates when stores change.
 * δk = (R / QF) × δek  [Eq 4.15]
 * Δk = δk − δk−1        [Eq 4.16]
 */

import { useState, useEffect } from 'react'
import type { AppColors, DisplacementsResponse, StoryDisplacementOut } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computeDisplacements } from '../../services/api'

interface Props { c: AppColors; isDark: boolean }

function Spinner({ c }: { c: AppColors }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.textMuted, fontSize: 13 }}>
      <div style={{
        width: 14, height: 14, border: `2px solid ${c.border}`,
        borderTopColor: c.blue, borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Calcul en cours…
    </div>
  )
}

function StatusBadge({ ok, c }: { ok: boolean; c: AppColors }) {
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
      background: ok ? c.green + '22' : c.red + '22',
      color: ok ? c.green : c.red,
      border: `1px solid ${ok ? c.green : c.red}44`,
    }}>
      {ok ? '✅ OK' : '❌ NON'}
    </span>
  )
}

function DirectionTable({
  dir, c,
}: {
  dir: DisplacementsResponse['x'] | DisplacementsResponse['y']
  c: AppColors
}) {
  const fmt6 = (v: number) => v.toFixed(6)
  const fmtPct = (v: number) => (v * 100).toFixed(3) + '%'

  const rowBg = (s: StoryDisplacementOut) => {
    if (s.ok_ne && s.ok_ld) return c.green + '11'
    if (!s.ok_ne && !s.ok_ld) return c.red + '11'
    return c.amber + '11'
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Direction header + summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
        padding: '10px 14px',
        background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: c.blue, minWidth: 100 }}>
          Direction {dir.direction}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: c.textSec }}>Non-effondrement :</span>
          <StatusBadge ok={dir.all_ok_ne} c={c} />
          <span style={{ fontSize: 12, color: c.textSec, marginLeft: 8 }}>Limitation dommages :</span>
          <StatusBadge ok={dir.all_ok_ld} c={c} />
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: c.elevated }}>
              {['Niveau','hk (m)','δek (m)','δk (m)','Δk (m)','Δk/hk','Lim. NE','NE','νA·Δk','Lim. LD','LD'].map(h => (
                <th key={h} style={{
                  padding: '6px 8px', textAlign: 'right',
                  color: c.textMuted, fontWeight: 600, fontSize: 10,
                  letterSpacing: '0.05em', textTransform: 'uppercase',
                  borderBottom: `1px solid ${c.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dir.stories.map(s => (
              <tr key={s.level} style={{ background: rowBg(s) }}>
                <td style={{ padding: '5px 8px', color: c.textSec, fontWeight: 600 }}>
                  N{s.level}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.text }}>
                  {s.hk.toFixed(2)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.textSec }}>
                  {fmt6(s.dek)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.purple }}>
                  {fmt6(s.dk)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.blue }}>
                  {fmt6(s.delta_k)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.text }}>
                  {fmtPct(s.drift)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.textSec }}>
                  {fmt6(s.drift_limit_ne)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  {s.ok_ne ? '✅' : '❌'}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.text }}>
                  {fmt6(s.damage_value)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'monospace', color: c.textSec }}>
                  {fmt6(s.damage_limit)}
                </td>
                <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                  {s.ok_ld ? '✅' : '❌'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function DisplacementsTab({ c, isDark: _isDark }: Props) {
  const { stories } = useStructuralStore()
  const { R, Rx, Ry, QF, QFx, QFy, twoDir } = useSeismicStore()
  const { structureType, nonStructuralType } = useProjectStore()

  const [result, setResult]   = useState<DisplacementsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Check if any dek values are entered
  const hasDek = stories.some(s => (parseFloat(s.dek_x) || 0) > 0 || (parseFloat(s.dek_y) || 0) > 0)

  const effectiveR  = twoDir ? (Rx + Ry) / 2 : R    // per-direction handled below
  const effectiveQF = twoDir ? (QFx + QFy) / 2 : QF

  // Build story payloads from store — derive hk from elevation diff
  function buildStories() {
    return stories.map((s, i) => {
      const elev     = parseFloat(s.elevation) || 0
      const prevElev = i > 0 ? (parseFloat(stories[i - 1].elevation) || 0) : 0
      const hk       = i === 0 ? elev : elev - prevElev
      return {
        hk:        hk > 0 ? hk : elev,
        wg:        parseFloat(s.weight) || 0,
        wq:        0,
        dek_x:     parseFloat(s.dek_x) || 0,
        dek_y:     parseFloat(s.dek_y) || 0,
        elevation: elev,
      }
    })
  }

  useEffect(() => {
    if (!hasDek || stories.length === 0) {
      setResult(null)
      return
    }

    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await computeDisplacements({
          stories:             buildStories(),
          R:                   effectiveR,
          QF:                  effectiveQF,
          structure_type:      structureType,
          non_structural_type: nonStructuralType,
        }, ctrl.signal)
        setResult(res)
      } catch (e: unknown) {
        if ((e as Error).name !== 'AbortError') {
          setError((e as Error).message ?? 'Erreur de calcul')
        }
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => { clearTimeout(timer); ctrl.abort() }
  }, [stories, R, Rx, Ry, QF, QFx, QFy, twoDir, structureType, nonStructuralType])

  return (
    <div style={{ padding: 16, fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif" }}>
      {/* Section title */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: c.textMuted,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
          §4.5.2 + §5.10 — Déplacements inter-étages
        </div>
        <div style={{ fontSize: 12, color: c.textSec }}>
          δk = (R / QF) × δek &nbsp;[Éq. 4.15] &nbsp;·&nbsp; Δk = δk − δk−1 &nbsp;[Éq. 4.16]
        </div>
      </div>

      {/* Params strip */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 16, padding: '8px 12px',
        background: c.elevated, borderRadius: 8, fontSize: 12, color: c.textSec,
        flexWrap: 'wrap',
      }}>
        <span>R = <b style={{ color: c.red }}>{twoDir ? `${Rx}/${Ry}` : R}</b></span>
        <span>QF = <b style={{ color: c.amber }}>{twoDir ? `${QFx.toFixed(2)}/${QFy.toFixed(2)}` : QF.toFixed(2)}</b></span>
        <span>Structure : <b style={{ color: c.blue }}>{structureType}</b></span>
        <span>Éléments : <b style={{ color: c.purple }}>{nonStructuralType}</b></span>
      </div>

      {/* No dek values */}
      {!hasDek && (
        <div style={{
          padding: '20px 16px', background: c.amber + '11',
          border: `1px solid ${c.amber}44`, borderRadius: 10,
          color: c.amber, fontSize: 13, lineHeight: 1.6,
        }}>
          Veuillez d'abord renseigner les déplacements élastiques (δek) dans les{' '}
          <b>Paramètres du projet</b> (colonnes δek,x et δek,y du tableau des niveaux).
        </div>
      )}

      {/* Loading */}
      {hasDek && loading && (
        <div style={{ padding: '20px 0' }}>
          <Spinner c={c} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          padding: '12px 14px', background: c.red + '11',
          border: `1px solid ${c.red}44`, borderRadius: 8,
          color: c.red, fontSize: 12, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <DirectionTable dir={result.x} c={c} />
          <DirectionTable dir={result.y} c={c} />
        </>
      )}
    </div>
  )
}
