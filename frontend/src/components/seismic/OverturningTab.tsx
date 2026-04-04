/**
 * Bunyan — Renversement Tab (§5.5)
 * Overturning: M_stab / M_renvers ≥ 1.3
 * Sliding:     μ × W_total / V   ≥ 1.25
 * Auto-calculates when stores change.
 */

import { useState, useEffect } from 'react'
import type { AppColors, OverturningResponse, DirectionOverturningOut } from '../../types'
import { useProjectStore, useSeismicStore, useStructuralStore } from '../../stores'
import { computeOverturning } from '../../services/api'

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

function CoeffValue({
  value, limit, unit = '', c,
}: { value: number; limit: number; unit?: string; c: AppColors }) {
  const ok = value >= limit
  return (
    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: ok ? c.green : c.red }}>
      {value.toFixed(2)}{unit}
    </span>
  )
}

function DirCard({
  dir, label, c,
}: { dir: DirectionOverturningOut; label: string; c: AppColors }) {
  const overOk = dir.ok_renvers
  const slidOk = dir.ok_glissement

  return (
    <div style={{
      flex: 1, minWidth: 260,
      background: c.surface, border: `1px solid ${c.border}`,
      borderRadius: 12, overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '10px 16px',
        background: c.elevated,
        borderBottom: `1px solid ${c.border}`,
        fontSize: 13, fontWeight: 700, color: c.blue,
      }}>
        {label}
      </div>

      {/* Renversement section */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}` }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: c.textMuted, fontWeight: 700, marginBottom: 10 }}>
          Renversement (§5.5)
        </div>
        <Row label="M renversement" c={c}>
          <span style={{ fontFamily: 'monospace', color: c.text }}>
            {dir.M_renvers.toFixed(1)} kN·m
          </span>
        </Row>
        <Row label="M stabilisant" c={c}>
          <span style={{ fontFamily: 'monospace', color: c.text }}>
            {dir.M_stab.toFixed(1)} kN·m
          </span>
        </Row>
        <Row label="Coeff. renversement" c={c}>
          <CoeffValue value={dir.coeff_renvers} limit={1.3} c={c} />
        </Row>
        <Row label="Limite" c={c}>
          <span style={{ color: c.textMuted, fontSize: 11 }}>≥ 1.30</span>
        </Row>
        <Row label="Statut" c={c}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
            background: overOk ? c.green + '22' : c.red + '22',
            color: overOk ? c.green : c.red,
            border: `1px solid ${overOk ? c.green : c.red}44`,
          }}>
            {overOk ? '✅ OK' : '❌ NON'}
          </span>
        </Row>
      </div>

      {/* Glissement section */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
          color: c.textMuted, fontWeight: 700, marginBottom: 10 }}>
          Glissement (§5.5)
        </div>
        <Row label="Force sismique V" c={c}>
          <span style={{ fontFamily: 'monospace', color: c.text }}>
            {dir.F_glissement.toFixed(1)} kN
          </span>
        </Row>
        <Row label="Force résistante μ·W" c={c}>
          <span style={{ fontFamily: 'monospace', color: c.text }}>
            {dir.F_resistance.toFixed(1)} kN
          </span>
        </Row>
        <Row label="Coeff. glissement" c={c}>
          <CoeffValue value={dir.coeff_glissement} limit={1.25} c={c} />
        </Row>
        <Row label="Limite" c={c}>
          <span style={{ color: c.textMuted, fontSize: 11 }}>≥ 1.25</span>
        </Row>
        <Row label="Statut" c={c}>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
            background: slidOk ? c.green + '22' : c.red + '22',
            color: slidOk ? c.green : c.red,
            border: `1px solid ${slidOk ? c.green : c.red}44`,
          }}>
            {slidOk ? '✅ OK' : '❌ NON'}
          </span>
        </Row>
      </div>
    </div>
  )
}

function Row({ label, children, c }: { label: string; children: React.ReactNode; c: AppColors }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0', borderBottom: `1px solid ${c.border}22`,
    }}>
      <span style={{ fontSize: 12, color: c.textSec }}>{label}</span>
      <span style={{ fontSize: 12 }}>{children}</span>
    </div>
  )
}

export default function OverturningTab({ c, isDark: _isDark }: Props) {
  const { stories } = useStructuralStore()
  const { Vxd, Vyd, twoDir } = useSeismicStore()
  const { psi, lx, ly, mu } = useProjectStore()

  const [result, setResult]   = useState<OverturningResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const V_x = parseFloat(Vxd) || 0
  const V_y = parseFloat(Vyd) || 0
  const hasV = V_x > 0 || V_y > 0
  const hasDims = lx > 0 && ly > 0

  const W_total = stories.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0)

  function buildStories() {
    return stories.map(s => ({
      hk:        parseFloat(s.elevation) || 3.0,  // hk not critical for overturning
      wg:        parseFloat(s.weight) || 0,
      wq:        0,
      dek_x:     0,
      dek_y:     0,
      elevation: parseFloat(s.elevation) || 0,
    }))
  }

  useEffect(() => {
    if (!hasV || !hasDims || stories.length === 0 || W_total <= 0) {
      setResult(null)
      return
    }

    const ctrl  = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await computeOverturning({
          stories:  buildStories(),
          V_x:      V_x > 0 ? V_x : 1,
          V_y:      V_y > 0 ? V_y : 1,
          Ft_x:     0,
          Ft_y:     0,
          psi,
          lx,
          ly,
          mu,
          W_total,
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
  }, [stories, Vxd, Vyd, psi, lx, ly, mu, twoDir])

  const allOk = result ? (
    result.x.ok_renvers && result.x.ok_glissement &&
    result.y.ok_renvers && result.y.ok_glissement
  ) : false

  return (
    <div style={{ padding: 16, fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Section title */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.08em', color: c.textMuted,
          textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
          §5.5 — Renversement et glissement
        </div>
        <div style={{ fontSize: 12, color: c.textSec }}>
          M_stab / M_renvers ≥ 1.30 &nbsp;·&nbsp; μ × W / V ≥ 1.25
        </div>
      </div>

      {/* Params strip */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 16, padding: '8px 12px',
        background: c.elevated, borderRadius: 8, fontSize: 12, color: c.textSec,
        flexWrap: 'wrap',
      }}>
        <span>Lx = <b style={{ color: c.blue }}>{lx.toFixed(1)} m</b></span>
        <span>Ly = <b style={{ color: c.purple }}>{ly.toFixed(1)} m</b></span>
        <span>μ = <b style={{ color: c.amber }}>{mu.toFixed(2)}</b></span>
        <span>W = <b style={{ color: c.green }}>{W_total.toFixed(0)} kN</b></span>
        <span>ψ = <b style={{ color: c.text }}>{psi.toFixed(2)}</b></span>
        <span>Vxd = <b style={{ color: c.green }}>{V_x.toFixed(0)} kN</b></span>
        <span>Vyd = <b style={{ color: c.green }}>{V_y.toFixed(0)} kN</b></span>
      </div>

      {/* Prerequisites check */}
      {(!hasV || !hasDims) && (
        <div style={{
          padding: '20px 16px', background: c.amber + '11',
          border: `1px solid ${c.amber}44`, borderRadius: 10,
          color: c.amber, fontSize: 13, lineHeight: 1.6,
        }}>
          Veuillez d'abord :
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            {!hasV && <li>Calculer l'effort tranchant (onglet <b>Effort V</b>) et renseigner Vxd / Vyd</li>}
            {!hasDims && <li>Renseigner <b>Lx</b> et <b>Ly</b> dans les Paramètres du projet</li>}
          </ul>
        </div>
      )}

      {hasV && hasDims && loading && (
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
          {/* Two-direction cards */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
            <DirCard dir={result.x} label="Direction X" c={c} />
            <DirCard dir={result.y} label="Direction Y" c={c} />
          </div>

          {/* Global verdict */}
          <div style={{
            padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: allOk ? c.green + '18' : c.red + '18',
            border: `1px solid ${allOk ? c.green : c.red}44`,
            color: allOk ? c.green : c.red,
            textAlign: 'center',
          }}>
            {allOk
              ? '✅ Stabilité d\'ensemble vérifiée'
              : '❌ Stabilité d\'ensemble non vérifiée'}
          </div>
        </>
      )}
    </div>
  )
}
