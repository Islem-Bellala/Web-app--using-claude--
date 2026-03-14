/**
 * StructCalc — RPA 2024 Spectrum Visualizer (Session 8)
 *
 * Changes from Session 6:
 *   - All seismic parameters now come from `params` prop (Paramètres généraux)
 *   - No input panel — parameters are set in ProjectParams
 *   - If params.twoDir: shows separate Sad_x and Sad_y charts
 *   - Wilaya/commune/zone selection removed (lives in ProjectParams)
 *
 * Code references:
 *   RPA 2024 §3.3.3 Eq.3.15 — horizontal design spectrum
 *   RPA 2024 §3.3.3 Eq.3.16 — vertical design spectrum
 */

import { useState, useEffect } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"

const ZONE_A = {"I":0.07,"II":0.10,"III":0.15,"IV":0.20,"V":0.25,"VI":0.30}
const IMPORTANCE_I = {"1A":1.4,"1B":1.2,"2":1.0,"3":0.8}
const TYPE1_ZONES = new Set(["IV","V","VI"])

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Card({ label, value, unit, accent, c }) {
  return (
    <div style={{background:c.elevated,border:`1px solid ${accent}44`,
      borderRadius:10,padding:"10px 12px",flex:1,minWidth:76}}>
      <div style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
        textTransform:"uppercase",fontWeight:600,marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color:accent,
        fontFamily:"monospace",lineHeight:1.1}}>{value}</div>
      {unit && <div style={{fontSize:11,color:c.textMuted,marginTop:2}}>{unit}</div>}
    </div>
  )
}

function ChartTooltip({ active, payload, c }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{background:c.elevated,border:`1px solid ${c.borderLight}`,
      borderRadius:8,padding:"9px 13px",fontSize:13}}>
      <div style={{color:c.textMuted,marginBottom:3}}>
        T = <b style={{color:c.text}}>{d.T.toFixed(2)} s</b>
      </div>
      <div style={{color:c.textMuted}}>
        Sa/g = <b style={{color:c.green,fontSize:15}}>{d.Sa_g.toFixed(4)}</b>
      </div>
    </div>
  )
}

function MiniChart({ data, color, T1, T2, T3, floor, peak, label, eq, c }) {
  return (
    <div style={{background:c.surface,border:`1px solid ${c.border}`,
      borderRadius:12,padding:"16px 12px 10px",flex:1,minWidth:260}}>
      <div style={{fontSize:12,color:c.textSec,marginBottom:10,display:"flex",
        justifyContent:"space-between",alignItems:"center",fontWeight:500}}>
        <span>
          <b style={{color,fontWeight:700}}>{label}</b>
          &nbsp;·&nbsp;<span style={{color:c.blue}}>{eq}</span>
        </span>
        <span style={{fontFamily:"monospace",color:c.amber,fontSize:11}}>plancher={floor}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{top:4,right:10,bottom:22,left:4}}>
          <CartesianGrid stroke={c.border} strokeDasharray="4 4"/>
          <XAxis dataKey="T" type="number" domain={[0,4]}
            ticks={[0,0.5,1,1.5,2,2.5,3,3.5,4]}
            tick={{fill:c.textSec,fontSize:10}}
            label={{value:"T (s)",position:"insideBottom",offset:-12,fill:c.textSec,fontSize:10}}/>
          <YAxis tick={{fill:c.textSec,fontSize:10}}
            label={{value:"Sa/g",angle:-90,position:"insideLeft",offset:13,fill:c.textSec,fontSize:10}}/>
          <Tooltip content={<ChartTooltip c={c}/>}/>
          <ReferenceLine x={T1} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₁",fill:c.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine x={T2} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₂",fill:c.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine x={T3} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₃",fill:c.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine y={peak}  stroke={c.red+"44"}   strokeDasharray="3 3"/>
          <ReferenceLine y={floor} stroke={c.amber+"44"} strokeDasharray="3 3"/>
          <Line dataKey="Sa_g" dot={false} strokeWidth={2.5}
            stroke={color} isAnimationActive animationDuration={300}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Export helpers — Robot format: T and Sa/g only, no headers
function exportTxt(data, filename) {
  const lines = data.pts.map(p =>
    p.T.toFixed(2).padEnd(10) + p.Sa_g.toFixed(6)
  )
  const blob = new Blob([lines.join("\n")], {type:"text/plain"})
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectrumChart({ params, c, isDark }) {
  // API state — one entry per direction + vertical
  const [specX,    setSpecX]   = useState(null)  // Sad_x (or single)
  const [specY,    setSpecY]   = useState(null)  // Sad_y (only if twoDir)
  const [specV,    setSpecV]   = useState(null)  // Svd
  const [loading,  setLoading] = useState(false)
  const [apiErr,   setApiErr]  = useState(null)

  const zone   = params.zone === "0" ? "I" : params.zone
  const isZone0 = params.zone === "0"

  // Fetch spectrum from backend whenever relevant params change
  useEffect(() => {
    const controller = new AbortController()

    async function fetchOne(QF, R, setFn) {
      const res = await fetch("http://localhost:8000/api/v1/spectrum", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify({
          zone, site_class:params.site, importance_group:params.group, QF, R, T_step:0.01
        }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({detail:`HTTP ${res.status}`}))
        throw new Error(err.detail || `Erreur ${res.status}`)
      }
      const data = await res.json()
      setFn({
        hData: {
          A: data.A, I: data.I, S: data.S,
          T1:data.horizontal.T1, T2:data.horizontal.T2, T3:data.horizontal.T3,
          peak:data.horizontal.peak, floor:data.horizontal.floor,
          pts:data.horizontal.points,
        },
        vData: {
          Av: data.Av, I: data.I,
          T1:data.vertical.T1, T2:data.vertical.T2, T3:data.vertical.T3,
          peak:data.vertical.peak, floor:data.vertical.floor,
          pts:data.vertical.points,
        },
        spectrum_type: data.spectrum_type,
      })
    }

    async function fetchAll() {
      setLoading(true)
      setApiErr(null)
      try {
        if (!params.twoDir) {
          // Single direction — one call, share vertical
          await fetchOne(params.QF, params.R, d => {
            setSpecX(d)
            setSpecV(d)  // vertical is direction-independent
          })
          setSpecY(null)
        } else {
          // Two directions — two calls
          await Promise.all([
            fetchOne(params.QFx, params.Rx, d => { setSpecX(d) }),
            fetchOne(params.QFy, params.Ry, d => {
              setSpecY(d)
              setSpecV(d)  // vertical from Y call (same result)
            }),
          ])
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          const msg = err.message.toLowerCase()
          setApiErr(msg.includes("failed to fetch") || msg.includes("network")
            ? "Backend non démarré — uvicorn backend.main:app --reload --port 8000"
            : err.message
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
    return () => controller.abort()
  }, [zone, params.site, params.group, params.QF, params.R,
      params.QFx, params.Rx, params.QFy, params.Ry, params.twoDir])

  const isT1 = TYPE1_ZONES.has(zone)

  const EMPTY = { A:"—",I:"—",S:"—",T1:"—",T2:"—",T3:"—",peak:0,floor:0,pts:[] }
  const hX = specX?.hData ?? EMPTY
  const hY = specY?.hData ?? EMPTY
  const vd = specV?.vData ?? {T1:"—",T2:"—",T3:"—",peak:0,floor:0,pts:[]}

  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px",transition:"background 0.2s,color 0.2s"}}>

      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:5,fontWeight:600}}>
          RPA 2024 — DTR BC 2.48 — §3.3.3
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>
          Spectre de Réponse de Calcul
        </h1>
        <div style={{color:c.textSec,fontSize:13,marginTop:3}}>
          Composantes horizontale (Éq. 3.15) et verticale (Éq. 3.16)
        </div>
      </div>

      {/* Params badge bar — replaces the old input panel */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:12,padding:"10px 14px",marginBottom:16,
        display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:c.textMuted,textTransform:"uppercase",
          letterSpacing:"0.06em",fontWeight:600,marginRight:4}}>
          Paramètres généraux →
        </span>
        {[
          {l:"Wilaya",  v:`${params.wilayaCode}`,        col:c.textSec},
          {l:"Zone",    v:params.zone,                   col:c.blue},
          {l:"Site",    v:params.site,                   col:c.green},
          {l:"Groupe",  v:params.group,                  col:c.purple},
          ...(!params.twoDir
            ? [{l:"QF", v:params.QF.toFixed(2), col:c.amber},
               {l:"R",  v:params.R,             col:c.red}]
            : [{l:"QFx", v:params.QFx.toFixed(2), col:c.blue},
               {l:"Rx",  v:params.Rx,             col:c.blue},
               {l:"QFy", v:params.QFy.toFixed(2), col:c.purple},
               {l:"Ry",  v:params.Ry,             col:c.purple}]
          ),
        ].map(b => (
          <div key={b.l} style={{background:c.elevated,borderRadius:6,
            padding:"4px 9px",fontSize:12}}>
            <span style={{color:c.textMuted}}>{b.l} </span>
            <b style={{color:b.col}}>{b.v}</b>
          </div>
        ))}
        <div style={{background:isT1 ? c.blue+"22" : c.green+"22",
          border:`1px solid ${isT1 ? c.blue : c.green}44`,
          borderRadius:6,padding:"4px 9px",fontSize:11,
          color:isT1 ? c.blue : c.green,fontWeight:700}}>
          {isT1 ? "Type 1" : "Type 2"}
        </div>
        {isZone0 && (
          <div style={{background:c.amber+"18",border:`1px solid ${c.amber}`,
            borderRadius:6,padding:"4px 9px",fontSize:11,color:c.amber,fontWeight:700}}>
            ⚠️ Zone 0 — spectre indicatif uniquement
          </div>
        )}
      </div>

      {/* API error */}
      {apiErr && (
        <div style={{background:c.red+"15",border:`1px solid ${c.red}44`,
          borderRadius:8,padding:"10px 14px",fontSize:12,color:c.red,
          display:"flex",alignItems:"flex-start",gap:8,marginBottom:14}}>
          <span>❌</span>
          <span style={{lineHeight:1.5}}>{apiErr}</span>
        </div>
      )}
      {loading && !specX && (
        <div style={{fontSize:12,color:c.textMuted,marginBottom:14,
          display:"flex",alignItems:"center",gap:8}}>
          ⏳ Connexion au backend Python...
        </div>
      )}

      {/* Parameter cards */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <Card label="A"    value={hX.A}       unit="zone"         accent={c.amber}   c={c}/>
        <Card label="I"    value={hX.I}       unit="importance"   accent={c.purple}  c={c}/>
        <Card label="S"    value={hX.S}       unit="site"         accent={c.green}   c={c}/>
        {!params.twoDir
          ? <><Card label="QF"  value={typeof params.QF==='number' ? params.QF.toFixed(2) : params.QF} unit="qualité" accent={c.amber} c={c}/>
               <Card label="R"   value={params.R} unit="comportement" accent={c.red}    c={c}/></>
          : <><Card label="QFx" value={params.QFx.toFixed(2)} unit="dir. X"  accent={c.blue}   c={c}/>
               <Card label="Rx"  value={params.Rx}             unit="dir. X"  accent={c.blue}   c={c}/>
               <Card label="QFy" value={params.QFy.toFixed(2)} unit="dir. Y"  accent={c.purple} c={c}/>
               <Card label="Ry"  value={params.Ry}             unit="dir. Y"  accent={c.purple} c={c}/></>
        }
        <Card label="T₁"   value={hX.T1}  unit="sec" accent={c.textSec} c={c}/>
        <Card label="T₂"   value={hX.T2}  unit="sec" accent={c.textSec} c={c}/>
        <Card label="T₃"   value={hX.T3}  unit="sec" accent={c.textSec} c={c}/>
      </div>

      {/* Charts */}
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
        {!params.twoDir ? (
          <>
            <MiniChart data={hX.pts} color={c.blue}
              T1={hX.T1} T2={hX.T2} T3={hX.T3} floor={hX.floor} peak={hX.peak}
              label="Sad(T)/g" eq="Éq. 3.15" c={c}/>
            <MiniChart data={vd.pts} color={c.purple}
              T1={vd.T1} T2={vd.T2} T3={vd.T3} floor={vd.floor} peak={vd.peak}
              label="Svd(T)/g" eq="Éq. 3.16" c={c}/>
          </>
        ) : (
          <>
            <MiniChart data={hX.pts} color={c.blue}
              T1={hX.T1} T2={hX.T2} T3={hX.T3} floor={hX.floor} peak={hX.peak}
              label="Sad_x(T)/g" eq="Dir. X — Éq. 3.15" c={c}/>
            <MiniChart data={hY.pts} color={c.purple}
              T1={hY.T1} T2={hY.T2} T3={hY.T3} floor={hY.floor} peak={hY.peak}
              label="Sad_y(T)/g" eq="Dir. Y — Éq. 3.15" c={c}/>
            <MiniChart data={vd.pts} color={c.green}
              T1={vd.T1} T2={vd.T2} T3={vd.T3} floor={vd.floor} peak={vd.peak}
              label="Svd(T)/g" eq="Éq. 3.16" c={c}/>
          </>
        )}
      </div>

      {/* Formula bar + exports */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:10,padding:"11px 14px",
        display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{flex:1,fontSize:12,color:c.textSec,fontFamily:"monospace",minWidth:240}}>
          {!params.twoDir ? (
            <>
              <span style={{color:c.blue,fontWeight:700}}>Éq.3.15</span>
              {"  "}Sad(palier)={hX.A}·{hX.I}·{hX.S}·2.5·({typeof params.QF==='number' ? params.QF.toFixed(2) : params.QF}/{params.R})={" "}
              <span style={{color:c.red,fontWeight:700}}>{hX.peak}</span>
              {"    "}
              <span style={{color:c.purple,fontWeight:700}}>Éq.3.16</span>
              {"  "}Svd(palier)=<span style={{color:c.purple,fontWeight:700}}>{vd.peak}</span>
            </>
          ) : (
            <>
              <span style={{color:c.blue,fontWeight:700}}>X</span>
              {" "}Sad_x={hX.peak}{"  "}
              <span style={{color:c.purple,fontWeight:700}}>Y</span>
              {" "}Sad_y={hY.peak}{"  "}
              <span style={{color:c.green,fontWeight:700}}>V</span>
              {" "}Svd={vd.peak}
            </>
          )}
        </div>

        <div style={{display:"flex",gap:8,flexShrink:0}}>
          <button type="button"
            onClick={() => alert("Export vers Robot — disponible Session connexion bridge")}
            style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
              background:c.blue+"22",border:`1px solid ${c.blue}`,
              color:c.blue,fontSize:12,fontWeight:600,
              display:"flex",alignItems:"center",gap:6}}>
            🔌 Export → Robot
          </button>
          <button type="button"
            onClick={() => specX && exportTxt(specX.hData, `RPA24_Sad_Zone${params.zone}_${params.site}.txt`)}
            style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
              background:c.blue+"11",border:`1px solid ${c.blue}66`,
              color:c.blue,fontSize:12,fontWeight:600,
              display:"flex",alignItems:"center",gap:5}}>
            📄 Sad → .txt
          </button>
          <button type="button"
            onClick={() => specV && exportTxt(specV.vData, `RPA24_Svd_Zone${params.zone}_${params.site}.txt`)}
            style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
              background:c.purple+"11",border:`1px solid ${c.purple}66`,
              color:c.purple,fontSize:12,fontWeight:600,
              display:"flex",alignItems:"center",gap:5}}>
            📄 Svd → .txt
          </button>
        </div>
      </div>
    </div>
  )
}
