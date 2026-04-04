/**
 * Bunyan — P-Δ Tab (§5.9)
 * θk = (Pk × Δk) / (Vk × hk)   [Eq 5.9]
 * Pk = Σ(Gi + ψ·Qi) i≥k         [Eq 5.10]
 * Auto-calculates when stores change.
 */

import { useState, useEffect } from 'react'
import type { AppColors, PDeltaResponse, StoryPDeltaOut } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computePDelta } from '../../services/api'

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

function verdictColor(verdict: string, c: AppColors): string {
  if (verdict === 'ok') return c.green
  if (verdict === 'amplify') return c.amber
  return c.red
}

function verdictLabel(s: StoryPDeltaOut, c: AppColors) {
  const col = verdictColor(s.verdict, c)
  if (s.verdict === 'ok') {
    return <span style={{ color: col }}>✅ OK (θ = {s.theta_k.toFixed(4)})</span>
  }
  if (s.verdict === 'amplify') {
    return (
      <span style={{ color: col }}>
        ⚠️ ×{s.amplification.toFixed(3)} &nbsp;
        <span style={{ fontSize: 10, color: c.textMuted }}>(θ = {s.theta_k.toFixed(4)})</span>
      </span>
    )
  }
  return <span style={{ color: col }}>❌ Instable (θ = {s.theta_k.toFixed(4)})</span>
}

function globalVerdictBadge(dir: PDeltaResponse['x'], c: AppColors) {
  const theta = dir.max_theta
  if (theta > 0.20) {
    return (
      <div style={{
        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: c.red + '18', border: `1px solid ${c.red}44`, color: c.red,
      }}>
        ❌ Structure instable (θmax = {theta.toFixed(4)} &gt; 0.20)
      </div>
    )
  }
  if (theta >= 0.10) {
    return (
      <div style={{
        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        background: c.amber + '18', border: `1px solid ${c.amber}44`, color: c.amber,
      }}>
        ⚠️ Effets P-Δ à amplifier (0.10 ≤ θmax = {theta.toFixed(4)} ≤ 0.20)
      </div>
    )
  }
  return (
    <div style={{
      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      background: c.green + '18', border: `1px solid ${c.green}44`, color: c.green,
    }}>
      ✅ Stable (θmax = {theta.toFixed(4)} &lt; 0.10)
    </div>
  )
}

function rowBg(verdict: string, c: AppColors): string {
  if (verdict === 'ok') return c.green + '0a'
  if (verdict === 'amplify') return c.amber + '11'
  return c.red + '11'
}

function DirectionSection({ dir, c }: { dir: PDeltaResponse['x']; c: AppColors }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10,
        padding: '10px 14px',
        background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: c.blue, minWidth: 100 }}>
          Direction {dir.direction}
        </div>
        {globalVerdictBadge(dir, c)}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: c.elevated }}>
              {['Niveau','hk (m)','Pk (kN)','Vk (kN)','Δk (m)','θk','Verdict'].map(h => (
                <th key={h} style={{
                  padding: '6px 10px', textAlign: 'right',
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
              <tr key={s.level} style={{ background: rowBg(s.verdict, c) }}>
                <td style={{ padding: '6px 10px', color: c.textSec, fontWeight: 600 }}>N{s.level}</td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', color: c.text }}>
                  {s.hk.toFixed(2)}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', color: c.green }}>
                  {s.Pk.toFixed(1)}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', color: c.blue }}>
                  {s.Vk.toFixed(1)}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', color: c.purple }}>
                  {s.delta_k.toFixed(6)}
                </td>
                <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace',
                  color: verdictColor(s.verdict, c), fontWeight: 600 }}>
                  {s.theta_k.toFixed(4)}
                </td>
                <td style={{ padding: '6px 10px', fontSize: 12 }}>
                  {verdictLabel(s, c)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PDeltaTab({ c, isDark: _isDark }: Props) {
  const { stories } = useStructuralStore()
  const { R, Rx, Ry, QF, QFx, QFy, twoDir, Vxd, Vyd } = useSeismicStore()
  const { psi } = useProjectStore()

  const [result, setResult]   = useState<PDeltaResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const V_x = parseFloat(Vxd) || 0
  const V_y = parseFloat(Vyd) || 0
  const hasV = V_x > 0 || V_y > 0

  const effectiveR_x  = twoDir ? Rx : R
  const effectiveR_y  = twoDir ? Ry : R
  const effectiveQF_x = twoDir ? QFx : QF
  const effectiveQF_y = twoDir ? QFy : QF

  // Use average R/QF since the endpoint takes a single pair
  // (both directions share R/QF unless in twoDir mode)
  const avgR  = (effectiveR_x + effectiveR_y) / 2
  const avgQF = (effectiveQF_x + effectiveQF_y) / 2

  function buildStories() {
    return stories.map((s, i) => {
      const elev     = parseFloat(s.elevation) || 0
      const prevElev = i > 0 ? (parseFloat(stories[i - 1].elevation) || 0) : 0
      const hk       = i === 0 ? elev : elev - prevElev
      return {
        hk:        hk > 0 ? hk : elev,
        wg:        parseFloat(s.weight) || 0,
        wq:        0,
        dek_x:     (parseFloat(s.dek_x) || 0) / 100,   // cm → m
        dek_y:     (parseFloat(s.dek_y) || 0) / 100,   // cm → m
        elevation: elev,
      }
    })
  }

  useEffect(() => {
    if (!hasV || stories.length === 0) {
      setResult(null)
      return
    }

    const ctrl  = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await computePDelta({
          stories: buildStories(),
          R:       avgR,
          QF:      avgQF,
          psi,
          V_x:     V_x > 0 ? V_x : 1,   // fallback to avoid 422
          V_y:     V_y > 0 ? V_y : 1,
          Ft_x:    0,
          Ft_y:    0,
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
  }, [stories, R, Rx, Ry, QF, QFx, QFy, twoDir, Vxd, Vyd, psi])

  return (
    <div style={{ padding: 16, fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Section title */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: c.textMuted,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
          §5.9 — Effet P-Δ (stabilité)
        </div>
        <div style={{ fontSize: 12, color: c.textSec }}>
          θk = (Pk × Δk) / (Vk × hk) &nbsp;[Éq. 5.9] &nbsp;·&nbsp;
          Pk = Σ(Gi + ψ·Qi) pour i ≥ k &nbsp;[Éq. 5.10]
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
        <span>ψ = <b style={{ color: c.blue }}>{psi.toFixed(2)}</b></span>
        <span>Vxd = <b style={{ color: c.green }}>{V_x.toFixed(0)} kN</b></span>
        <span>Vyd = <b style={{ color: c.purple }}>{V_y.toFixed(0)} kN</b></span>
      </div>

      {/* No base shear */}
      {!hasV && (
        <div style={{
          padding: '20px 16px', background: c.amber + '11',
          border: `1px solid ${c.amber}44`, borderRadius: 10,
          color: c.amber, fontSize: 13, lineHeight: 1.6,
        }}>
          Veuillez d'abord calculer l'effort tranchant (onglet <b>Effort V</b>)
          et renseigner les valeurs Vxd / Vyd dans les Paramètres du projet.
        </div>
      )}

      {hasV && loading && (
        <div style={{ padding: '20px 0' }}><Spinner c={c} /></div>
      )}

      {error && (
        <div style={{
          padding: '12px 14px', background: c.red + '11',
          border: `1px solid ${c.red}44`, borderRadius: 8,
          color: c.red, fontSize: 12, marginBottom: 12,
        }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <>
          <DirectionSection dir={result.x} c={c} />
          <DirectionSection dir={result.y} c={c} />
        </>
      )}
    </div>
  )
}
