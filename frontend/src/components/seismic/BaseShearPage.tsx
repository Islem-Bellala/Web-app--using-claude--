/**
 * Bunyan — Effort Tranchant à la Base (Phase 6: Atlas theme)
 * RPA 2024 §4.2 — Méthode Statique Équivalente
 */

import { useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts"
import type { BaseShearResult, StoryForce } from "../../types"
import { useProjectStore, useSeismicStore, useStructuralStore, useUIStore } from "../../stores"
import { computeBaseShear } from "../../services/api"

// ── Chart hex colors ──────────────────────────────────────────────────────────
const CHART = {
  light: { grid:'#e0dcd2', textSec:'#8a8478', textMuted:'#b0a898', info:'#4a8ac4', amber:'#d4a54a', danger:'#c45a4a', success:'#4a8a5a', border:'#e8e4da' },
  dark:  { grid:'#2e382e', textSec:'#8a9a8a', textMuted:'#5a6a5a', info:'#5a9ad4', amber:'#d4a54a', danger:'#d46a5a', success:'#5a9a6a', border:'#3a443a' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResultCard({ label, value, unit, accentCls }: {
  label: string; value: string | number; unit?: string; accentCls: string
}) {
  return (
    <div className="flex-1 min-w-[90px] bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border rounded-xl px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-[0.06em] font-semibold text-atlas-text-sec dark:text-atlas-dark-text-sec mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${accentCls}`}>{value}</div>
      {unit && <div className="text-[10px] text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">{unit}</div>}
    </div>
  )
}

function ForceTooltip({ active, payload, ch }: {
  active?: boolean; payload?: Array<{payload: StoryForce & {name: string}}>; ch: typeof CHART.light
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-lg px-3 py-2.5 text-xs">
      <div className="font-bold text-atlas-text dark:text-atlas-dark-text mb-1">{d.name}</div>
      <div className="text-atlas-text-muted dark:text-atlas-dark-text-muted">
        h = <b className="text-atlas-text-sec dark:text-atlas-dark-text-sec">{d.elevation} m</b>
      </div>
      <div className="text-atlas-text-muted dark:text-atlas-dark-text-muted">
        Wi = <b className="text-atlas-text-sec dark:text-atlas-dark-text-sec">{d.weight} kN</b>
      </div>
      <div className="text-atlas-text-muted dark:text-atlas-dark-text-muted">
        Fi = <b className="text-atlas-info text-sm">{d.Fi.toFixed(1)} kN</b>
      </div>
    </div>
  )
}

function barColor(Fi: number, maxFi: number, ch: typeof CHART.light): string {
  const r = maxFi > 0 ? Fi / maxFi : 0
  if (r < 0.5) return ch.info
  if (r < 0.8) return ch.amber
  return ch.danger
}

function Check80({ label, Vdyn, Vstat }: { label: string; Vdyn: number | null; Vstat: number }) {
  if (!Vdyn || !Vstat) return (
    <p className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted italic">
      {label}: Vxd/Vyd non renseigné — vérification indisponible
    </p>
  )
  const threshold = 0.8 * Vstat
  const ok = Vdyn >= threshold
  const coeff = ok ? null : (threshold / Vdyn).toFixed(3)
  return (
    <div className={`rounded-lg px-3.5 py-2.5 mb-2 border-l-[3px] ${
      ok
        ? 'bg-atlas-success/8 border-l-atlas-success border border-atlas-success/25'
        : 'bg-atlas-danger/8 border-l-atlas-danger border border-atlas-danger/25'
    }`}>
      <div className="flex items-center gap-2.5 mb-0.5">
        <span className="text-base">{ok ? "✅" : "❌"}</span>
        <div>
          <div className={`text-sm font-bold ${ok ? 'text-atlas-success' : 'text-atlas-danger'}`}>
            {label} — {ok ? "Condition vérifiée" : "Condition NON vérifiée"}
          </div>
          <div className="text-[11px] font-mono text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">
            Vxd/Vyd = {(+Vdyn).toFixed(1)} kN &nbsp;|&nbsp; 80%×V = {threshold.toFixed(1)} kN
          </div>
        </div>
      </div>
      {!ok && (
        <div className="mt-2 bg-atlas-danger/15 rounded px-2.5 py-1.5 text-xs text-atlas-danger">
          ⚠️ Coefficient de majoration :{" "}
          <b className="text-[15px] font-mono">{coeff}</b>
          <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">
            = 0.8 × {Vstat.toFixed(1)} / {(+Vdyn).toFixed(1)}
          </div>
        </div>
      )}
    </div>
  )
}

function DirectionPanel({ dir, result, Vdyn, accentCls, ch }: {
  dir: string; result: BaseShearResult | null; Vdyn: number | null;
  accentCls: string; ch: typeof CHART.light
}) {
  if (!result) return null
  const maxFi    = Math.max(...result.story_forces.map(s => s.Fi))
  const chartData = [...result.story_forces].reverse()
  const accentHex = dir === 'X' ? ch.info : ch.amber

  return (
    <div className="flex-1 min-w-[280px] flex flex-col gap-3">
      {/* Direction label */}
      <div className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.08em] border ${
        dir === 'X'
          ? 'bg-atlas-info/8 border-atlas-info/25 text-atlas-info'
          : 'bg-atlas-warning/8 border-atlas-warning/25 text-atlas-warning'
      }`}>
        Direction {dir}
      </div>

      {/* Result cards */}
      <div className="flex gap-1.5 flex-wrap">
        <ResultCard label="T_emp" value={result.T_emp.toFixed(3)} unit="s"    accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
        <ResultCard label="T₀"    value={result.T0.toFixed(3)}    unit="s"    accentCls={accentCls}/>
        <ResultCard label="λ"     value={result.lambda_coef}      unit="coef" accentCls="text-atlas-warning"/>
        <ResultCard label="Sad/g" value={result.Sad_g.toFixed(4)} unit="—"    accentCls="text-atlas-success"/>
        <ResultCard label="V (kN)"value={result.V.toFixed(1)}     unit="kN"   accentCls="text-atlas-danger"/>
        {result.Ft > 0 && (
          <ResultCard label="Ft"  value={result.Ft.toFixed(1)}    unit="som." accentCls="text-atlas-warning"/>
        )}
      </div>

      {/* Formula */}
      <div className="px-3 py-2 rounded-lg bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border text-[11px] font-mono text-atlas-text-sec dark:text-atlas-dark-text-sec">
        V = <span className="text-atlas-warning">{result.lambda_coef}</span>
        {" "}×{" "}<span className="text-atlas-success">{result.Sad_g.toFixed(4)}</span>
        {" "}×{" "}<span>{result.W.toFixed(0)}</span>
        {" = "}<span className="text-atlas-danger font-bold">{result.V.toFixed(1)} kN</span>
        {result.T_cap !== result.T_emp && (
          <span className="text-atlas-warning"> · T₀ plafonné à {result.T_cap}s</span>
        )}
      </div>

      <Check80 label={`Sens ${dir}`} Vdyn={Vdyn} Vstat={result.V}/>

      {/* Bar chart */}
      <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl px-3 py-3.5">
        <div className="text-[11px] font-semibold text-atlas-text-sec dark:text-atlas-dark-text-sec mb-2.5">
          Distribution Fi — Dir. {dir} <span className={accentCls}>Éq.4.2</span>
        </div>
        <ResponsiveContainer width="100%" height={result.story_forces.length*40+20}>
          <BarChart data={chartData} layout="vertical" margin={{top:0,right:45,bottom:0,left:52}}>
            <CartesianGrid stroke={ch.grid} strokeDasharray="4 4" horizontal={false}/>
            <XAxis type="number" tick={{fill:ch.textSec,fontSize:10}}
              tickFormatter={(v: number) => v.toFixed(0)}/>
            <YAxis type="category" dataKey="name" tick={{fill:ch.textSec,fontSize:10}} width={48}/>
            <Tooltip content={<ForceTooltip ch={ch}/>}/>
            <Bar dataKey="Fi" radius={[0,4,4,0]}>
              {chartData.map((entry,i) => (
                <Cell key={i} fill={barColor(entry.Fi, maxFi, ch)}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Story forces table */}
      <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl overflow-hidden text-[11px]">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-atlas-bg dark:bg-atlas-dark-bg">
              {["Niveau","h(m)","Wi","Wi·hi","ratio","Fi(kN)"].map(h => (
                <th key={h} className="px-2 py-1.5 text-right text-[10px] uppercase tracking-[0.05em] font-semibold text-atlas-text-sec dark:text-atlas-dark-text-sec border-b border-atlas-card-border dark:border-atlas-dark-card-border first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...result.story_forces].reverse().map((sf,i) => (
              <tr key={i} className={i%2===0 ? '' : 'bg-atlas-bg/50 dark:bg-atlas-dark-bg/50'}>
                <td className="px-2 py-1.5 font-semibold text-atlas-text dark:text-atlas-dark-text">{sf.name}</td>
                <td className="px-2 py-1.5 text-right font-mono text-atlas-text-sec dark:text-atlas-dark-text-sec">{sf.elevation.toFixed(1)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-atlas-success">{sf.weight.toFixed(0)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-atlas-text-muted dark:text-atlas-dark-text-muted">{(sf.weight*sf.elevation).toFixed(0)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-atlas-text-muted dark:text-atlas-dark-text-muted">{(sf.ratio*100).toFixed(1)}%</td>
                <td className={`px-2 py-1.5 text-right font-mono font-bold ${accentCls}`}>{sf.Fi.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-atlas-card-border dark:border-atlas-dark-card-border bg-atlas-bg dark:bg-atlas-dark-bg">
              <td colSpan={5} className="px-2 py-1.5 text-[10px] uppercase tracking-[0.06em] font-bold text-atlas-text-sec dark:text-atlas-dark-text-sec">
                Total
              </td>
              <td className="px-2 py-1.5 text-right font-mono font-bold text-[13px] text-atlas-danger">
                {result.story_forces.reduce((a,s) => a+s.Fi, 0).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BaseShearPage() {
  const project    = useProjectStore()
  const seismic    = useSeismicStore()
  const structural = useStructuralStore()
  const { theme }  = useUIStore()

  const ch = theme === 'dark' ? CHART.dark : CHART.light

  const [resultX, setResultX] = useState<BaseShearResult | null>(null)
  const [resultY, setResultY] = useState<BaseShearResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [apiErr,  setApiErr]  = useState<string | null>(null)

  function storiesPayload() {
    return [...structural.stories]
      .map(s => ({name:s.name.trim(), elevation:parseFloat(s.elevation), weight:parseFloat(s.weight)}))
      .filter(s => s.elevation>0 && s.weight>0)
      .sort((a,b) => a.elevation-b.elevation)
  }

  function isReady(): boolean {
    const sp = storiesPayload()
    return sp.length >= 1 && parseFloat(structural.stories.map(s => s.elevation).filter(Boolean).slice(-1)[0]) > 0
  }

  async function fetchDirection(QF: number, R: number, TCalc: string): Promise<BaseShearResult> {
    const sp = storiesPayload()
    const hn = Math.max(...sp.map(s => s.elevation))
    return computeBaseShear({
      zone:             project.zone === "0" ? "I" : project.zone,
      site_class:       project.site,
      importance_group: project.group,
      QF, R,
      frame_system:     seismic.frameSys,
      hn,
      T_calculated:     TCalc ? parseFloat(TCalc) : null,
      stories:          sp,
    })
  }

  async function calculate() {
    if (!isReady()) return
    setLoading(true); setApiErr(null)
    try {
      const [rX, rY] = await Promise.all([
        fetchDirection(
          seismic.twoDir ? seismic.QFx : seismic.QF,
          seismic.twoDir ? seismic.Rx  : seismic.R,
          seismic.Tx
        ),
        fetchDirection(
          seismic.twoDir ? seismic.QFy : seismic.QF,
          seismic.twoDir ? seismic.Ry  : seismic.R,
          seismic.Ty
        ),
      ])
      setResultX(rX); setResultY(rY)
    } catch (err) {
      const error = err as Error
      const msg = error.message.toLowerCase()
      setApiErr(msg.includes("failed to fetch") || msg.includes("network")
        ? "Backend non démarré — uvicorn backend.main:app --reload --port 8000"
        : error.message
      )
    } finally {
      setLoading(false)
    }
  }

  const totalW = structural.stories.reduce((a,s) => a+(parseFloat(s.weight)||0), 0)

  return (
    <div className="p-5 min-h-full bg-atlas-bg dark:bg-atlas-dark-bg text-atlas-text dark:text-atlas-dark-text">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.12em] text-atlas-info font-semibold mb-1">
          RPA 2024 — DTR BC 2.48 — §4.2
        </div>
        <h1 className="text-xl font-bold">Effort Tranchant à la Base</h1>
        <p className="text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec mt-1">
          V = λ · Sad(T₀)/g · W — Directions X et Y
        </p>
      </div>

      {/* ── Params badges ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl px-3.5 py-2.5 mb-3.5">
        <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-atlas-text-muted dark:text-atlas-dark-text-muted mr-1">
          Paramètres généraux →
        </span>
        {[
          {l:"Zone",   v:project.zone,  cls:"text-atlas-info font-bold"},
          {l:"Site",   v:project.site,  cls:"text-atlas-success font-bold"},
          {l:"Groupe", v:project.group, cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec"},
          ...(!seismic.twoDir
            ? [{l:"QF",v:seismic.QF.toFixed(2),cls:"text-atlas-warning font-bold"},{l:"R",v:String(seismic.R),cls:"text-atlas-danger font-bold"}]
            : [{l:"QFx",v:seismic.QFx.toFixed(2),cls:"text-atlas-info font-bold"},{l:"Rx",v:String(seismic.Rx),cls:"text-atlas-info font-bold"},
               {l:"QFy",v:seismic.QFy.toFixed(2),cls:"text-atlas-warning font-bold"},{l:"Ry",v:String(seismic.Ry),cls:"text-atlas-warning font-bold"}]
          ),
          {l:"Niveaux", v:String(structural.stories.length), cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec"},
          {l:"W", v:`${totalW.toFixed(0)} kN`, cls:"text-atlas-success font-bold"},
          ...(seismic.Tx ? [{l:"Tx",v:`${seismic.Tx}s`,cls:"text-atlas-info"}] : []),
          ...(seismic.Ty ? [{l:"Ty",v:`${seismic.Ty}s`,cls:"text-atlas-warning"}] : []),
        ].map(b => (
          <div key={b.l} className="bg-atlas-bg dark:bg-atlas-dark-bg rounded-md px-2 py-1 text-[12px]">
            <span className="text-atlas-text-muted dark:text-atlas-dark-text-muted">{b.l} </span>
            <span className={b.cls}>{b.v}</span>
          </div>
        ))}
      </div>

      {/* ── Vdyn info bar ─────────────────────────────────────────────── */}
      {(seismic.Vxd || seismic.Vyd) && (
        <div className="flex gap-4 items-center px-3.5 py-2 rounded-lg mb-3.5 bg-atlas-warning/10 border border-atlas-warning/30 text-atlas-warning text-xs">
          <span>📊 Vérification 80% :</span>
          {seismic.Vxd && <span>Vxd = <b>{seismic.Vxd} kN</b></span>}
          {seismic.Vyd && <span>Vyd = <b>{seismic.Vyd} kN</b></span>}
        </div>
      )}

      {/* ── Calculate button ──────────────────────────────────────────── */}
      <button type="button" onClick={calculate} disabled={loading || !isReady()}
        className="mb-3.5 px-7 py-3 rounded-xl text-sm font-bold transition-colors
          bg-atlas-topbar dark:bg-atlas-dark-topbar text-atlas-gold border border-atlas-gold/40
          hover:bg-atlas-topbar/80 disabled:opacity-50 disabled:cursor-default">
        {loading ? "Calcul en cours..." : "⚡ Calculer V (X et Y)"}
      </button>

      {/* ── API error ─────────────────────────────────────────────────── */}
      {apiErr && (
        <div className="mb-3.5 px-3.5 py-2.5 rounded-lg border border-atlas-danger/40 bg-atlas-danger/10 text-atlas-danger text-xs leading-relaxed">
          ❌ {apiErr}
        </div>
      )}

      {/* ── Results panels ───────────────────────────────────────────── */}
      {(resultX || resultY) && (
        <div className="flex gap-4 flex-wrap items-start">
          <DirectionPanel dir="X" result={resultX}
            Vdyn={seismic.Vxd ? parseFloat(seismic.Vxd) : null}
            accentCls="text-atlas-info" ch={ch}/>
          <DirectionPanel dir="Y" result={resultY}
            Vdyn={seismic.Vyd ? parseFloat(seismic.Vyd) : null}
            accentCls="text-atlas-warning" ch={ch}/>
        </div>
      )}

      {!resultX && !loading && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-atlas-text-muted dark:text-atlas-dark-text-muted">
          <div className="text-4xl">⚡</div>
          <div className="text-sm text-atlas-text-sec dark:text-atlas-dark-text-sec">
            Vérifier les paramètres dans Paramètres généraux, puis cliquer "Calculer"
          </div>
        </div>
      )}
    </div>
  )
}
