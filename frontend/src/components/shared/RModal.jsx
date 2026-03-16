/**
 * RModal — Coefficient de Comportement R
 * Extracted from SpectrumChart.jsx — shared by ProjectParams and SpectrumChart.
 * RPA 2024 §3.5 — Table 3.18
 */
import { useState } from "react"

export const SYSTEMS = [
  {
    id:1, label:"Système 1 — Ossature",
    desc:"Ossature (portiques). Vossature > 65% Vbase.",
    R:5.5, qfCat:"a",
    detect: r => r.ossature > 0.65,
  },
  {
    id:2, label:"Système 2 — Mixte équiv. ossature",
    desc:"Mixte. L'ossature reprend 50% à 65% de l'effort tranchant.",
    R:5.5, qfCat:"a",
    detect: r => r.ossature >= 0.50 && r.ossature <= 0.65,
  },
  {
    id:3, label:"Système 3 — Ossature + remplissage",
    desc:"Ossature ou mixte avec remplissage en maçonnerie rigide (≤ 10 cm).",
    R:3.5, qfCat:"a",
    detect: null,
  },
  {
    id:4, label:"Système 4 — Mixte équiv. voiles",
    desc:"Les voiles reprennent 50% à 65% de l'effort tranchant.",
    R:4.5, qfCat:"b",
    detect: r => r.voiles >= 0.50 && r.voiles <= 0.65,
  },
  {
    id:5, label:"Système 5 — Voiles",
    desc:"Contreventement par voiles. Vvoiles > 65% Vbase.",
    R:4.5, qfCat:"b",
    detect: r => r.voiles > 0.65,
  },
  {
    id:6, label:"Système 6 — Noyau / Effet noyau",
    desc:"Système à noyau ou à effet noyau. rx, ry ≤ rayon de giration ls.",
    R:3.0, qfCat:"b",
    detect: null,
  },
]

export default function RModal({ onClose, onValidate, initSystem, c }) {
  const [tab,    setTab]    = useState("manual")
  const [selSys, setSelSys] = useState(initSystem || 1)
  const [Voss,   setVoss]   = useState("")
  const [Vvoi,   setVvoi]   = useState("")
  const [Vtot,   setVtot]   = useState("")
  const [detSys, setDetSys] = useState(null)

  const activeSys = tab === "manual"
    ? SYSTEMS.find(s => s.id === selSys)
    : detSys

  function detectFromForces() {
    const vo = parseFloat(Voss), vv = parseFloat(Vvoi), vt = parseFloat(Vtot)
    if (isNaN(vt) || vt <= 0) return
    const ratio = { ossature:(isNaN(vo)?0:vo)/vt, voiles:(isNaN(vv)?0:vv)/vt }
    const found = SYSTEMS.find(s => s.detect && s.detect(ratio))
    setDetSys(found || null)
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:14,padding:26,width:520,maxWidth:"95vw",
        maxHeight:"90vh",overflowY:"auto",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,textTransform:"uppercase",marginBottom:3}}>
              RPA 2024 — §3.5 — Table 3.18
            </div>
            <h2 style={{fontSize:17,fontWeight:700,color:c.text,margin:0}}>
              Coefficient de Comportement R
            </h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>Identification du système de contreventement</div>
          </div>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",color:c.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:7,marginBottom:16}}>
          {[{id:"manual",l:"🏗️ Sélection manuelle"},
            {id:"forces",l:"📊 Par effort tranchant"}].map(t => (
            <button type="button" key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1,padding:"9px",borderRadius:8,cursor:"pointer",
              border:`1px solid ${tab===t.id ? c.blue : c.border}`,
              background:tab===t.id ? c.blue+"22" : c.elevated,
              color:tab===t.id ? c.blue : c.textSec,
              fontSize:13,fontWeight:tab===t.id ? 700 : 400}}>
              {t.l}
            </button>
          ))}
        </div>

        {tab === "manual" && (
          <div style={{marginBottom:16}}>
            {SYSTEMS.map(sys => (
              <div key={sys.id} onClick={() => setSelSys(sys.id)}
                style={{display:"flex",alignItems:"flex-start",gap:11,
                  padding:"10px 12px",borderRadius:8,cursor:"pointer",marginBottom:5,
                  background:selSys===sys.id ? c.blue+"15" : c.elevated,
                  border:`1px solid ${selSys===sys.id ? c.blue : c.border}`}}>
                <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${selSys===sys.id ? c.blue : c.borderLight}`,
                  background:selSys===sys.id ? c.blue : "transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,color:"white",fontWeight:700,marginTop:1}}>
                  {selSys===sys.id ? "●" : ""}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:c.text,marginBottom:2}}>
                    {sys.label}
                    <span style={{marginLeft:8,fontSize:11,
                      color:sys.qfCat==="a" ? c.blue : c.purple,
                      background:(sys.qfCat==="a" ? c.blue : c.purple)+"22",
                      borderRadius:4,padding:"1px 5px"}}>
                      Cat. ({sys.qfCat})
                    </span>
                  </div>
                  <div style={{fontSize:11,color:c.textMuted,lineHeight:1.5}}>{sys.desc}</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:c.amber,fontFamily:"monospace",flexShrink:0}}>
                  R={sys.R}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "forces" && (
          <div style={{marginBottom:16}}>
            <div style={{background:c.elevated,border:`1px solid ${c.border}`,
              borderRadius:8,padding:"9px 13px",marginBottom:14,
              display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c.borderLight,flexShrink:0}}/>
              <span style={{fontSize:12,color:c.textMuted,flex:1}}>
                Robot non connecté — import automatique indisponible
              </span>
              <button type="button" style={{padding:"5px 11px",borderRadius:6,cursor:"not-allowed",
                background:c.border,border:"none",color:c.textMuted,fontSize:11}}>
                Connecter
              </button>
            </div>

            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[{label:"V ossature (kN)",val:Voss,set:setVoss},
                {label:"V voiles (kN)",  val:Vvoi,set:setVvoi},
                {label:"V total (kN)",   val:Vtot,set:setVtot}].map(f => (
                <div key={f.label} style={{flex:1}}>
                  <div style={{fontSize:11,color:c.textMuted,marginBottom:4}}>{f.label}</div>
                  <input type="number" min={0} value={f.val}
                    onChange={e => f.set(e.target.value)}
                    style={{width:"100%",background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:7,padding:"8px 10px",color:c.text,
                      fontSize:15,fontFamily:"monospace",outline:"none"}}/>
                </div>
              ))}
            </div>

            <button type="button" onClick={detectFromForces} style={{
              width:"100%",padding:"9px",borderRadius:8,cursor:"pointer",
              background:c.blue,border:"none",color:"white",fontSize:13,fontWeight:700,marginBottom:10}}>
              Détecter le système automatiquement
            </button>

            {detSys ? (
              <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,borderRadius:8,padding:"11px 13px"}}>
                <div style={{fontSize:12,color:c.green,marginBottom:3}}>✅ Système identifié</div>
                <div style={{fontSize:14,fontWeight:700,color:c.text}}>{detSys.label}</div>
              </div>
            ) : (Voss||Vvoi||Vtot) ? (
              <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,borderRadius:8,padding:"10px 13px",fontSize:12,color:c.amber}}>
                ⚠️ Système 3 ou 6 — sélection manuelle requise
              </div>
            ) : null}
          </div>
        )}

        {activeSys && (
          <div style={{background:c.elevated,border:`1px solid ${c.amber}44`,
            borderRadius:10,padding:"14px 16px",marginBottom:16,
            display:"flex",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:c.textMuted,marginBottom:2}}>Valeur R — {activeSys.label}</div>
              <div style={{fontSize:11,color:c.textMuted}}>
                Cat. Q<sub>F</sub> :&nbsp;
                <b style={{color:activeSys.qfCat==="a" ? c.blue : c.purple}}>({activeSys.qfCat})</b>
              </div>
            </div>
            <div style={{fontSize:42,fontWeight:700,fontFamily:"monospace",color:c.amber}}>
              {activeSys.R}
            </div>
          </div>
        )}

        <button type="button"
          onClick={() => onValidate(activeSys?.R, activeSys)}
          disabled={!activeSys}
          style={{width:"100%",padding:"11px",borderRadius:8,
            cursor:activeSys ? "pointer" : "not-allowed",
            background:activeSys ? c.blue : c.border,
            border:"none",color:"white",fontSize:14,fontWeight:700}}>
          {activeSys ? `Valider R = ${activeSys.R}` : "Sélectionner un système d'abord"}
        </button>
      </div>
    </div>
  )
}
