/**
 * StructCalc — Base Shear Page
 * RPA 2024 §4.2 — Méthode Statique Équivalente
 *
 * What this page does:
 *   1. Engineer enters seismic parameters + storey table
 *   2. React sends POST /api/v1/base_shear to Python backend
 *   3. Python computes V, Ft, T0, Fi per storey
 *   4. React displays results: key cards + force distribution chart
 *
 * Code references:
 *   RPA 2024 §4.2.4  Eq.4.4 — empirical period
 *   RPA 2024 §4.2    Eq.4.1 — base shear V
 *   RPA 2024 §4.2    Eq.4.2 — storey force distribution
 *   RPA 2024 §4.2    Eq.4.3 — additional top force Ft
 */

import { useState, useEffect } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from "recharts"

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS  (display only — no engineering formulas)
// ─────────────────────────────────────────────────────────────────────────────

const ZONES   = ["I","II","III","IV","V","VI"]
const SITES   = ["S1","S2","S3","S4"]
const GROUPS  = [
  {v:"1A",l:"Groupe 1A — I=1.4"},
  {v:"1B",l:"Groupe 1B — I=1.2"},
  {v:"2", l:"Groupe 2 — I=1.0"},
  {v:"3", l:"Groupe 3 — I=0.8"},
]
const FRAME_SYSTEMS = [
  {v:"ba_no_infill",    l:"Ossature BA sans remplissage",       ct:"CT = 0.075"},
  {v:"steel_no_infill", l:"Ossature acier sans remplissage",    ct:"CT = 0.085"},
  {v:"ba_with_infill",  l:"Ossature BA/acier avec remplissage", ct:"CT = 0.050"},
  {v:"other",           l:"Autres systèmes",                    ct:"CT = 0.050"},
]

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Sel({ label, value, onChange, options, c }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:11, letterSpacing:"0.06em", color:c.textSec,
        textTransform:"uppercase", fontWeight:600 }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background:c.elevated, border:`1px solid ${c.border}`,
        color:c.text, borderRadius:8, padding:"8px 10px",
        fontSize:13, cursor:"pointer", outline:"none",
      }}>
        {options.map(o => (
          <option key={o.v ?? o} value={o.v ?? o}>
            {o.l ?? o}
          </option>
        ))}
      </select>
    </div>
  )
}

function ResultCard({ label, value, unit, accent, sub, c }) {
  return (
    <div style={{ background:c.elevated, border:`1px solid ${accent}44`,
      borderRadius:10, padding:"12px 14px", flex:1, minWidth:100 }}>
      <div style={{ fontSize:11, letterSpacing:"0.06em", color:c.textSec,
        textTransform:"uppercase", fontWeight:600, marginBottom:5 }}>
        {label}{sub && <sub style={{fontSize:9}}>{sub}</sub>}
      </div>
      <div style={{ fontSize:22, fontWeight:700, color:accent,
        fontFamily:"monospace", lineHeight:1.1 }}>{value}</div>
      {unit && <div style={{ fontSize:11, color:c.textMuted, marginTop:3 }}>{unit}</div>}
    </div>
  )
}

// Custom tooltip for the bar chart
function ForceTooltip({ active, payload, c }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background:c.elevated, border:`1px solid ${c.borderLight}`,
      borderRadius:8, padding:"9px 13px", fontSize:12 }}>
      <div style={{ color:c.text, fontWeight:700, marginBottom:4 }}>{d.name}</div>
      <div style={{ color:c.textMuted }}>
        Hauteur : <b style={{ color:c.text }}>{d.elevation} m</b>
      </div>
      <div style={{ color:c.textMuted }}>
        Poids Wi : <b style={{ color:c.text }}>{d.weight} kN</b>
      </div>
      <div style={{ color:c.textMuted }}>
        Fi : <b style={{ color:c.blue, fontSize:14 }}>{d.Fi.toFixed(1)} kN</b>
      </div>
      <div style={{ color:c.textMuted }}>
        Wi·hi / ΣWj·hj : <b style={{ color:c.text }}>{(d.ratio*100).toFixed(1)}%</b>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT STOREY TABLE — 4-storey example building
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_STORIES = [
  { id:1, name:"RDC",     elevation:"3.0",  weight:"1200" },
  { id:2, name:"Etage 1", elevation:"6.0",  weight:"1100" },
  { id:3, name:"Etage 2", elevation:"9.0",  weight:"1100" },
  { id:4, name:"Etage 3", elevation:"12.0", weight:"900"  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function BaseShearPage({ c }) {

  // ── Seismic parameters ────────────────────────────────────────────────────
  const [zone,    setZone]    = useState("VI")
  const [site,    setSite]    = useState("S2")
  const [group,   setGroup]   = useState("2")
  const [QF,      setQF]      = useState("1.15")
  const [R,       setR]       = useState("4.5")

  // ── Period parameters ─────────────────────────────────────────────────────
  const [frameSys, setFrameSys] = useState("ba_with_infill")
  const [hn,       setHn]       = useState("12.0")
  const [TCalc,    setTCalc]    = useState("")   // optional — empty = use empirical

  // ── Storey table ──────────────────────────────────────────────────────────
  const [stories, setStories] = useState(DEFAULT_STORIES)
  let nextId = stories.length + 1

  function addStorey() {
    const last = stories[stories.length - 1]
    const lastElev = parseFloat(last?.elevation) || 0
    const lastH    = stories.length >= 2
      ? parseFloat(last.elevation) - parseFloat(stories[stories.length-2].elevation)
      : 3.0
    setStories(prev => [
      ...prev,
      {
        id:        Date.now(),
        name:      `Etage ${stories.length}`,
        elevation: (lastElev + lastH).toFixed(1),
        weight:    last?.weight || "1000",
      }
    ])
  }

  function removeStorey(id) {
    if (stories.length <= 1) return
    setStories(prev => prev.filter(s => s.id !== id))
  }

  function updateStorey(id, field, value) {
    setStories(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  // ── API state ─────────────────────────────────────────────────────────────
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr]  = useState(null)

  // ── Validation helpers ────────────────────────────────────────────────────
  function storiesValid() {
    return stories.every(s =>
      s.name.trim() &&
      parseFloat(s.elevation) > 0 &&
      parseFloat(s.weight)    > 0
    ) && parseFloat(hn) > 0
  }

  function storiesPayload() {
    // Sort by elevation ascending before sending to API
    return [...stories]
      .map(s => ({
        name:      s.name.trim(),
        elevation: parseFloat(s.elevation),
        weight:    parseFloat(s.weight),
      }))
      .sort((a, b) => a.elevation - b.elevation)
  }

  // ── Fetch from backend ────────────────────────────────────────────────────
  async function calculate() {
    if (!storiesValid()) return
    setLoading(true)
    setApiErr(null)

    const payload = {
      zone,
      site_class:       site,
      importance_group: group,
      QF:               parseFloat(QF)  || 1.0,
      R:                parseFloat(R)   || 3.5,
      frame_system:     frameSys,
      hn:               parseFloat(hn),
      T_calculated:     TCalc ? parseFloat(TCalc) : null,
      stories:          storiesPayload(),
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/base_shear", {
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body   : JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
        throw new Error(err.detail || `Erreur serveur ${res.status}`)
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      const msg = err.message.toLowerCase()
      const isNet = msg.includes("failed to fetch") || msg.includes("network")
      setApiErr(isNet
        ? "Backend non démarré — uvicorn backend.main:app --reload --port 8000"
        : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Chart data — storeys ordered bottom→top for display ───────────────────
  // Chart shows storeys with the ground floor at the bottom (inverted for bar chart)
  const chartData = result
    ? [...result.story_forces].reverse()   // top storey first in recharts horizontal bar
    : []

  // Colour gradient: low force = blue, high force = red
  function barColor(Fi, maxFi) {
    const ratio = maxFi > 0 ? Fi / maxFi : 0
    if (ratio < 0.5) return "#60a5fa"   // blue
    if (ratio < 0.8) return "#fbbf24"   // amber
    return "#f87171"                     // red
  }
  const maxFi = result ? Math.max(...result.story_forces.map(s => s.Fi)) : 1

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ background:c.bg, minHeight:"100vh", color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px", transition:"background 0.2s" }}>

      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, letterSpacing:"0.12em", color:c.blue,
          textTransform:"uppercase", marginBottom:5, fontWeight:600 }}>
          RPA 2024 — DTR BC 2.48 — §4.2
        </div>
        <h1 style={{ fontSize:22, fontWeight:700, margin:0, color:c.text }}>
          Effort Tranchant à la Base
        </h1>
        <div style={{ color:c.textSec, fontSize:13, marginTop:3 }}>
          Méthode Statique Équivalente — Éq.4.1 · V = 0.8 · Sad(T₀)/g · W
        </div>
      </div>

      <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"flex-start" }}>

        {/* ── LEFT PANEL — inputs ─────────────────────────────────────────── */}
        <div style={{ display:"flex", flexDirection:"column", gap:14,
          width:235, flexShrink:0 }}>

          {/* Seismic parameters */}
          <div style={{ background:c.surface, border:`1px solid ${c.border}`,
            borderRadius:14, padding:16 }}>
            <div style={{ fontSize:11, letterSpacing:"0.08em", fontWeight:700,
              color:c.blue, textTransform:"uppercase", marginBottom:12 }}>
              Paramètres sismiques
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {/* Zone */}
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, color:c.textSec,
                  textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>
                  Zone
                </label>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {ZONES.map(z => (
                    <button type="button" key={z} onClick={() => setZone(z)} style={{
                      padding:"5px 9px", borderRadius:6, cursor:"pointer",
                      border:`1px solid ${zone===z ? c.blue : c.border}`,
                      background: zone===z ? c.blue+"22" : c.elevated,
                      color: zone===z ? c.blue : c.textSec,
                      fontSize:12, fontWeight: zone===z ? 700 : 400,
                    }}>{z}</button>
                  ))}
                </div>
              </div>

              {/* Site */}
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                <label style={{ fontSize:11, color:c.textSec,
                  textTransform:"uppercase", letterSpacing:"0.06em", fontWeight:600 }}>
                  Classe de site
                </label>
                <div style={{ display:"flex", gap:5 }}>
                  {SITES.map(s => (
                    <button type="button" key={s} onClick={() => setSite(s)} style={{
                      flex:1, padding:"5px 0", borderRadius:6, cursor:"pointer",
                      border:`1px solid ${site===s ? c.green : c.border}`,
                      background: site===s ? c.green+"22" : c.elevated,
                      color: site===s ? c.green : c.textSec,
                      fontSize:12, fontWeight: site===s ? 700 : 400,
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              <Sel label="Groupe d'importance" value={group}
                onChange={setGroup} c={c} options={GROUPS} />

              {/* QF and R — inline */}
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:c.textSec,
                    textTransform:"uppercase", letterSpacing:"0.06em",
                    fontWeight:600, display:"block", marginBottom:4 }}>
                    Q<sub>F</sub>
                  </label>
                  <input type="number" value={QF} min={1} max={1.5} step={0.05}
                    onChange={e => setQF(e.target.value)}
                    style={{ width:"100%", background:c.elevated,
                      border:`1px solid ${c.amber}66`, borderRadius:7,
                      padding:"7px 9px", color:c.amber, fontSize:14,
                      fontFamily:"monospace", outline:"none" }}/>
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, color:c.textSec,
                    textTransform:"uppercase", letterSpacing:"0.06em",
                    fontWeight:600, display:"block", marginBottom:4 }}>
                    R
                  </label>
                  <input type="number" value={R} min={1.5} max={6} step={0.5}
                    onChange={e => setR(e.target.value)}
                    style={{ width:"100%", background:c.elevated,
                      border:`1px solid ${c.red}66`, borderRadius:7,
                      padding:"7px 9px", color:c.red, fontSize:14,
                      fontFamily:"monospace", outline:"none" }}/>
                </div>
              </div>
            </div>
          </div>

          {/* Period parameters */}
          <div style={{ background:c.surface, border:`1px solid ${c.border}`,
            borderRadius:14, padding:16 }}>
            <div style={{ fontSize:11, letterSpacing:"0.08em", fontWeight:700,
              color:c.purple, textTransform:"uppercase", marginBottom:12 }}>
              Période fondamentale
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <Sel label="Système structurel" value={frameSys}
                onChange={setFrameSys} c={c}
                options={FRAME_SYSTEMS.map(f => ({
                  v:f.v, l:`${f.ct} — ${f.l.split(" ").slice(0,3).join(" ")}`
                }))} />

              <div>
                <label style={{ fontSize:11, color:c.textSec,
                  textTransform:"uppercase", letterSpacing:"0.06em",
                  fontWeight:600, display:"block", marginBottom:4 }}>
                  Hauteur totale h<sub>n</sub> (m)
                </label>
                <input type="number" value={hn} min={0} step={0.5}
                  onChange={e => setHn(e.target.value)}
                  style={{ width:"100%", background:c.elevated,
                    border:`1px solid ${c.purple}66`, borderRadius:7,
                    padding:"7px 9px", color:c.text, fontSize:14,
                    fontFamily:"monospace", outline:"none" }}/>
              </div>

              <div>
                <label style={{ fontSize:11, color:c.textSec,
                  textTransform:"uppercase", letterSpacing:"0.06em",
                  fontWeight:600, display:"block", marginBottom:4 }}>
                  T calculé (s) — optionnel
                </label>
                <input type="number" value={TCalc} min={0} step={0.01}
                  placeholder="laisser vide = T empirique"
                  onChange={e => setTCalc(e.target.value)}
                  style={{ width:"100%", background:c.elevated,
                    border:`1px solid ${c.border}`, borderRadius:7,
                    padding:"7px 9px", color:c.textSec, fontSize:12,
                    fontFamily:"monospace", outline:"none" }}/>
                <div style={{ fontSize:10, color:c.textMuted, marginTop:3 }}>
                  Si fourni : T₀ = min(T_calc, 1.3 × T_emp)
                </div>
              </div>
            </div>
          </div>

          {/* Calculate button */}
          <button type="button" onClick={calculate}
            disabled={loading || !storiesValid()}
            style={{ padding:"13px", borderRadius:10, cursor:"pointer",
              background: storiesValid() ? c.blue : c.border,
              border:"none", color:"white", fontSize:15, fontWeight:700,
              opacity: loading ? 0.7 : 1 }}>
            {loading ? "Calcul en cours..." : "⚡ Calculer V"}
          </button>

          {/* API error */}
          {apiErr && (
            <div style={{ background:c.red+"15", border:`1px solid ${c.red}44`,
              borderRadius:8, padding:"10px 12px", fontSize:11,
              color:c.red, lineHeight:1.5 }}>
              ❌ {apiErr}
            </div>
          )}
        </div>

        {/* ── MIDDLE PANEL — storey table ──────────────────────────────────── */}
        <div style={{ background:c.surface, border:`1px solid ${c.border}`,
          borderRadius:14, padding:16, width:300, flexShrink:0 }}>

          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:11, letterSpacing:"0.08em", fontWeight:700,
              color:c.green, textTransform:"uppercase" }}>
              Niveaux ({stories.length})
            </div>
            <button type="button" onClick={addStorey} style={{
              padding:"4px 10px", borderRadius:6, cursor:"pointer",
              background:c.green+"22", border:`1px solid ${c.green}44`,
              color:c.green, fontSize:12, fontWeight:600 }}>
              + Ajouter
            </button>
          </div>

          {/* Column headers */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 70px 28px",
            gap:6, marginBottom:6 }}>
            {["Niveau","h (m)","W (kN)",""].map((h,i) => (
              <div key={i} style={{ fontSize:10, color:c.textMuted,
                textTransform:"uppercase", letterSpacing:"0.06em",
                fontWeight:600 }}>{h}</div>
            ))}
          </div>

          {/* Storey rows */}
          <div style={{ display:"flex", flexDirection:"column", gap:5,
            maxHeight:380, overflowY:"auto" }}>
            {stories.map((s, idx) => (
              <div key={s.id} style={{ display:"grid",
                gridTemplateColumns:"1fr 60px 70px 28px", gap:6,
                alignItems:"center" }}>

                <input value={s.name}
                  onChange={e => updateStorey(s.id, "name", e.target.value)}
                  style={{ background:c.elevated, border:`1px solid ${c.border}`,
                    borderRadius:6, padding:"6px 7px", color:c.text,
                    fontSize:12, outline:"none", width:"100%" }}/>

                <input type="number" value={s.elevation} min={0} step={0.5}
                  onChange={e => updateStorey(s.id, "elevation", e.target.value)}
                  style={{ background:c.elevated, border:`1px solid ${c.border}`,
                    borderRadius:6, padding:"6px 7px", color:c.purple,
                    fontSize:12, fontFamily:"monospace", outline:"none",
                    width:"100%" }}/>

                <input type="number" value={s.weight} min={0}
                  onChange={e => updateStorey(s.id, "weight", e.target.value)}
                  style={{ background:c.elevated, border:`1px solid ${c.border}`,
                    borderRadius:6, padding:"6px 7px", color:c.green,
                    fontSize:12, fontFamily:"monospace", outline:"none",
                    width:"100%" }}/>

                <button type="button" onClick={() => removeStorey(s.id)}
                  disabled={stories.length <= 1}
                  style={{ width:24, height:24, borderRadius:5, cursor:"pointer",
                    background: stories.length>1 ? c.red+"22" : "transparent",
                    border: stories.length>1 ? `1px solid ${c.red}44` : "1px solid transparent",
                    color: stories.length>1 ? c.red : c.textMuted,
                    fontSize:13, display:"flex", alignItems:"center",
                    justifyContent:"center" }}>
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Total weight */}
          <div style={{ marginTop:12, padding:"8px 10px",
            background:c.elevated, borderRadius:8,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:11, color:c.textMuted }}>Poids total W</span>
            <span style={{ fontSize:14, fontWeight:700, color:c.green,
              fontFamily:"monospace" }}>
              {stories.reduce((acc,s) => acc + (parseFloat(s.weight)||0), 0).toFixed(0)} kN
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL — results ────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:280, display:"flex",
          flexDirection:"column", gap:14 }}>

          {!result && !loading && (
            <div style={{ display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center",
              height:300, gap:12, color:c.textMuted }}>
              <div style={{ fontSize:36 }}>⚡</div>
              <div style={{ fontSize:14, color:c.textSec }}>
                Remplir les paramètres et cliquer "Calculer V"
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Key result cards */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <ResultCard label="T" sub="emp" value={result.T_emp.toFixed(3)}
                  unit="sec" accent={c.purple} c={c}/>
                <ResultCard label="T" sub="0" value={result.T0.toFixed(3)}
                  unit="sec" accent={c.blue} c={c}/>
                <ResultCard label="Sad(T₀)/g" value={result.Sad_g.toFixed(4)}
                  unit="—" accent={c.green} c={c}/>
                <ResultCard label="W" value={result.W.toFixed(0)}
                  unit="kN" accent={c.textSec} c={c}/>
                <ResultCard label="V" value={result.V.toFixed(1)}
                  unit="kN" accent={c.red} c={c}/>
                {result.Ft > 0 && (
                  <ResultCard label="Ft" value={result.Ft.toFixed(1)}
                    unit="kN (sommet)" accent={c.amber} c={c}/>
                )}
              </div>

              {/* Formula trace */}
              <div style={{ background:c.surface, border:`1px solid ${c.border}`,
                borderRadius:10, padding:"10px 14px",
                fontSize:12, color:c.textSec, fontFamily:"monospace" }}>
                <span style={{ color:c.blue, fontWeight:700 }}>Éq.4.1</span>
                {"  "}V = 0.8 × Sad(T₀)/g × W = 0.8 ×{" "}
                <span style={{ color:c.green }}>{result.Sad_g.toFixed(4)}</span>
                {" "}×{" "}
                <span style={{ color:c.textSec }}>{result.W.toFixed(0)}</span>
                {" = "}
                <span style={{ color:c.red, fontWeight:700 }}>{result.V.toFixed(1)} kN</span>
                {result.Ft > 0 && (
                  <span style={{ color:c.amber }}>
                    {"  "}·{"  "}Ft = {result.Ft.toFixed(1)} kN (T₀ &gt; 0.7s)
                  </span>
                )}
              </div>

              {/* Period info */}
              {result.T0 !== result.T_emp && (
                <div style={{ background:c.amber+"11",
                  border:`1px solid ${c.amber}44`,
                  borderRadius:8, padding:"8px 12px",
                  fontSize:11, color:c.amber }}>
                  ⚠️ T₀ plafonné à 1.3 × T_emp = {result.T_cap} s
                  {" "}(T calculé = {TCalc} s)
                </div>
              )}

              {/* Force distribution chart */}
              <div style={{ background:c.surface, border:`1px solid ${c.border}`,
                borderRadius:12, padding:"16px 12px 10px" }}>

                <div style={{ fontSize:12, color:c.textSec, marginBottom:12,
                  fontWeight:600 }}>
                  Distribution des forces sismiques Fi{" "}
                  <span style={{ color:c.blue, fontWeight:400 }}>Éq.4.2</span>
                </div>

                <ResponsiveContainer width="100%" height={stories.length * 44 + 30}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top:0, right:50, bottom:0, left:60 }}>
                    <CartesianGrid stroke={c.border} strokeDasharray="4 4"
                      horizontal={false}/>
                    <XAxis
                      type="number"
                      tick={{ fill:c.textSec, fontSize:11 }}
                      label={{ value:"Fi (kN)", position:"insideBottom",
                        offset:-5, fill:c.textSec, fontSize:11 }}
                      tickFormatter={v => v.toFixed(0)}/>
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill:c.textSec, fontSize:11 }}
                      width={56}/>
                    <Tooltip content={<ForceTooltip c={c}/>}/>
                    <Bar dataKey="Fi" radius={[0,4,4,0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index}
                          fill={barColor(entry.Fi, maxFi)}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Results table */}
              <div style={{ background:c.surface, border:`1px solid ${c.border}`,
                borderRadius:12, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse",
                  fontSize:12 }}>
                  <thead>
                    <tr style={{ background:c.elevated }}>
                      {["Niveau","h (m)","Wi (kN)","Wi·hi","Ratio","Fi (kN)"].map(h => (
                        <th key={h} style={{ padding:"8px 10px", textAlign:"right",
                          color:c.textSec, fontWeight:600, fontSize:10,
                          letterSpacing:"0.06em", textTransform:"uppercase",
                          borderBottom:`1px solid ${c.border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...result.story_forces].reverse().map((sf, i) => (
                      <tr key={i} style={{
                        background: i%2===0 ? "transparent" : c.elevated+"66" }}>
                        <td style={{ padding:"7px 10px", color:c.text,
                          fontWeight:600 }}>{sf.name}</td>
                        <td style={{ padding:"7px 10px", textAlign:"right",
                          color:c.textSec, fontFamily:"monospace" }}>
                          {sf.elevation.toFixed(1)}
                        </td>
                        <td style={{ padding:"7px 10px", textAlign:"right",
                          color:c.green, fontFamily:"monospace" }}>
                          {sf.weight.toFixed(0)}
                        </td>
                        <td style={{ padding:"7px 10px", textAlign:"right",
                          color:c.textMuted, fontFamily:"monospace" }}>
                          {(sf.weight * sf.elevation).toFixed(0)}
                        </td>
                        <td style={{ padding:"7px 10px", textAlign:"right",
                          color:c.textMuted, fontFamily:"monospace" }}>
                          {(sf.ratio*100).toFixed(1)}%
                        </td>
                        <td style={{ padding:"7px 10px", textAlign:"right",
                          color:c.blue, fontFamily:"monospace", fontWeight:700 }}>
                          {sf.Fi.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:c.elevated,
                      borderTop:`2px solid ${c.border}` }}>
                      <td colSpan={5} style={{ padding:"8px 10px",
                        color:c.textSec, fontWeight:700, fontSize:11,
                        textTransform:"uppercase", letterSpacing:"0.06em" }}>
                        Total
                      </td>
                      <td style={{ padding:"8px 10px", textAlign:"right",
                        color:c.red, fontFamily:"monospace", fontWeight:700,
                        fontSize:14 }}>
                        {result.story_forces.reduce((a,s) => a+s.Fi,0).toFixed(1)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
