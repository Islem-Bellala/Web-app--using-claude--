/**
 * StructCalc — Effort Tranchant à la Base (Session 9)
 *
 * Auto-calculates whenever relevant params change (useEffect + AbortController).
 * No "Calculer" button needed.
 *
 * Formulas — RPA 2024 §4.2:
 *   Eq.4.4  T_emp = CT × hn^(3/4)
 *   Eq.4.1  V = λ × Sad(T0)/g × W
 *   Eq.4.3  Ft = 0.07 × T0 × V  (max 0.25V) if T0 > 0.7s
 *   §4.3.5  Vt ≥ 0.8 × V  (80% check, rule des 80%)
 *   λ = 0.85 if T0 ≤ 2×T2 AND n_floors > 2  else λ = 1.0
 *   Majoration: coeff = (0.8 × V) / Vt  when check fails
 */

import { useState, useEffect } from "react"

function ResultCard({ label, value, unit, accent, c }) {
  return (
    <div style={{background:c.elevated,border:`1px solid ${accent}44`,
      borderRadius:10,padding:"10px 12px",flex:1,minWidth:0}}>
      <div style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
        fontWeight:600,marginBottom:5}}>{label}</div>
      <div style={{fontSize:20,fontWeight:700,color:accent,fontFamily:"monospace"}}>{value}</div>
      {unit && <div style={{fontSize:11,color:c.textMuted,marginTop:2}}>{unit}</div>}
    </div>
  )
}

function Check80({ label, Vdyn, Vstat, c }) {
  if (!Vdyn || !Vstat) return (
    <div style={{fontSize:12,color:c.textMuted,fontStyle:"italic",
      padding:"8px 12px",background:c.elevated,borderRadius:8}}>
      {label} : Vxd/Vyd non renseigné dans Paramètres généraux
    </div>
  )
  const threshold = 0.8 * Vstat
  const ok        = Vdyn >= threshold
  const coeff     = ok ? null : (threshold / Vdyn).toFixed(3)
  return (
    <div style={{background:ok?c.green+"11":c.red+"11",
      border:`1px solid ${ok?c.green:c.red}44`,borderRadius:7,padding:"9px 12px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:ok?0:8}}>
        <span style={{fontSize:18}}>{ok?"✅":"❌"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,color:ok?c.green:c.red}}>
            {label} — {ok?"Condition vérifiée (Vt ≥ 80% V)":"Condition NON vérifiée (Vt < 80% V)"}
          </div>
          <div style={{fontSize:11,color:c.textMuted,fontFamily:"monospace",marginTop:3}}>
            Vt = {(+Vdyn).toFixed(1)} kN &nbsp;|&nbsp;
            80%×V = {threshold.toFixed(1)} kN &nbsp;|&nbsp;
            Ratio = {((+Vdyn/Vstat)*100).toFixed(1)}%
          </div>
        </div>
      </div>
      {!ok && (
        <div style={{background:c.red+"22",borderRadius:6,padding:"7px 10px",
          fontSize:12,color:c.red}}>
          <div style={{fontWeight:700,marginBottom:3}}>
            ⚠️ Coefficient de majoration
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <div style={{fontFamily:"monospace",fontSize:14,flex:1}}>
              coeff = 0.8×V / Vt = 0.8×{Vstat.toFixed(1)} / {(+Vdyn).toFixed(1)} ={" "}
              <b>{coeff}</b>
              <span style={{fontFamily:"sans-serif",fontSize:12,color:c.textSec}}>
                {" "}— Majorer l'effort sismique dans le modèle par le ratio :{" "}
                <b style={{color:c.red}}>{(coeff * 100).toFixed(1)}%</b>
              </span>
            </div>
            <button type="button"
              onClick={()=>alert("Export du coefficient de majoration vers Robot — disponible après connexion bridge.")}
              style={{padding:"6px 12px",borderRadius:7,cursor:"pointer",
                background:c.blue+"22",border:`1px solid ${c.blue}`,
                color:c.blue,fontSize:11,fontWeight:600,
                display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              📤 Exporter vers Robot
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function DirectionPanel({ dir, result, Vdyn, color, c }) {
  if (!result) return null
  return (
    <div style={{flex:1,minWidth:260,display:"flex",flexDirection:"column",gap:8}}>
      <div style={{background:color+"11",border:`1px solid ${color}33`,
        borderRadius:7,padding:"6px 12px",fontSize:11,color:color,fontWeight:700,
        textTransform:"uppercase",letterSpacing:"0.08em"}}>
        Direction {dir}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"nowrap"}}>
        <ResultCard label="T_emp"  value={result.T_emp.toFixed(3)}  unit="s"         accent={c.purple}  c={c}/>
        <ResultCard label="T₀"     value={result.T0.toFixed(3)}     unit="s"         accent={color}     c={c}/>
        <ResultCard label="λ"      value={result.lambda_coef}       unit="coeff."    accent={c.amber}   c={c}/>
        <ResultCard label="Sad/g"  value={result.Sad_g.toFixed(4)}  unit="—"         accent={c.green}   c={c}/>
        <ResultCard label="W"      value={result.W.toFixed(0)}      unit="kN"        accent={c.textSec} c={c}/>
        <ResultCard label="V"      value={result.V.toFixed(1)}      unit="kN"        accent={c.red}     c={c}/>
        {result.Ft > 0 && (
          <ResultCard label="Ft"   value={result.Ft.toFixed(1)}     unit="kN sommet" accent={c.amber}   c={c}/>
        )}
      </div>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:7,padding:"8px 12px",fontSize:12,color:c.textSec,fontFamily:"monospace"}}>
        <div>
          <span style={{color:c.blue,fontWeight:700}}>Éq.4.1</span>
          {"  "}V = <span style={{color:c.amber}}>{result.lambda_coef}</span>
          {" × "}<span style={{color:c.green}}>{result.Sad_g.toFixed(4)}</span>
          {" × "}<span style={{color:c.textSec}}>{result.W.toFixed(0)}</span>
          {" = "}<span style={{color:c.red,fontWeight:700}}>{result.V.toFixed(1)} kN</span>
        </div>
        {result.T0 !== result.T_emp && (
          <div style={{color:c.amber,fontSize:11,marginTop:3}}>
            T₀ plafonné : min(T_calc, 1.3×T_emp={result.T_cap.toFixed(3)}) = {result.T0.toFixed(3)} s
          </div>
        )}
        {result.Ft > 0 && (
          <div style={{color:c.amber,fontSize:11,marginTop:2}}>
            <span style={{color:c.blue,fontWeight:700}}>Éq.4.3</span>
            {"  "}Ft = 0.07×{result.T0.toFixed(3)}×{result.V.toFixed(1)} = {result.Ft.toFixed(1)} kN
          </div>
        )}
      </div>
      <div style={{fontSize:10,color:c.textMuted,textTransform:"uppercase",
        letterSpacing:"0.06em",fontWeight:600,marginBottom:-4}}>§4.3.5 — Vérification 80%</div>
      <Check80 label={`Sens ${dir}`} Vdyn={Vdyn} Vstat={result.V} c={c}/>
    </div>
  )
}

export default function BaseShearPage({ params, c }) {
  const [resultX, setResultX] = useState(null)
  const [resultY, setResultY] = useState(null)
  const [loading,  setLoading] = useState(false)
  const [apiErr,   setApiErr]  = useState(null)

  function storiesPayload() {
    return [...params.stories]
      .map(s=>({name:s.name.trim(),elevation:parseFloat(s.elevation),weight:parseFloat(s.weight)}))
      .filter(s=>s.elevation>0&&s.weight>0)
      .sort((a,b)=>a.elevation-b.elevation)
  }

  function isReady() { return storiesPayload().length>=1 }

  async function fetchDirection(signal, QF, R, TCalc) {
    const sp = storiesPayload()
    const hn = Math.max(...sp.map(s=>s.elevation))
    const res = await fetch("http://localhost:8000/api/v1/base_shear",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      signal,
      body:JSON.stringify({
        zone:             params.zone==="0"?"I":params.zone,
        site_class:       params.site,
        importance_group: params.group,
        QF, R,
        frame_system:     params.frameSys,
        hn,
        T_calculated:     TCalc?parseFloat(TCalc):null,
        stories:          sp,
      })
    })
    if(!res.ok){
      const err=await res.json().catch(()=>({detail:`HTTP ${res.status}`}))
      throw new Error(err.detail||`Erreur ${res.status}`)
    }
    return res.json()
  }

  // Auto-calculate whenever relevant params change
  useEffect(()=>{
    if(!isReady()) return
    const controller = new AbortController()

    async function run(){
      setLoading(true)
      setApiErr(null)
      try{
        const [rX,rY] = await Promise.all([
          fetchDirection(controller.signal,
            params.twoDir?params.QFx:params.QF,
            params.twoDir?params.Rx:params.R,
            params.Tx),
          fetchDirection(controller.signal,
            params.twoDir?params.QFy:params.QF,
            params.twoDir?params.Ry:params.R,
            params.Ty),
        ])
        setResultX(rX)
        setResultY(rY)
      } catch(err){
        if(err.name!=="AbortError"){
          const msg=err.message.toLowerCase()
          setApiErr(msg.includes("failed to fetch")||msg.includes("network")
            ?"Backend non démarré — uvicorn backend.main:app --reload --port 8000"
            :err.message)
        }
      } finally{
        setLoading(false)
      }
    }

    // Small debounce to avoid firing on every keystroke
    const timer = setTimeout(run, 400)
    return ()=>{ clearTimeout(timer); controller.abort() }
  },[
    params.zone, params.site, params.group, params.frameSys,
    params.twoDir, params.QF, params.R, params.QFx, params.Rx, params.QFy, params.Ry,
    params.Tx, params.Ty,
    // Stringify stories to detect changes in the array
    JSON.stringify(params.stories.map(s=>({e:s.elevation,w:s.weight}))),
  ])

  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",padding:"14px 16px"}}>

      {/* Header */}
      <div style={{marginBottom:10}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:5,fontWeight:600}}>
          RPA 2024 — DTR BC 2.48 — §4.2
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>
          Effort Tranchant à la Base
        </h1>
        <div style={{color:c.textSec,fontSize:13,marginTop:3}}>
          V = λ · Sad(T₀)/g · W &nbsp;|&nbsp; Éq.4.1 — Directions X et Y
        </div>
      </div>

      {/* Params badge bar */}
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:10,padding:"8px 12px",marginBottom:10,
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
            ?[{l:"QF",v:params.QF.toFixed(2),col:c.amber},{l:"R",v:params.R,col:c.red}]
            :[{l:"QFx",v:params.QFx.toFixed(2),col:c.blue},{l:"Rx",v:params.Rx,col:c.blue},
              {l:"QFy",v:params.QFy.toFixed(2),col:c.purple},{l:"Ry",v:params.Ry,col:c.purple}]
          ),
          {l:"Niveaux",v:params.stories.length,col:c.textSec},
          {l:"W",v:`${params.stories.reduce((a,s)=>a+(parseFloat(s.weight)||0),0).toFixed(0)} kN`,col:c.green},
          ...(params.Tx?[{l:"Tx",v:`${params.Tx}s`,col:c.blue}]:[]),
          ...(params.Ty?[{l:"Ty",v:`${params.Ty}s`,col:c.purple}]:[]),
        ].map(b=>(
          <div key={b.l} style={{background:c.elevated,borderRadius:6,padding:"4px 9px",fontSize:12}}>
            <span style={{color:c.textMuted}}>{b.l} </span>
            <b style={{color:b.col}}>{b.v}</b>
          </div>
        ))}
        {/* Auto-calc indicator */}
        <div style={{marginLeft:"auto",fontSize:11,color:loading?c.amber:c.green,
          display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:14}}>{loading?"⏳":"✓"}</span>
          {loading?"Calcul...":"Mis à jour"}
        </div>
      </div>

      {(params.Vxd||params.Vyd) && (
        <div style={{background:c.amber+"11",border:`1px solid ${c.amber}33`,
          borderRadius:7,padding:"6px 12px",marginBottom:8,
          fontSize:12,color:c.amber,display:"flex",gap:16}}>
          <span>📊 Vérification §4.3.5 :</span>
          {params.Vxd&&<span>Vxd = <b>{params.Vxd} kN</b></span>}
          {params.Vyd&&<span>Vyd = <b>{params.Vyd} kN</b></span>}
        </div>
      )}

      {apiErr && (
        <div style={{background:c.red+"15",border:`1px solid ${c.red}44`,
          borderRadius:7,padding:"8px 10px",fontSize:11,color:c.red,
          lineHeight:1.5,marginBottom:8}}>❌ {apiErr}</div>
      )}

      {(resultX||resultY) && (
        <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-start"}}>
          <DirectionPanel dir="X" result={resultX}
            Vdyn={params.Vxd?parseFloat(params.Vxd):null} color={c.blue} c={c}/>
          <DirectionPanel dir="Y" result={resultY}
            Vdyn={params.Vyd?parseFloat(params.Vyd):null} color={c.purple} c={c}/>
        </div>
      )}

      {!resultX&&!loading&&!apiErr&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",
          justifyContent:"center",height:200,gap:12,color:c.textMuted}}>
          <div style={{fontSize:36}}>⚡</div>
          <div style={{fontSize:14,color:c.textSec}}>
            Renseigner les paramètres dans Paramètres généraux
          </div>
        </div>
      )}
    </div>
  )
}
