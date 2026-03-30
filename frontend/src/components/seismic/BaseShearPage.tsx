/**
 * Bunyan — Effort Tranchant à la Base (Phase 3)
 * RPA 2024 §4.2 — Méthode Statique Équivalente
 * Reads all parameters from Zustand stores — no more props drilling.
 *
 * Changes from Session 7:
 *   - Seismic params read from stores (no input panel)
 *   - Always computes TWO directions (X and Y)
 *   - λ correction applied: λ=0.85 if T0≤2T2 and n>2, else λ=1.0
 *   - 80% check: Vxd/Vyd vs 0.8×V — uses seismicStore.Vxd/Vyd
 *   - Coefficient de majoration shown when 80% check fails
 */

import { useState } from "react"
import type { AppColors, BaseShearResult } from "../../types"
import { useProjectStore, useSeismicStore, useStructuralStore } from "../../stores"
import { computeBaseShear } from "../../services/api"

// ── Sub-components ────────────────────────────────────────────────────────────

interface ResultCardProps {
  label: string;
  value: string | number;
  unit?: string;
  accent: string;
  c: AppColors;
}
function ResultCard({ label, value, unit, accent, c }: ResultCardProps) {
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

interface Check80Props {
  label: string;
  Vdyn: number | null;
  Vstat: number;
  c: AppColors;
}
function Check80({ label, Vdyn, Vstat, c }: Check80Props) {
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

interface DirectionPanelProps {
  dir: string;
  result: BaseShearResult | null;
  Vdyn: number | null;
  color: string;
  c: AppColors;
}

function DirectionPanel({ dir, result, Vdyn, color, c }: DirectionPanelProps) {
  if (!result) return null

  return (
    <div style={{flex:1,minWidth:280,display:"flex",flexDirection:"column",gap:12}}>

      <div style={{background:color+"11",border:`1px solid ${color}33`,
        borderRadius:8,padding:"8px 12px",
        fontSize:12,color:color,fontWeight:700,
        textTransform:"uppercase",letterSpacing:"0.08em"}}>
        Direction {dir}
      </div>

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

      <Check80 label={`Sens ${dir}`} Vdyn={Vdyn} Vstat={result.V} c={c}/>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS & MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface BaseShearPageProps {
  c: AppColors;
}

export default function BaseShearPage({ c }: BaseShearPageProps) {
  // Read from stores
  const project    = useProjectStore()
  const seismic    = useSeismicStore()
  const structural = useStructuralStore()

  const [resultX, setResultX] = useState<BaseShearResult | null>(null)
  const [resultY, setResultY] = useState<BaseShearResult | null>(null)
  const [loading,  setLoading] = useState<boolean>(false)
  const [apiErr,   setApiErr]  = useState<string | null>(null)

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
    setLoading(true)
    setApiErr(null)
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
      setResultX(rX)
      setResultY(rY)
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
          {l:"Zone",  v:project.zone,  col:c.blue},
          {l:"Site",  v:project.site,  col:c.green},
          {l:"Groupe",v:project.group, col:c.purple},
          ...(!seismic.twoDir
            ? [{l:"QF",v:seismic.QF.toFixed(2),col:c.amber},{l:"R",v:String(seismic.R),col:c.red}]
            : [{l:"QFx",v:seismic.QFx.toFixed(2),col:c.blue},{l:"Rx",v:String(seismic.Rx),col:c.blue},
               {l:"QFy",v:seismic.QFy.toFixed(2),col:c.purple},{l:"Ry",v:String(seismic.Ry),col:c.purple}]
          ),
          {l:"Niveaux", v:String(structural.stories.length), col:c.textSec},
          {l:"W", v:`${totalW.toFixed(0)} kN`, col:c.green},
          ...(seismic.Tx ? [{l:"Tx",v:`${seismic.Tx}s`,col:c.blue}] : []),
          ...(seismic.Ty ? [{l:"Ty",v:`${seismic.Ty}s`,col:c.purple}] : []),
        ].map(b => (
          <div key={b.l} style={{background:c.elevated,borderRadius:6,padding:"4px 9px",fontSize:12}}>
            <span style={{color:c.textMuted}}>{b.l} </span>
            <b style={{color:b.col}}>{b.v}</b>
          </div>
        ))}
      </div>

      {/* Dynamic inputs info */}
      {(seismic.Vxd || seismic.Vyd) && (
        <div style={{background:c.amber+"11",border:`1px solid ${c.amber}33`,
          borderRadius:8,padding:"8px 13px",marginBottom:14,fontSize:12,color:c.amber,
          display:"flex",gap:16}}>
          <span>📊 Vérification 80% :</span>
          {seismic.Vxd && <span>Vxd = <b>{seismic.Vxd} kN</b></span>}
          {seismic.Vyd && <span>Vyd = <b>{seismic.Vyd} kN</b></span>}
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
            Vdyn={seismic.Vxd ? parseFloat(seismic.Vxd) : null}
            color={c.blue} c={c}/>
          <DirectionPanel dir="Y" result={resultY}
            Vdyn={seismic.Vyd ? parseFloat(seismic.Vyd) : null}
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
