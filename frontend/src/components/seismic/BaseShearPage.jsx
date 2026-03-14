/**
 * StructCalc — Effort Tranchant à la Base (Session 8)
 * RPA 2024 §4.2 — Méthode Statique Équivalente
 *
 * Changes from Session 7:
 *   - Seismic params read from global `params` prop (no input panel for those)
 *   - Always computes TWO directions (X and Y)
 *   - λ correction applied: λ=0.85 if T0≤2T2 and n>2, else λ=1.0
 *   - 80% check: Vxd/Vyd vs 0.8×V — uses params.Vxd, params.Vyd
 *   - Coefficient de majoration shown when 80% check fails
 */

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts"

function ResultCard({ label, value, unit, accent, c }) {
  return (
    <div style={{background:c.elevated,border:`1px solid ${accent}44`,
      borderRadius:10,padding:"10px 12px",flex:1,minWidth:90}}>
      <div style={{fontSize:10,letterSpacing:"0.06em",color:c.textSec,
        textTransform:"uppercase",fontWeight:600,marginBottom:4}}>{label}</div>
      <div style={{fontSize:18,fontWeight:700,color:accent,fontFamily:"monospace"}}>{value}</div>
      {unit && <div style={{fontSize:10,color:c.textMuted,marginTop:2}}>{unit}</div>}
    </div>
  )
}

function ForceTooltip({ active, payload, c }) {
  if (!active||!payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{background:c.elevated,border:`1px solid ${c.borderLight}`,
      borderRadius:8,padding:"9px 13px",fontSize:12}}>
      <div style={{color:c.text,fontWeight:700,marginBottom:4}}>{d.name}</div>
      <div style={{color:c.textMuted}}>h = <b style={{color:c.text}}>{d.elevation} m</b></div>
      <div style={{color:c.textMuted}}>Wi = <b style={{color:c.text}}>{d.weight} kN</b></div>
      <div style={{color:c.textMuted}}>Fi = <b style={{color:c.blue,fontSize:14}}>{d.Fi.toFixed(1)} kN</b></div>
    </div>
  )
}

function barColor(Fi, maxFi, c) {
  const r = maxFi > 0 ? Fi/maxFi : 0
  if (r < 0.5) return c.blue
  if (r < 0.8) return c.amber
  return c.red
}

function Check80({ label, Vdyn, Vstat, c }) {
  if (!Vdyn || !Vstat) return (
    <div style={{fontSize:12,color:c.textMuted,fontStyle:"italic"}}>
      {label}: Vxd/Vyd non renseigné — vérification indisponible
    </div>
  )
  const threshold = 0.8 * Vstat
  const ok = Vdyn >= threshold
  const coeff = ok ? null : (threshold / Vdyn).toFixed(3)
  return (
    <div style={{background:ok ? c.green+"11" : c.red+"11",
      border:`1px solid ${ok ? c.green : c.red}44`,
      borderRadius:8,padding:"10px 14px",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:ok ? 0 : 6}}>
        <span style={{fontSize:16}}>{ok ? "✅" : "❌"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:ok ? c.green : c.red}}>
            {label} — {ok ? "Condition vérifiée" : "Condition NON vérifiée"}
          </div>
          <div style={{fontSize:11,color:c.textMuted,fontFamily:"monospace",marginTop:2}}>
            Vxd/Vyd = {(+Vdyn).toFixed(1)} kN &nbsp;|&nbsp; 80%×V = {threshold.toFixed(1)} kN
          </div>
        </div>
      </div>
      {!ok && (
        <div style={{background:c.red+"22",borderRadius:6,padding:"6px 10px",
          fontSize:12,color:c.red}}>
          ⚠️ Coefficient de majoration à appliquer sur tous les résultats :{" "}
          <b style={{fontSize:15,fontFamily:"monospace"}}>{coeff}</b>
          <div style={{fontSize:11,color:c.textMuted,marginTop:2}}>
            = 0.8 × {Vstat.toFixed(1)} / {(+Vdyn).toFixed(1)}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTION RESULT PANEL
// ─────────────────────────────────────────────────────────────────────────────

function DirectionPanel({ dir, result, Vdyn, color, c }) {
  if (!result) return null
  const maxFi = Math.max(...result.story_forces.map(s => s.Fi))
  const chartData = [...result.story_forces].reverse()

  return (
    <div style={{flex:1,minWidth:280,display:"flex",flexDirection:"column",gap:12}}>

      {/* Direction header */}
      <div style={{background:color+"11",border:`1px solid ${color}33`,
        borderRadius:8,padding:"8px 12px",
        fontSize:12,color:color,fontWeight:700,
        textTransform:"uppercase",letterSpacing:"0.08em"}}>
        Direction {dir}
      </div>

      {/* Key cards */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <ResultCard label="T_emp"    value={result.T_emp.toFixed(3)} unit="s"       accent={c.purple}  c={c}/>
        <ResultCard label="T₀"       value={result.T0.toFixed(3)}    unit="s"       accent={color}     c={c}/>
        <ResultCard label="λ"        value={result.lambda_coef}      unit="coeff."  accent={c.amber}   c={c}/>
        <ResultCard label="Sad/g"    value={result.Sad_g.toFixed(4)} unit="—"       accent={c.green}   c={c}/>
        <ResultCard label="V (kN)"   value={result.V.toFixed(1)}     unit="kN"      accent={c.red}     c={c}/>
        {result.Ft > 0 && (
          <ResultCard label="Ft"     value={result.Ft.toFixed(1)}    unit="sommet"  accent={c.amber}   c={c}/>
        )}
      </div>

      {/* Formula trace */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:8,padding:"9px 13px",fontSize:11,color:c.textSec,fontFamily:"monospace"}}>
        V = <span style={{color:c.amber}}>{result.lambda_coef}</span>
        {" "}×{" "}<span style={{color:c.green}}>{result.Sad_g.toFixed(4)}</span>
        {" "}×{" "}<span style={{color:c.textSec}}>{result.W.toFixed(0)}</span>
        {" = "}<span style={{color:c.red,fontWeight:700}}>{result.V.toFixed(1)} kN</span>
        {result.T_cap !== result.T_emp && (
          <span style={{color:c.amber}}> · T₀ plafonné à {result.T_cap}s</span>
        )}
      </div>

      {/* 80% check */}
      <Check80 label={`Sens ${dir}`} Vdyn={Vdyn} Vstat={result.V} c={c}/>

      {/* Bar chart */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:10,padding:"14px 12px 10px"}}>
        <div style={{fontSize:11,color:c.textSec,marginBottom:10,fontWeight:600}}>
          Distribution Fi — Dir. {dir} <span style={{color,fontWeight:400}}>Éq.4.2</span>
        </div>
        <ResponsiveContainer width="100%" height={result.story_forces.length*40+20}>
          <BarChart data={chartData} layout="vertical"
            margin={{top:0,right:45,bottom:0,left:52}}>
            <CartesianGrid stroke={c.border} strokeDasharray="4 4" horizontal={false}/>
            <XAxis type="number" tick={{fill:c.textSec,fontSize:10}}
              tickFormatter={v => v.toFixed(0)}/>
            <YAxis type="category" dataKey="name" tick={{fill:c.textSec,fontSize:10}} width={48}/>
            <Tooltip content={<ForceTooltip c={c}/>}/>
            <Bar dataKey="Fi" radius={[0,4,4,0]}>
              {chartData.map((entry,i) => (
                <Cell key={i} fill={barColor(entry.Fi, maxFi, c)}/>
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Results table */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:10,overflow:"hidden",fontSize:11}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{background:c.elevated}}>
              {["Niveau","h(m)","Wi","Wi·hi","ratio","Fi(kN)"].map(h => (
                <th key={h} style={{padding:"6px 8px",textAlign:"right",
                  color:c.textSec,fontWeight:600,fontSize:10,
                  letterSpacing:"0.05em",textTransform:"uppercase",
                  borderBottom:`1px solid ${c.border}`,
                  ...(h==="Niveau"?{textAlign:"left"}:{})}}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...result.story_forces].reverse().map((sf,i) => (
              <tr key={i} style={{background:i%2===0?"transparent":c.elevated+"66"}}>
                <td style={{padding:"5px 8px",color:c.text,fontWeight:600}}>{sf.name}</td>
                <td style={{padding:"5px 8px",textAlign:"right",color:c.textSec,fontFamily:"monospace"}}>{sf.elevation.toFixed(1)}</td>
                <td style={{padding:"5px 8px",textAlign:"right",color:c.green, fontFamily:"monospace"}}>{sf.weight.toFixed(0)}</td>
                <td style={{padding:"5px 8px",textAlign:"right",color:c.textMuted,fontFamily:"monospace"}}>{(sf.weight*sf.elevation).toFixed(0)}</td>
                <td style={{padding:"5px 8px",textAlign:"right",color:c.textMuted,fontFamily:"monospace"}}>{(sf.ratio*100).toFixed(1)}%</td>
                <td style={{padding:"5px 8px",textAlign:"right",color,fontFamily:"monospace",fontWeight:700}}>{sf.Fi.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background:c.elevated,borderTop:`2px solid ${c.border}`}}>
              <td colSpan={5} style={{padding:"6px 8px",color:c.textSec,fontWeight:700,
                fontSize:10,textTransform:"uppercase",letterSpacing:"0.06em"}}>Total</td>
              <td style={{padding:"6px 8px",textAlign:"right",color:c.red,
                fontFamily:"monospace",fontWeight:700,fontSize:13}}>
                {result.story_forces.reduce((a,s) => a+s.Fi,0).toFixed(1)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function BaseShearPage({ params, c }) {
  const [resultX, setResultX] = useState(null)
  const [resultY, setResultY] = useState(null)
  const [loading,  setLoading] = useState(false)
  const [apiErr,   setApiErr]  = useState(null)

  // Prepare stories payload
  function storiesPayload() {
    return [...params.stories]
      .map(s => ({name:s.name.trim(), elevation:parseFloat(s.elevation), weight:parseFloat(s.weight)}))
      .filter(s => s.elevation>0 && s.weight>0)
      .sort((a,b) => a.elevation-b.elevation)
  }

  function isReady() {
    const sp = storiesPayload()
    return sp.length >= 1 && parseFloat(params.stories.map(s => s.elevation).filter(Boolean).slice(-1)[0]) > 0
  }

  async function fetchDirection(QF, R, TCalc) {
    const sp = storiesPayload()
    const hn = Math.max(...sp.map(s => s.elevation))
    const W  = sp.reduce((a,s) => a+s.weight, 0)

    const res = await fetch("http://localhost:8000/api/v1/base_shear", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        zone:             params.zone==="0" ? "I" : params.zone,
        site_class:       params.site,
        importance_group: params.group,
        QF, R,
        frame_system:     params.frameSys,
        hn,
        T_calculated:     TCalc ? parseFloat(TCalc) : null,
        stories:          sp,
      })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({detail:`HTTP ${res.status}`}))
      throw new Error(err.detail || `Erreur ${res.status}`)
    }
    return res.json()
  }

  async function calculate() {
    if (!isReady()) return
    setLoading(true)
    setApiErr(null)
    try {
      const [rX, rY] = await Promise.all([
        fetchDirection(
          params.twoDir ? params.QFx : params.QF,
          params.twoDir ? params.Rx  : params.R,
          params.Tx
        ),
        fetchDirection(
          params.twoDir ? params.QFy : params.QF,
          params.twoDir ? params.Ry  : params.R,
          params.Ty
        ),
      ])
      setResultX(rX)
      setResultY(rY)
    } catch (err) {
      const msg = err.message.toLowerCase()
      setApiErr(msg.includes("failed to fetch") || msg.includes("network")
        ? "Backend non démarré — uvicorn backend.main:app --reload --port 8000"
        : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px",transition:"background 0.2s"}}>

      {/* Header */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:5,fontWeight:600}}>
          RPA 2024 — DTR BC 2.48 — §4.2
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>
          Effort Tranchant à la Base
        </h1>
        <div style={{color:c.textSec,fontSize:13,marginTop:3}}>
          V = λ · Sad(T₀)/g · W — Directions X et Y
        </div>
      </div>

      {/* Params badges */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:12,padding:"10px 14px",marginBottom:14,
        display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:c.textMuted,textTransform:"uppercase",
          letterSpacing:"0.06em",fontWeight:600,marginRight:4}}>
          Paramètres généraux →
        </span>
        {[
          {l:"Zone",  v:params.zone,  col:c.blue},
          {l:"Site",  v:params.site,  col:c.green},
          {l:"Groupe",v:params.group, col:c.purple},
          ...(!params.twoDir
            ? [{l:"QF",v:params.QF.toFixed(2),col:c.amber},{l:"R",v:params.R,col:c.red}]
            : [{l:"QFx",v:params.QFx.toFixed(2),col:c.blue},{l:"Rx",v:params.Rx,col:c.blue},
               {l:"QFy",v:params.QFy.toFixed(2),col:c.purple},{l:"Ry",v:params.Ry,col:c.purple}]
          ),
          {l:"Niveaux", v:params.stories.length, col:c.textSec},
          {l:"W", v:`${params.stories.reduce((a,s)=>a+(parseFloat(s.weight)||0),0).toFixed(0)} kN`, col:c.green},
          ...(params.Tx ? [{l:"Tx",v:`${params.Tx}s`,col:c.blue}] : []),
          ...(params.Ty ? [{l:"Ty",v:`${params.Ty}s`,col:c.purple}] : []),
        ].map(b => (
          <div key={b.l} style={{background:c.elevated,borderRadius:6,padding:"4px 9px",fontSize:12}}>
            <span style={{color:c.textMuted}}>{b.l} </span>
            <b style={{color:b.col}}>{b.v}</b>
          </div>
        ))}
      </div>

      {/* Dynamic inputs info */}
      {(params.Vxd || params.Vyd) && (
        <div style={{background:c.amber+"11",border:`1px solid ${c.amber}33`,
          borderRadius:8,padding:"8px 13px",marginBottom:14,fontSize:12,color:c.amber,
          display:"flex",gap:16}}>
          <span>📊 Vérification 80% :</span>
          {params.Vxd && <span>Vxd = <b>{params.Vxd} kN</b></span>}
          {params.Vyd && <span>Vyd = <b>{params.Vyd} kN</b></span>}
        </div>
      )}

      {/* Calculate button */}
      <button type="button" onClick={calculate}
        disabled={loading || !isReady()}
        style={{padding:"12px 28px",borderRadius:10,cursor:"pointer",
          background:isReady() ? c.blue : c.border,
          border:"none",color:"white",fontSize:14,fontWeight:700,
          marginBottom:14,opacity:loading ? 0.7 : 1}}>
        {loading ? "Calcul en cours..." : "⚡ Calculer V (X et Y)"}
      </button>

      {apiErr && (
        <div style={{background:c.red+"15",border:`1px solid ${c.red}44`,
          borderRadius:8,padding:"10px 12px",fontSize:11,color:c.red,
          lineHeight:1.5,marginBottom:14}}>
          ❌ {apiErr}
        </div>
      )}

      {/* Results — two directions side by side */}
      {(resultX || resultY) && (
        <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"flex-start"}}>
          <DirectionPanel dir="X" result={resultX}
            Vdyn={params.Vxd ? parseFloat(params.Vxd) : null}
            color={c.blue} c={c}/>
          <DirectionPanel dir="Y" result={resultY}
            Vdyn={params.Vyd ? parseFloat(params.Vyd) : null}
            color={c.purple} c={c}/>
        </div>
      )}

      {!resultX && !loading && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",height:200,gap:12,color:c.textMuted}}>
          <div style={{fontSize:36}}>⚡</div>
          <div style={{fontSize:14,color:c.textSec}}>
            Vérifier les paramètres dans Paramètres généraux, puis cliquer "Calculer"
          </div>
        </div>
      )}
    </div>
  )
}
