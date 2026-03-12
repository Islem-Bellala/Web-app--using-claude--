/**
 * StructCalc — RPA 2024 Spectrum Visualizer (Session 4 — Full Update)
 *
 * Changes vs Session 3:
 *   - Theme received as prop from App (sidebar now synced)
 *   - Both H and V charts displayed side by side (no toggle)
 *   - R modal: dual mode (manual system selection + force entry)
 *   - Export to Robot (stub) + Export as .txt file (live)
 *   - Theme toggle moved to sidebar footer
 *
 * Code references:
 *   RPA 2024 §3.3.3 Eq.3.15 — horizontal design spectrum
 *   RPA 2024 §3.3.3 Eq.3.16 — vertical design spectrum
 *   RPA 2024 §3.5  Table 3.18 — structural systems + R values
 *   RPA 2024 §3.8  Table 3.19 — quality factor QF
 */

import { useState, useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"

// ─────────────────────────────────────────────────────────────────────────────
// RPA 2024 DATA TABLES
// ─────────────────────────────────────────────────────────────────────────────

const ZONE_A = { "I":0.07,"II":0.10,"III":0.15,"IV":0.20,"V":0.25,"VI":0.30 }
const IMPORTANCE_I = { "1A":1.4,"1B":1.2,"2":1.0,"3":0.8 }

const HORIZ_TYPE1 = {
  S1:{S:1.00,T1:0.10,T2:0.40,T3:2.0}, S2:{S:1.20,T1:0.10,T2:0.50,T3:2.0},
  S3:{S:1.30,T1:0.15,T2:0.60,T3:2.0}, S4:{S:1.35,T1:0.15,T2:0.70,T3:2.0},
}
const HORIZ_TYPE2 = {
  S1:{S:1.00,T1:0.05,T2:0.25,T3:1.2}, S2:{S:1.30,T1:0.05,T2:0.30,T3:1.2},
  S3:{S:1.55,T1:0.10,T2:0.40,T3:1.2}, S4:{S:1.80,T1:0.10,T2:0.50,T3:1.2},
}
const VERT_TYPE1 = {
  S1:{vR:0.90,T1:0.05,T2:0.20,T3:1.0,a:0.6}, S2:{vR:0.90,T1:0.05,T2:0.30,T3:1.0,a:0.6},
  S3:{vR:0.90,T1:0.05,T2:0.40,T3:1.0,a:0.6}, S4:{vR:0.90,T1:0.05,T2:0.50,T3:1.0,a:0.6},
}
const VERT_TYPE2 = {
  S1:{vR:0.55,T1:0.05,T2:0.15,T3:1.0,a:0.8}, S2:{vR:0.55,T1:0.05,T2:0.20,T3:1.0,a:0.8},
  S3:{vR:0.55,T1:0.05,T2:0.25,T3:1.0,a:0.8}, S4:{vR:0.55,T1:0.05,T2:0.30,T3:1.0,a:0.8},
}
const TYPE1_ZONES = new Set(["IV","V","VI"])

// RPA 2024 — Table 3.18 — Structural systems
// auto: function(ratio) that detects system from force ratio
const SYSTEMS = [
  {
    id:1, label:"Système 1 — Ossature",
    desc:"Ossature (portiques). Résistance à l'effort tranchant à la base : Vossature > 65% Vbase",
    R:5.5, qfCat:"a",
    detect: r => r.ossature > 0.65,
  },
  {
    id:2, label:"Système 2 — Mixte équivalent ossature",
    desc:"Mixte. L'ossature reprend 50% à 65% de l'effort tranchant à la base.",
    R:5.5, qfCat:"a",
    detect: r => r.ossature >= 0.50 && r.ossature <= 0.65,
  },
  {
    id:3, label:"Système 3 — Ossature avec remplissage rigide",
    desc:"Ossature ou mixte avec remplissage en maçonnerie rigide (≤ 10 cm).",
    R:3.5, qfCat:"a",
    detect: null, // must be selected manually — requires field inspection
  },
  {
    id:4, label:"Système 4 — Mixte équivalent voiles",
    desc:"Les voiles reprennent 50% à 65% de l'effort tranchant à la base.",
    R:4.5, qfCat:"b",
    detect: r => r.voiles >= 0.50 && r.voiles <= 0.65,
  },
  {
    id:5, label:"Système 5 — Voiles",
    desc:"Contreventement constitué par des voiles. Vvoiles > 65% Vbase.",
    R:4.5, qfCat:"b",
    detect: r => r.voiles > 0.65,
  },
  {
    id:6, label:"Système 6 — Noyau / Effet noyau",
    desc:"Système à noyau ou à effet noyau. Rayons de torsion rx, ry ≤ rayon de giration ls.",
    R:3.0, qfCat:"b",
    detect: null, // torsion check — manual
  },
]

// QF — Table 3.19
const QF_CRITERIA = {
  a:[
    {id:"a1",label:"Régularité en plan",              pq:0.05},
    {id:"a2",label:"Régularité en élévation",         pq:0.20},
    {id:"a3",label:"Conditions min. niveaux (≥ 2)",   pq:0.20},
    {id:"a4",label:"Conditions min. travées (≥ 3)",   pq:0.10},
  ],
  b:[
    {id:"b1",label:"Régularité en plan",              pq:0.05},
    {id:"b2",label:"Régularité en élévation",         pq:0.20},
    {id:"b3",label:"Redondance en plan (≥ 2 files)",  pq:0.05},
  ],
  c:[],
}
const QF_MAX = {a:1.35, b:1.30, c:1.0}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING FORMULAS
// ─────────────────────────────────────────────────────────────────────────────

function sadH(T, A, I, S, QF, R, T1, T2, T3) {
  const g = QF/R, base = A*I*S, floor = 0.2*A*I
  let v
  if      (T < T1) v = base*(2/3 + (T/T1)*(2.5*g - 2/3))
  else if (T < T2) v = base*2.5*g
  else if (T < T3) v = base*2.5*g*(T2/T)
  else             v = base*2.5*g*(T2*T3/Math.min(T,4)**2)
  return Math.max(v, floor)
}

function svdV(T, Av, I, T1, T2, T3, alpha) {
  const g = 1/1.5, floor = 0.2*Av*I
  let v
  if      (T < T1) v = Av*I*(2/3 + (T/T1)*(2.5*g - 2/3))
  else if (T < T2) v = Av*I*2.5*g
  else if (T < T3) v = Av*I*2.5*g*Math.pow(T2/T, alpha)
  else             v = Av*I*2.5*g*Math.pow(T2*T3/Math.min(T,4)**2, alpha)
  return Math.max(v, floor)
}

function buildH(zone, site, group, QF, R) {
  const A=ZONE_A[zone], I=IMPORTANCE_I[group], isT1=TYPE1_ZONES.has(zone)
  const p = isT1 ? HORIZ_TYPE1[site] : HORIZ_TYPE2[site]
  const {S,T1,T2,T3} = p
  const pts = []
  for (let T=0; T<=4.001; T=Math.round((T+0.01)*1000)/1000)
    pts.push({T:+T.toFixed(3), Sa_g:+sadH(T,A,I,S,QF,R,T1,T2,T3).toFixed(5)})
  return {A,I,S,T1,T2,T3,isT1,
    peak:+(A*I*S*2.5*(QF/R)).toFixed(4),
    floor:+(0.2*A*I).toFixed(4), pts}
}

function buildV(zone, site, group) {
  const A=ZONE_A[zone], I=IMPORTANCE_I[group], isT1=TYPE1_ZONES.has(zone)
  const vp = isT1 ? VERT_TYPE1[site] : VERT_TYPE2[site]
  const {vR,T1,T2,T3,a} = vp
  const Av = +(vR*A).toFixed(4)
  const pts = []
  for (let T=0; T<=4.001; T=Math.round((T+0.01)*1000)/1000)
    pts.push({T:+T.toFixed(3), Sa_g:+svdV(T,Av,I,T1,T2,T3,a).toFixed(5)})
  return {Av,I,T1,T2,T3,alpha:a,isT1,
    peak:+(Av*I*2.5/1.5).toFixed(4),
    floor:+(0.2*Av*I).toFixed(4), pts}
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Robot-compatible format: two columns only — T and Sa/g, no headers, no extra text
function exportTxtH(hData, zone, site) {
  const lines = hData.pts.map(p =>
    p.T.toFixed(2).padEnd(10) + p.Sa_g.toFixed(6)
  )
  const blob = new Blob([lines.join("\n")], {type:"text/plain"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `RPA24_Sad_Zone${zone}_${site}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function exportTxtV(vData, zone, site) {
  const lines = vData.pts.map(p =>
    p.T.toFixed(2).padEnd(10) + p.Sa_g.toFixed(6)
  )
  const blob = new Blob([lines.join("\n")], {type:"text/plain"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `RPA24_Svd_Zone${zone}_${site}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Sel({label, value, onChange, options, c}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,textTransform:"uppercase"}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        background:c.elevated, border:`1px solid ${c.border}`,
        color:c.text, borderRadius:8, padding:"8px 10px",
        fontSize:13, cursor:"pointer", outline:"none",
      }}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Card({label, value, unit, accent, c}) {
  return (
    <div style={{background:c.elevated, border:`1px solid ${accent}44`,
      borderRadius:10, padding:"12px 14px", flex:1, minWidth:84}}>
      <div style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,
        textTransform:"uppercase",marginBottom:5}}>{label}</div>
      <div style={{fontSize:24,fontWeight:700,color:accent,
        fontFamily:"monospace",lineHeight:1.1}}>{value}</div>
      {unit&&<div style={{fontSize:11,color:c.textMuted,marginTop:3}}>{unit}</div>}
    </div>
  )
}

function ChartTooltip({active, payload, c}) {
  if (!active||!payload?.length) return null
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

function MiniChart({data, color, T1, T2, T3, floor, peak, label, eq, c}) {
  return (
    <div style={{background:c.surface, border:`1px solid ${c.border}`,
      borderRadius:12, padding:"16px 12px 10px", flex:1, minWidth:280}}>
      <div style={{fontSize:11,color:c.textMuted,marginBottom:10,display:"flex",
        justifyContent:"space-between",alignItems:"center"}}>
        <span>
          <b style={{color,fontWeight:700}}>{label}</b>
          &nbsp;·&nbsp;<span style={{color:c.blue}}>{eq}</span>
        </span>
        <span style={{fontFamily:"monospace",color:c.amber}}>min={floor}</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{top:4,right:10,bottom:20,left:2}}>
          <CartesianGrid stroke={c.border} strokeDasharray="4 4"/>
          <XAxis dataKey="T" type="number" domain={[0,4]}
            ticks={[0,0.5,1,1.5,2,2.5,3,3.5,4]}
            tick={{fill:c.textMuted,fontSize:10}}
            label={{value:"T (s)",position:"insideBottom",offset:-12,fill:c.textMuted,fontSize:10}}/>
          <YAxis tick={{fill:c.textMuted,fontSize:10}}
            label={{value:"Sa/g",angle:-90,position:"insideLeft",offset:13,fill:c.textMuted,fontSize:10}}/>
          <Tooltip content={<ChartTooltip c={c}/>}/>
          <ReferenceLine x={T1} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₁",fill:c.textMuted,fontSize:9,position:"top"}}/>
          <ReferenceLine x={T2} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₂",fill:c.textMuted,fontSize:9,position:"top"}}/>
          <ReferenceLine x={T3} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₃",fill:c.textMuted,fontSize:9,position:"top"}}/>
          <ReferenceLine y={peak}  stroke={c.red+"44"}   strokeDasharray="3 3"/>
          <ReferenceLine y={floor} stroke={c.amber+"44"} strokeDasharray="3 3"/>
          <Line dataKey="Sa_g" dot={false} strokeWidth={2.5}
            stroke={color} isAnimationActive animationDuration={300}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QF MODAL
// ─────────────────────────────────────────────────────────────────────────────

const DEF_CHECKED = {a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true}

function QFModal({onClose, onValidate, initCat, initChecked, c}) {
  const [cat, setCat] = useState(initCat)
  const [chk, setChk] = useState(initChecked)
  const criteria = QF_CRITERIA[cat]

  const qf = useMemo(() => {
    if (cat==="c") return 1.0
    let t = 1.0
    criteria.forEach(cr => { if (!chk[cr.id]) t += cr.pq })
    return +Math.min(t, QF_MAX[cat]).toFixed(2)
  }, [cat, chk, criteria])

  function changeCat(c2) {
    setCat(c2)
    const r = {}
    QF_CRITERIA[c2].forEach(cr => { r[cr.id]=true })
    setChk(r)
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:14,padding:26,width:450,maxWidth:"95vw",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,
              textTransform:"uppercase",marginBottom:3}}>RPA 2024 — §3.8 — Table 3.19</div>
            <h2 style={{fontSize:17,fontWeight:700,color:c.text,margin:0}}>
              Facteur de Qualité Q<sub>F</sub>
            </h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>
              Q<sub>F</sub> = 1 + Σ P<sub>q</sub>
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",
            color:c.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:7,marginBottom:14}}>
          {[{id:"a",l:"(a) Ossatures",s:"Syst. 1,2,3"},
            {id:"b",l:"(b) Voiles",s:"Syst. 4,5,6"},
            {id:"c",l:"(c) Spécial",s:"QF = 1.0"}].map(ct=>(
            <button key={ct.id} onClick={()=>changeCat(ct.id)} style={{
              flex:1,padding:"7px 5px",borderRadius:8,cursor:"pointer",
              border:`1px solid ${cat===ct.id?c.blue:c.border}`,
              background:cat===ct.id?c.blue+"22":c.elevated,
              color:cat===ct.id?c.blue:c.textSec,
              fontSize:12,fontWeight:cat===ct.id?700:400,textAlign:"center"}}>
              <div style={{fontWeight:600}}>{ct.l}</div>
              <div style={{fontSize:10,opacity:0.7,marginTop:1}}>{ct.s}</div>
            </button>
          ))}
        </div>

        {cat==="c" ? (
          <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,
            borderRadius:8,padding:"12px",textAlign:"center",
            color:c.green,marginBottom:14,fontSize:14}}>
            Aucune pénalité — <b>Q<sub>F</sub> = 1.0</b>
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:7,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              ✅ Satisfait = pas de pénalité
            </div>
            {criteria.map(cr=>(
              <div key={cr.id} onClick={()=>setChk(p=>({...p,[cr.id]:!p[cr.id]}))}
                style={{display:"flex",alignItems:"center",gap:10,
                  padding:"9px 11px",borderRadius:8,cursor:"pointer",
                  background:chk[cr.id]?c.green+"11":c.red+"11",
                  border:`1px solid ${chk[cr.id]?c.green+"44":c.red+"44"}`,
                  marginBottom:5}}>
                <div style={{width:20,height:20,borderRadius:5,flexShrink:0,
                  border:`2px solid ${chk[cr.id]?c.green:c.red}`,
                  background:chk[cr.id]?c.green:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:"white",fontWeight:700}}>
                  {chk[cr.id]?"✓":""}
                </div>
                <div style={{flex:1,fontSize:13,color:c.text}}>{cr.label}</div>
                <div style={{fontSize:13,fontFamily:"monospace",
                  color:chk[cr.id]?c.green:c.red,fontWeight:700}}>
                  {chk[cr.id]?"+0.00":`+${cr.pq.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{background:c.elevated,borderRadius:10,padding:"11px 14px",
          marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:2}}>Q<sub>F</sub> résultant</div>
            <div style={{fontSize:32,fontWeight:700,fontFamily:"monospace",
              color:qf<=1.05?c.green:qf<=1.20?c.amber:c.red}}>
              {qf.toFixed(2)}
            </div>
            <div style={{fontSize:11,color:c.textMuted,marginTop:1}}>
              Plage : 1.00 ≤ Q<sub>F</sub> ≤ {QF_MAX[cat]}
            </div>
          </div>
          <div style={{fontSize:40}}>{qf<=1.05?"✅":qf<=1.20?"⚠️":"🔴"}</div>
        </div>

        <button onClick={()=>onValidate(qf,cat,chk)} style={{
          width:"100%",padding:"11px",borderRadius:8,cursor:"pointer",
          background:c.blue,border:"none",color:"white",fontSize:14,fontWeight:700}}>
          Valider Q<sub>F</sub> = {qf.toFixed(2)}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// R MODAL
// ─────────────────────────────────────────────────────────────────────────────

function RModal({onClose, onValidate, initSystem, c}) {
  const [tab,    setTab]    = useState("manual")
  const [selSys, setSelSys] = useState(initSystem)
  const [Voss,   setVoss]   = useState("")
  const [Vvoi,   setVvoi]   = useState("")
  const [Vtot,   setVtot]   = useState("")
  const [detSys, setDetSys] = useState(null)

  // Active system — from manual selection or auto-detection
  const activeSys = tab==="manual"
    ? SYSTEMS.find(s=>s.id===selSys)
    : detSys

  function detectFromForces() {
    const vo=parseFloat(Voss), vv=parseFloat(Vvoi), vt=parseFloat(Vtot)
    if (isNaN(vt)||vt<=0) return
    const ratio = {ossature:(isNaN(vo)?0:vo)/vt, voiles:(isNaN(vv)?0:vv)/vt}
    const found = SYSTEMS.find(s=>s.detect && s.detect(ratio))
    setDetSys(found||null)
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:14,padding:26,width:520,maxWidth:"95vw",
        maxHeight:"90vh",overflowY:"auto",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",
          alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,
              textTransform:"uppercase",marginBottom:3}}>RPA 2024 — §3.5 — Table 3.18</div>
            <h2 style={{fontSize:17,fontWeight:700,color:c.text,margin:0}}>
              Coefficient de Comportement R
            </h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>
              Identification du système de contreventement
            </div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",
            color:c.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:7,marginBottom:16}}>
          {[{id:"manual",l:"🏗️ Sélection manuelle"},
            {id:"forces",l:"📊 Par effort tranchant"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"9px",borderRadius:8,cursor:"pointer",
              border:`1px solid ${tab===t.id?c.blue:c.border}`,
              background:tab===t.id?c.blue+"22":c.elevated,
              color:tab===t.id?c.blue:c.textSec,
              fontSize:13,fontWeight:tab===t.id?700:400}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── Tab: Manual selection — no Robot strip here ── */}
        {tab==="manual" && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:9,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              Choisir le système de contreventement
            </div>
            {SYSTEMS.map(sys=>(
              <div key={sys.id} onClick={()=>setSelSys(sys.id)}
                style={{display:"flex",alignItems:"flex-start",gap:11,
                  padding:"10px 12px",borderRadius:8,cursor:"pointer",marginBottom:5,
                  background:selSys===sys.id?c.blue+"15":c.elevated,
                  border:`1px solid ${selSys===sys.id?c.blue:c.border}`}}>
                <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${selSys===sys.id?c.blue:c.borderLight}`,
                  background:selSys===sys.id?c.blue:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,color:"white",fontWeight:700,marginTop:1}}>
                  {selSys===sys.id?"●":""}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:c.text,marginBottom:2}}>
                    {sys.label}
                    <span style={{marginLeft:8,fontSize:11,
                      color:sys.qfCat==="a"?c.blue:c.purple,
                      background:(sys.qfCat==="a"?c.blue:c.purple)+"22",
                      borderRadius:4,padding:"1px 5px"}}>
                      Cat. ({sys.qfCat})
                    </span>
                  </div>
                  <div style={{fontSize:11,color:c.textMuted,lineHeight:1.5}}>{sys.desc}</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:c.amber,
                  fontFamily:"monospace",flexShrink:0}}>
                  R={sys.R}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Force entry — Robot strip here only ── */}
        {tab==="forces" && (
          <div style={{marginBottom:16}}>
            {/* Robot strip — only in this tab */}
            <div style={{background:c.elevated,border:`1px solid ${c.border}`,
              borderRadius:8,padding:"9px 13px",marginBottom:14,
              display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",
                background:c.borderLight,flexShrink:0}}/>
              <span style={{fontSize:12,color:c.textMuted,flex:1}}>
                Robot non connecté — import automatique indisponible
              </span>
              <button style={{padding:"5px 11px",borderRadius:6,cursor:"not-allowed",
                background:c.border,border:"none",color:c.textMuted,fontSize:11}}>
                Connecter
              </button>
            </div>

            <div style={{fontSize:11,color:c.textMuted,marginBottom:10,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              Saisir les efforts tranchants à la base
            </div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[
                {label:"V ossature (kN)",val:Voss,set:setVoss},
                {label:"V voiles (kN)",  val:Vvoi,set:setVvoi},
                {label:"V total (kN)",   val:Vtot,set:setVtot},
              ].map(f=>(
                <div key={f.label} style={{flex:1}}>
                  <div style={{fontSize:11,color:c.textMuted,marginBottom:4}}>{f.label}</div>
                  <input type="number" min={0} value={f.val}
                    onChange={e=>f.set(e.target.value)}
                    style={{width:"100%",background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:7,padding:"8px 10px",color:c.text,
                      fontSize:15,fontFamily:"monospace",outline:"none"}}/>
                </div>
              ))}
            </div>

            {Vtot && parseFloat(Vtot)>0 && (
              <div style={{background:c.elevated,borderRadius:8,padding:"10px 13px",
                marginBottom:12,fontSize:12,color:c.textMuted}}>
                {Voss&&<div>V<sub>ossature</sub>/V<sub>base</sub> = <b style={{color:c.text,fontFamily:"monospace"}}>
                  {((parseFloat(Voss)||0)/parseFloat(Vtot)*100).toFixed(1)}%
                </b></div>}
                {Vvoi&&<div>V<sub>voiles</sub>/V<sub>base</sub> = <b style={{color:c.text,fontFamily:"monospace"}}>
                  {((parseFloat(Vvoi)||0)/parseFloat(Vtot)*100).toFixed(1)}%
                </b></div>}
              </div>
            )}

            <button onClick={detectFromForces} style={{
              width:"100%",padding:"9px",borderRadius:8,cursor:"pointer",
              background:c.blue,border:"none",color:"white",
              fontSize:13,fontWeight:700,marginBottom:10}}>
              Détecter le système automatiquement
            </button>

            {detSys ? (
              <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,
                borderRadius:8,padding:"11px 13px"}}>
                <div style={{fontSize:12,color:c.green,marginBottom:3}}>✅ Système identifié</div>
                <div style={{fontSize:14,fontWeight:700,color:c.text}}>{detSys.label}</div>
                <div style={{fontSize:11,color:c.textMuted,marginTop:2}}>{detSys.desc}</div>
              </div>
            ) : (Voss||Vvoi||Vtot) ? (
              <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,
                borderRadius:8,padding:"10px 13px",fontSize:12,color:c.amber}}>
                ⚠️ Système 3 ou 6 — sélection manuelle requise
              </div>
            ) : null}
          </div>
        )}

        {/* R summary — table value only, no adjustment */}
        {activeSys && (
          <div style={{background:c.elevated,border:`1px solid ${c.amber}44`,
            borderRadius:10,padding:"14px 16px",marginBottom:16,
            display:"flex",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:c.textMuted,marginBottom:2}}>
                Valeur R — {activeSys.label}
              </div>
              <div style={{fontSize:11,color:c.textMuted}}>
                Cat. Q<sub>F</sub> :&nbsp;
                <b style={{color:activeSys.qfCat==="a"?c.blue:c.purple}}>
                  ({activeSys.qfCat})
                </b>
              </div>
            </div>
            <div style={{fontSize:42,fontWeight:700,fontFamily:"monospace",color:c.amber}}>
              {activeSys.R}
            </div>
          </div>
        )}

        <button
          onClick={()=>onValidate(activeSys?.R, activeSys)}
          disabled={!activeSys}
          style={{width:"100%",padding:"11px",borderRadius:8,
            cursor:activeSys?"pointer":"not-allowed",
            background:activeSys?c.blue:c.border,
            border:"none",color:"white",fontSize:14,fontWeight:700}}>
          {activeSys ? `Valider R = ${activeSys.R}` : "Sélectionner un système d'abord"}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectrumChart({ c, isDark }) {
  const [zone,     setZone]    = useState("VI")
  const [site,     setSite]    = useState("S2")
  const [group,    setGroup]   = useState("2")
  const [QF,       setQF]      = useState(1.0)
  const [R,        setR]       = useState(4.5)
  const [selSys,   setSelSys]  = useState(1)
  const [qfCat,    setQfCat]   = useState("a")
  const [qfChk,    setQfChk]   = useState(DEF_CHECKED)
  const [showQ,    setShowQ]   = useState(false)
  const [showR,    setShowR]   = useState(false)

  const hData = useMemo(()=>buildH(zone,site,group,QF,R),  [zone,site,group,QF,R])
  const vData = useMemo(()=>buildV(zone,site,group),        [zone,site,group])
  const isT1  = TYPE1_ZONES.has(zone)

  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px",transition:"background 0.2s,color 0.2s"}}>

      {showQ && <QFModal c={c} initCat={qfCat} initChecked={qfChk}
        onClose={()=>setShowQ(false)}
        onValidate={(qf,cat,chk)=>{setQF(qf);setQfCat(cat);setQfChk(chk);setShowQ(false)}}/>}

      {showR && <RModal c={c} initSystem={selSys}
        onClose={()=>setShowR(false)}
        onValidate={(r,sys)=>{
          setR(r)
          if(sys){setSelSys(sys.id); setQfCat(sys.qfCat)}
          setShowR(false)
        }}/>}

      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,letterSpacing:"0.15em",color:c.blue,
          textTransform:"uppercase",marginBottom:5}}>
          RPA 2024 — DTR BC 2.48 — §3.3.3
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>
          Spectre de Réponse de Calcul
        </h1>
        <div style={{color:c.textMuted,fontSize:12,marginTop:3}}>
          Composantes horizontale (Éq. 3.15) et verticale (Éq. 3.16)
        </div>
      </div>

      <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>

        {/* ── Input panel ── */}
        <div style={{background:c.surface,border:`1px solid ${c.border}`,
          borderRadius:14,padding:18,width:200,flexShrink:0,
          display:"flex",flexDirection:"column",gap:13}}>

          <div style={{fontSize:11,letterSpacing:"0.1em",
            color:c.blue,textTransform:"uppercase"}}>Paramètres</div>

          <Sel label="Zone sismique" value={zone} onChange={setZone} c={c} options={[
            {v:"I",l:"Zone I — Faible"},{v:"II",l:"Zone II"},
            {v:"III",l:"Zone III — Moyenne"},{v:"IV",l:"Zone IV"},
            {v:"V",l:"Zone V — Élevée"},{v:"VI",l:"Zone VI — Élevée"},
          ]}/>
          <Sel label="Classe de site" value={site} onChange={setSite} c={c} options={[
            {v:"S1",l:"S1 — Rocher"},{v:"S2",l:"S2 — Ferme"},
            {v:"S3",l:"S3 — Meuble"},{v:"S4",l:"S4 — Très meuble"},
          ]}/>
          <Sel label="Groupe d'importance" value={group} onChange={setGroup} c={c} options={[
            {v:"1A",l:"Groupe 1A — I=1.4"},{v:"1B",l:"Groupe 1B — I=1.2"},
            {v:"2",l:"Groupe 2 — I=1.0"},{v:"3",l:"Groupe 3 — I=0.8"},
          ]}/>

          {/* QF button */}
          <div>
            <div style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,
              textTransform:"uppercase",marginBottom:5}}>Facteur qualité Q<sub>F</sub></div>
            <button onClick={()=>setShowQ(true)} style={{
              width:"100%",display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"9px 11px",borderRadius:8,
              cursor:"pointer",background:c.elevated,
              border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
              <span>Q<sub>F</sub> = <b style={{color:c.amber}}>{QF.toFixed(2)}</b></span>
              <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
            </button>
          </div>

          {/* R button */}
          <div>
            <div style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,
              textTransform:"uppercase",marginBottom:5}}>Coeff. comportement R</div>
            <button onClick={()=>setShowR(true)} style={{
              width:"100%",display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"9px 11px",borderRadius:8,
              cursor:"pointer",background:c.elevated,
              border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
              <span>R = <b style={{color:c.red}}>{R}</b></span>
              <span style={{fontSize:11,color:c.blue}}>Identifier →</span>
            </button>
            <div style={{fontSize:10,color:c.textMuted,marginTop:4,paddingLeft:2}}>
              Syst. {selSys} · Cat. Q<sub>F</sub> ({qfCat})
            </div>
          </div>

          {/* Spectrum type badge */}
          <div style={{background:isT1?c.blue+"22":c.green+"22",
            border:`1px solid ${isT1?c.blue:c.green}`,
            borderRadius:8,padding:"8px 11px",textAlign:"center"}}>
            <div style={{fontSize:10,color:c.textMuted,marginBottom:2}}>Type de spectre</div>
            <div style={{fontSize:14,fontWeight:700,color:isT1?c.blue:c.green}}>
              {isT1?"Type 1":"Type 2"}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{flex:1,minWidth:300,display:"flex",flexDirection:"column",gap:14}}>

          {/* Param cards */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Card label="A"    value={hData.A}       unit="zone"         accent={c.amber}    c={c}/>
            <Card label="I"    value={hData.I}       unit="importance"   accent={c.purple}   c={c}/>
            <Card label="S"    value={hData.S}       unit="site"         accent={c.green}    c={c}/>
            <Card label="QF"   value={QF.toFixed(2)} unit="qualité"      accent={c.amber}    c={c}/>
            <Card label="R"    value={R}             unit="comportement" accent={c.red}      c={c}/>
            <Card label="T₁"   value={hData.T1}      unit="sec"          accent={c.textMuted} c={c}/>
            <Card label="T₂"   value={hData.T2}      unit="sec"          accent={c.textMuted} c={c}/>
            <Card label="T₃"   value={hData.T3}      unit="sec"          accent={c.textMuted} c={c}/>
          </div>

          {/* Both charts side by side */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <MiniChart
              data={hData.pts} color={c.blue}
              T1={hData.T1} T2={hData.T2} T3={hData.T3}
              floor={hData.floor} peak={hData.peak}
              label="Sad(T)/g" eq="Éq. 3.15" c={c}/>
            <MiniChart
              data={vData.pts} color={c.purple}
              T1={vData.T1} T2={vData.T2} T3={vData.T3}
              floor={vData.floor} peak={vData.peak}
              label="Svd(T)/g" eq="Éq. 3.16" c={c}/>
          </div>

          {/* Formula + Export bar */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,
            borderRadius:10,padding:"11px 14px",
            display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>

            {/* Formula */}
            <div style={{flex:1,fontSize:12,color:c.textMuted,fontFamily:"monospace",
              minWidth:240}}>
              <span style={{color:c.blue,fontWeight:700}}>Éq.3.15</span>
              {"  "}Sad(palier)={hData.A}·{hData.I}·{hData.S}·2.5·({QF.toFixed(2)}/{R})={" "}
              <span style={{color:c.red,fontWeight:700}}>{hData.peak}</span>
              {"  "}
              <span style={{color:c.purple,fontWeight:700,marginLeft:10}}>Éq.3.16</span>
              {"  "}Svd(palier)=<span style={{color:c.purple,fontWeight:700}}>{vData.peak}</span>
            </div>

            {/* Export buttons */}
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button
                onClick={()=>alert("Export vers Robot — disponible après connexion bridge (Session 6)")}
                style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
                  background:c.blue+"22",border:`1px solid ${c.blue}`,
                  color:c.blue,fontSize:12,fontWeight:600,
                  display:"flex",alignItems:"center",gap:6}}>
                🔌 Export → Robot
              </button>
              <button
                onClick={()=>exportTxtH(hData,zone,site)}
                style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
                  background:c.blue+"11",border:`1px solid ${c.blue}66`,
                  color:c.blue,fontSize:12,fontWeight:600,
                  display:"flex",alignItems:"center",gap:5}}>
                📄 Sad → .txt
              </button>
              <button
                onClick={()=>exportTxtV(vData,zone,site)}
                style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
                  background:c.purple+"11",border:`1px solid ${c.purple}66`,
                  color:c.purple,fontSize:12,fontWeight:600,
                  display:"flex",alignItems:"center",gap:5}}>
                📄 Svd → .txt
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
