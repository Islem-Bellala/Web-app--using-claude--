/**
 * Bunyan — RPA 2024 Spectrum Visualizer (Phase 6: Atlas theme)
 * Code references:
 *   RPA 2024 §3.3.3 Eq.3.15 — horizontal design spectrum
 *   RPA 2024 §3.3.3 Eq.3.16 — vertical design spectrum
 */

import { useState, useEffect } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"
import type { SpectrumPoint } from "../../types"
import { useProjectStore, useSeismicStore, useUIStore } from "../../stores"
import { computeSpectrum } from "../../services/api"

// ── Chart hex colors (Recharts needs real values, not Tailwind classes) ───────
const CHART = {
  light: {
    grid: '#e0dcd2', textSec: '#8a8478', textMuted: '#b0a898',
    gold: '#d4a54a', green: '#4a8a5a', info: '#4a8ac4',
    muted2: '#7a6a9a', danger: '#c45a4a', amber: '#d4a54a',
  },
  dark: {
    grid: '#2e382e', textSec: '#8a9a8a', textMuted: '#5a6a5a',
    gold: '#d4a54a', green: '#4a8a5a', info: '#5a9ad4',
    muted2: '#8a7aaa', danger: '#d46a5a', amber: '#d4a54a',
  },
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface SpectrumBranchState {
  A: number | string;
  I: number | string;
  S: number | string;
  T1: number | string;
  T2: number | string;
  T3: number | string;
  peak: number;
  floor: number;
  pts: SpectrumPoint[];
}
interface VerticalBranchState {
  Av?: number | string;
  I?: number | string;
  T1: number | string;
  T2: number | string;
  T3: number | string;
  peak: number;
  floor: number;
  pts: SpectrumPoint[];
}
interface SpectrumState {
  hData: SpectrumBranchState;
  vData: VerticalBranchState;
  spectrum_type: string;
}

const TYPE1_ZONES = new Set(["IV","V","VI"])
const EMPTY_H: SpectrumBranchState = { A:"—",I:"—",S:"—",T1:"—",T2:"—",T3:"—",peak:0,floor:0,pts:[] }
const EMPTY_V: VerticalBranchState = { T1:"—",T2:"—",T3:"—",peak:0,floor:0,pts:[] }

// ── Sub-components ────────────────────────────────────────────────────────────

function ParamCard({ label, value, unit, accentCls }: {
  label: string; value: number | string; unit?: string; accentCls: string
}) {
  return (
    <div className="flex-1 min-w-[76px] bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border rounded-xl px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-[0.06em] font-semibold text-atlas-text-sec dark:text-atlas-dark-text-sec mb-1">
        {label}
      </div>
      <div className={`text-xl font-bold font-mono leading-none ${accentCls}`}>{value}</div>
      {unit && <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">{unit}</div>}
    </div>
  )
}

function ChartTooltip({ active, payload, ch }: {
  active?: boolean; payload?: Array<{ payload: SpectrumPoint }>; ch: typeof CHART.light
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-lg px-3 py-2.5 text-xs">
      <div className="text-atlas-text-muted dark:text-atlas-dark-text-muted mb-0.5">
        T = <b className="text-atlas-text-sec dark:text-atlas-dark-text-sec">{d.T.toFixed(2)} s</b>
      </div>
      <div className="text-atlas-text-muted dark:text-atlas-dark-text-muted">
        Sa/g = <b className="text-atlas-success text-sm">{d.Sa_g.toFixed(4)}</b>
      </div>
    </div>
  )
}

function MiniChart({ data, color, T1, T2, T3, floor, peak, label, eq, ch }: {
  data: SpectrumPoint[]; color: string;
  T1: number | string; T2: number | string; T3: number | string;
  floor: number; peak: number;
  label: string; eq: string;
  ch: typeof CHART.light;
}) {
  return (
    <div className="flex-1 min-w-[260px] bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl px-3 py-4">
      <div className="flex justify-between items-center mb-2.5 text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec font-medium">
        <span>
          <b style={{ color, fontWeight: 700 }}>{label}</b>
          &nbsp;·&nbsp;<span className="text-atlas-info">{eq}</span>
        </span>
        <span className="font-mono text-atlas-warning text-[11px]">plancher={floor}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{top:4,right:10,bottom:22,left:4}}>
          <CartesianGrid stroke={ch.grid} strokeDasharray="4 4"/>
          <XAxis dataKey="T" type="number" domain={[0,4]}
            ticks={[0,0.5,1,1.5,2,2.5,3,3.5,4]}
            tick={{fill:ch.textSec,fontSize:10}}
            label={{value:"T (s)",position:"insideBottom",offset:-12,fill:ch.textSec,fontSize:10}}/>
          <YAxis tick={{fill:ch.textSec,fontSize:10}}
            label={{value:"Sa/g",angle:-90,position:"insideLeft",offset:13,fill:ch.textSec,fontSize:10}}/>
          <Tooltip content={<ChartTooltip ch={ch}/>}/>
          <ReferenceLine x={typeof T1 === 'number' ? T1 : undefined} stroke={ch.textSec} strokeDasharray="4 3"
            label={{value:"T₁",fill:ch.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine x={typeof T2 === 'number' ? T2 : undefined} stroke={ch.textSec} strokeDasharray="4 3"
            label={{value:"T₂",fill:ch.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine x={typeof T3 === 'number' ? T3 : undefined} stroke={ch.textSec} strokeDasharray="4 3"
            label={{value:"T₃",fill:ch.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine y={peak}  stroke={ch.danger + '66'} strokeDasharray="3 3"/>
          <ReferenceLine y={floor} stroke={ch.amber  + '66'} strokeDasharray="3 3"/>
          <Line dataKey="Sa_g" dot={false} strokeWidth={2.5}
            stroke={color} isAnimationActive animationDuration={300}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function exportTxt(data: SpectrumBranchState | VerticalBranchState, filename: string) {
  const lines = data.pts.map(p => p.T.toFixed(2).padEnd(10) + p.Sa_g.toFixed(6))
  const blob = new Blob([lines.join("\n")], {type:"text/plain"})
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SpectrumChart() {
  const project = useProjectStore()
  const seismic = useSeismicStore()
  const { theme } = useUIStore()

  const ch = theme === 'dark' ? CHART.dark : CHART.light

  const [specX,   setSpecX]   = useState<SpectrumState | null>(null)
  const [specY,   setSpecY]   = useState<SpectrumState | null>(null)
  const [specV,   setSpecV]   = useState<SpectrumState | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [apiErr,  setApiErr]  = useState<string | null>(null)

  const zone    = project.zone === "0" ? "I" : project.zone
  const isZone0 = project.zone === "0"
  const isT1    = TYPE1_ZONES.has(zone)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchOne(QF: number, R: number, setFn: (d: SpectrumState) => void) {
      const data = await computeSpectrum({
        zone, site_class: project.site, importance_group: project.group, QF, R, T_step: 0.01
      }, controller.signal)
      setFn({
        hData: {
          A:data.A, I:data.I, S:data.S,
          T1:data.horizontal.T1, T2:data.horizontal.T2, T3:data.horizontal.T3,
          peak:data.horizontal.peak, floor:data.horizontal.floor,
          pts:data.horizontal.points,
        },
        vData: {
          Av:data.Av, I:data.I,
          T1:data.vertical.T1, T2:data.vertical.T2, T3:data.vertical.T3,
          peak:data.vertical.peak, floor:data.vertical.floor,
          pts:data.vertical.points,
        },
        spectrum_type: data.spectrum_type,
      })
    }

    async function fetchAll() {
      setLoading(true); setApiErr(null)
      try {
        if (!seismic.twoDir) {
          await fetchOne(seismic.QF, seismic.R, d => { setSpecX(d); setSpecV(d) })
          setSpecY(null)
        } else {
          await Promise.all([
            fetchOne(seismic.QFx, seismic.Rx, d => setSpecX(d)),
            fetchOne(seismic.QFy, seismic.Ry, d => { setSpecY(d); setSpecV(d) }),
          ])
        }
      } catch (err) {
        const error = err as Error
        if (error.name !== "AbortError") {
          const msg = error.message.toLowerCase()
          setApiErr(msg.includes("failed to fetch") || msg.includes("network")
            ? "Backend non démarré — uvicorn backend.main:app --reload --port 8000"
            : error.message
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    return () => controller.abort()
  }, [zone, project.site, project.group,
      seismic.QF, seismic.R, seismic.QFx, seismic.Rx, seismic.QFy, seismic.Ry, seismic.twoDir])

  const hX = specX?.hData ?? EMPTY_H
  const hY = specY?.hData ?? EMPTY_H
  const vd = specV?.vData ?? EMPTY_V

  return (
    <div className="p-5 min-h-full bg-atlas-bg dark:bg-atlas-dark-bg text-atlas-text dark:text-atlas-dark-text">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-4">
        <div className="text-[11px] uppercase tracking-[0.12em] text-atlas-info font-semibold mb-1">
          RPA 2024 — DTR BC 2.48 — §3.3.3
        </div>
        <h1 className="text-xl font-bold text-atlas-text dark:text-atlas-dark-text">
          Spectre de Réponse de Calcul
        </h1>
        <p className="text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec mt-1">
          Composantes horizontale (Éq. 3.15) et verticale (Éq. 3.16)
        </p>
      </div>

      {/* ── Params badge bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl px-3.5 py-2.5 mb-4">
        <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-atlas-text-muted dark:text-atlas-dark-text-muted mr-1">
          Paramètres généraux →
        </span>
        {[
          {l:"Wilaya", v:`${project.wilayaCode}`, cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec"},
          {l:"Zone",   v:project.zone,            cls:"text-atlas-info font-bold"},
          {l:"Site",   v:project.site,            cls:"text-atlas-success font-bold"},
          {l:"Groupe", v:project.group,           cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec"},
          ...(!seismic.twoDir
            ? [{l:"QF",v:seismic.QF.toFixed(2),cls:"text-atlas-warning font-bold"},
               {l:"R", v:String(seismic.R),     cls:"text-atlas-danger font-bold"}]
            : [{l:"QFx",v:seismic.QFx.toFixed(2),cls:"text-atlas-info font-bold"},
               {l:"Rx", v:String(seismic.Rx),    cls:"text-atlas-info font-bold"},
               {l:"QFy",v:seismic.QFy.toFixed(2),cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec font-bold"},
               {l:"Ry", v:String(seismic.Ry),    cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec font-bold"}]
          ),
        ].map(b => (
          <div key={b.l} className="bg-atlas-bg dark:bg-atlas-dark-bg rounded-md px-2 py-1 text-[12px]">
            <span className="text-atlas-text-muted dark:text-atlas-dark-text-muted">{b.l} </span>
            <span className={b.cls}>{b.v}</span>
          </div>
        ))}
        <div className={`rounded-md px-2 py-1 text-[11px] font-bold border ${
          isT1
            ? 'bg-atlas-info/10 border-atlas-info/30 text-atlas-info'
            : 'bg-atlas-success/10 border-atlas-success/30 text-atlas-success'
        }`}>
          {isT1 ? "Type 1" : "Type 2"}
        </div>
        {isZone0 && (
          <div className="rounded-md px-2 py-1 text-[11px] font-bold bg-atlas-warning/10 border border-atlas-warning/40 text-atlas-warning">
            ⚠️ Zone 0 — spectre indicatif uniquement
          </div>
        )}
      </div>

      {/* ── API error / loading ──────────────────────────────────────── */}
      {apiErr && (
        <div className="mb-3.5 flex items-start gap-2 px-3.5 py-2.5 rounded-lg border border-atlas-danger/40 bg-atlas-danger/10 text-atlas-danger text-xs leading-relaxed">
          <span>❌</span><span>{apiErr}</span>
        </div>
      )}
      {loading && !specX && (
        <div className="mb-3.5 flex items-center gap-2 text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted">
          ⏳ Connexion au backend Python...
        </div>
      )}

      {/* ── Parameter cards ──────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-3.5">
        <ParamCard label="A"   value={hX.A}  unit="zone"        accentCls="text-atlas-warning"/>
        <ParamCard label="I"   value={hX.I}  unit="importance"  accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
        <ParamCard label="S"   value={hX.S}  unit="site"        accentCls="text-atlas-success"/>
        {!seismic.twoDir ? (
          <>
            <ParamCard label="QF" value={seismic.QF.toFixed(2)} unit="qualité"      accentCls="text-atlas-warning"/>
            <ParamCard label="R"  value={seismic.R}             unit="comportement" accentCls="text-atlas-danger"/>
          </>
        ) : (
          <>
            <ParamCard label="QFx" value={seismic.QFx.toFixed(2)} unit="dir. X" accentCls="text-atlas-info"/>
            <ParamCard label="Rx"  value={seismic.Rx}             unit="dir. X" accentCls="text-atlas-info"/>
            <ParamCard label="QFy" value={seismic.QFy.toFixed(2)} unit="dir. Y" accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
            <ParamCard label="Ry"  value={seismic.Ry}             unit="dir. Y" accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
          </>
        )}
        <ParamCard label="T₁" value={hX.T1} unit="sec" accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
        <ParamCard label="T₂" value={hX.T2} unit="sec" accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
        <ParamCard label="T₃" value={hX.T3} unit="sec" accentCls="text-atlas-text-sec dark:text-atlas-dark-text-sec"/>
      </div>

      {/* ── Charts ──────────────────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap mb-3.5">
        {!seismic.twoDir ? (
          <>
            <MiniChart data={hX.pts} color={ch.info}
              T1={hX.T1} T2={hX.T2} T3={hX.T3} floor={hX.floor} peak={hX.peak}
              label="Sad(T)/g" eq="Éq. 3.15" ch={ch}/>
            <MiniChart data={vd.pts} color={ch.muted2}
              T1={vd.T1} T2={vd.T2} T3={vd.T3} floor={vd.floor} peak={vd.peak}
              label="Svd(T)/g" eq="Éq. 3.16" ch={ch}/>
          </>
        ) : (
          <>
            <MiniChart data={hX.pts} color={ch.info}
              T1={hX.T1} T2={hX.T2} T3={hX.T3} floor={hX.floor} peak={hX.peak}
              label="Sad_x(T)/g" eq="Dir. X — Éq. 3.15" ch={ch}/>
            <MiniChart data={hY.pts} color={ch.muted2}
              T1={hY.T1} T2={hY.T2} T3={hY.T3} floor={hY.floor} peak={hY.peak}
              label="Sad_y(T)/g" eq="Dir. Y — Éq. 3.15" ch={ch}/>
            <MiniChart data={vd.pts} color={ch.green}
              T1={vd.T1} T2={vd.T2} T3={vd.T3} floor={vd.floor} peak={vd.peak}
              label="Svd(T)/g" eq="Éq. 3.16" ch={ch}/>
          </>
        )}
      </div>

      {/* ── Formula bar + exports ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl px-3.5 py-3">
        <div className="flex-1 text-xs font-mono text-atlas-text-sec dark:text-atlas-dark-text-sec min-w-60">
          {!seismic.twoDir ? (
            <>
              <span className="text-atlas-info font-bold">Éq.3.15</span>
              {"  "}Sad(palier)={hX.A}·{hX.I}·{hX.S}·2.5·({seismic.QF.toFixed(2)}/{seismic.R})={" "}
              <span className="text-atlas-danger font-bold">{hX.peak}</span>
              {"    "}
              <span className="text-atlas-text-sec dark:text-atlas-dark-text-sec font-bold">Éq.3.16</span>
              {"  "}Svd(palier)=<span className="text-atlas-text-sec dark:text-atlas-dark-text-sec font-bold">{vd.peak}</span>
            </>
          ) : (
            <>
              <span className="text-atlas-info font-bold">X</span>
              {" "}Sad_x={hX.peak}{"  "}
              <span className="text-atlas-text-sec dark:text-atlas-dark-text-sec font-bold">Y</span>
              {" "}Sad_y={hY.peak}{"  "}
              <span className="text-atlas-success font-bold">V</span>
              {" "}Svd={vd.peak}
            </>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button type="button"
            onClick={() => alert("Export vers Robot — disponible Session connexion bridge")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-atlas-info/10 border border-atlas-info/40 text-atlas-info hover:bg-atlas-info/20 transition-colors">
            🔌 Export → Robot
          </button>
          <button type="button"
            onClick={() => specX && exportTxt(specX.hData, `RPA24_Sad_Zone${project.zone}_${project.site}.txt`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-atlas-info/8 border border-atlas-info/30 text-atlas-info hover:bg-atlas-info/15 transition-colors">
            📄 Sad → .txt
          </button>
          <button type="button"
            onClick={() => specV && exportTxt(specV.vData, `RPA24_Svd_Zone${project.zone}_${project.site}.txt`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-atlas-text-muted/10 dark:bg-atlas-dark-text-muted/10 border border-atlas-text-muted/30 dark:border-atlas-dark-text-muted/30
              text-atlas-text-sec dark:text-atlas-dark-text-sec hover:bg-atlas-text-muted/20 transition-colors">
            📄 Svd → .txt
          </button>
        </div>
      </div>
    </div>
  )
}
