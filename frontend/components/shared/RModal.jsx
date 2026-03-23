/**
 * RModal — Coefficient de Comportement R (Session 9h)
 *
 * Manual tab: material selection cards → filtered system table (RPA 2024 Table 3.18)
 * Automatic tab: unchanged from previous sessions
 * zoom: 1 on overlay
 *
 * Materials covered: Béton armé (7), Acier (7), PAF (2), Maçonnerie (1), Bois (4), Autres (4)
 * Source: RPA 2024 — DTR BC 2.48, Table 3.18
 */
import { useState } from "react"

// ─────────────────────────────────────────────────────────────────────────────
// RPA 2024 — TABLE 3.18 — ALL SYSTEMS BY MATERIAL
// ─────────────────────────────────────────────────────────────────────────────
const MATERIALS = [
  {
    id:"ba", label:"Béton armé", icon:"🏛",
    systems:[
      {id:1,  label:"Système à ossature",                                         desc:"Vossature > 65% Vbase",                              R:5.5, qfCat:"a"},
      {id:2,  label:"Mixte équivalent à une ossature",                            desc:"Ossature reprend 50–65% de l'effort tranchant",      R:5.5, qfCat:"a"},
      {id:3,  label:"Ossature ou mixte + remplissage maçonnerie rigide",          desc:"Maçonnerie ≤ 10 cm",                                 R:3.5, qfCat:"a"},
      {id:4,  label:"Mixte équivalent à des voiles",                              desc:"Voiles reprennent 50–65% de l'effort tranchant",     R:4.5, qfCat:"b"},
      {id:5,  label:"Contreventement par voiles",                                 desc:"Vvoiles > 65% Vbase",                                R:4.5, qfCat:"b"},
      {id:6,  label:"Système à noyau ou à effet noyau",                           desc:"rx, ry ≤ rayon de giration ls",                      R:3.0, qfCat:"b"},
      {id:7,  label:"Noyau / effet noyau — voiles en béton armé",                 desc:"rx, ry ≤ rayon de giration ls",                      R:3.0, qfCat:"b"},
    ]
  },
  {
    id:"acier", label:"Acier", icon:"⚙",
    systems:[
      {id:10, label:"Ossatures en portiques sans remplissage ou avec remplissage isolé", desc:"",                                           R:6.5, qfCat:"a"},
      {id:11, label:"Ossature en portiques avec remplissages en maçonnerie rigide",      desc:"",                                           R:3.0, qfCat:"a"},
      {id:"12a",label:"Ossature avec contreventement à barres centrées en X",           desc:"",                                           R:4.0, qfCat:"b"},
      {id:"12b",label:"Ossature avec contreventement à barres centrées en V",           desc:"",                                           R:2.5, qfCat:"b"},
      {id:"13a",label:"Ossature en portiques avec contreventement — barres X",          desc:"",                                           R:4.5, qfCat:"b"},
      {id:"13b",label:"Ossature en portiques avec contreventement — barres V",          desc:"",                                           R:3.5, qfCat:"b"},
      {id:14,  label:"Système pendule inversé",                                         desc:"",                                           R:2.0, qfCat:"b"},
    ]
  },
  {
    id:"paf", label:"PAF", icon:"📐",
    systems:[
      {id:15, label:"Contreventement en panneaux en PAF",                         desc:"Profilés formés à froid",                            R:2.0, qfCat:"b"},
      {id:16, label:"Contreventement en PAF — diagonales tendues",                desc:"Profilés formés à froid",                            R:1.5, qfCat:"c"},
    ]
  },
  {
    id:"maco", label:"Maçonnerie", icon:"🧱",
    systems:[
      {id:17, label:"Structures en maçonnerie porteuse chaînée",                  desc:"",                                                   R:2.5, qfCat:"b"},
    ]
  },
  {
    id:"bois", label:"Bois", icon:"🪵",
    systems:[
      {id:18, label:"Consoles ; poutres à joints cantilevers",                    desc:"",                                                   R:1.5, qfCat:"c"},
      {id:19, label:"Poutres, arcs 2/3 articulations, treillis assemblés",        desc:"Par connecteurs à dents",                            R:1.5, qfCat:"c"},
      {id:20, label:"Murs en ossature et diaphragmes collés",                     desc:"Cloués / boulonnés — treillis brochés",               R:2.0, qfCat:"b"},
      {id:21, label:"Portique hyperstatique — treillis cloués",                   desc:"Boulonné / broché",                                  R:2.5, qfCat:"b"},
    ]
  },
  {
    id:"autres", label:"Autres", icon:"🔩",
    systems:[
      {id:22, label:"Ossature métallique + contreventement par diaphragme",       desc:"",                                                   R:2.0, qfCat:"b"},
      {id:23, label:"Ossature métallique + contreventement noyau / effet noyau",  desc:"BA",                                                 R:3.0, qfCat:"b"},
      {id:24, label:"Ossature métallique + contreventement par voiles BA",        desc:"",                                                   R:4.0, qfCat:"b"},
      {id:25, label:"Contreventement mixte — noyau BA + palées métalliques",      desc:"",                                                   R:4.0, qfCat:"b"},
    ]
  },
]

export const SYSTEMS = MATERIALS[0].systems  // keep backward compat for auto-detect tab

export default function RModal({ onClose, onValidate, initSystem, c }) {
  const [tab,       setTab]       = useState("manual")
  const [matId,     setMatId]     = useState("ba")       // selected material
  const [selSysId,  setSelSysId]  = useState(initSystem || 1)

  // Auto tab state
  const [Voss, setVoss] = useState("")
  const [Vvoi, setVvoi] = useState("")
  const [Vtot, setVtot] = useState("")
  const [detSys, setDetSys] = useState(null)

  const activeMat  = MATERIALS.find(m => m.id === matId)
  const activeSys  = tab === "manual"
    ? activeMat?.systems.find(s => s.id === selSysId)
    : detSys

  function detectFromForces() {
    const vo = parseFloat(Voss), vv = parseFloat(Vvoi), vt = parseFloat(Vtot)
    if (isNaN(vt) || vt <= 0) return
    const ratio = { ossature:(isNaN(vo)?0:vo)/vt, voiles:(isNaN(vv)?0:vv)/vt }
    // Auto-detect only works for BA systems 1-5
    const baSystems = MATERIALS[0].systems
    const found = baSystems.find(s => {
      if (s.id===1) return ratio.ossature > 0.65
      if (s.id===2) return ratio.ossature >= 0.50 && ratio.ossature <= 0.65
      if (s.id===4) return ratio.voiles >= 0.50 && ratio.voiles <= 0.65
      if (s.id===5) return ratio.voiles > 0.65
      return false
    })
    setDetSys(found || null)
  }

  const sel = {
    background:c.elevated, border:`1px solid ${c.border}`,
    color:c.text, borderRadius:8, padding:"8px 10px",
    fontSize:13, outline:"none", width:"100%",
  }

  return (
    <div style={{
      position:"fixed", inset:0,
      background:"rgba(0,0,0,0.72)",
      zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center",
      zoom:1,
    }}>
      <div style={{
        background:c.surface, border:`1px solid ${c.border}`,
        borderRadius:14, width:580, maxWidth:"96vw",
        maxHeight:"82vh", overflowY:"auto",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)",
      }}>

        {/* Header */}
        <div style={{padding:"14px 18px 12px",borderBottom:`1px solid ${c.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,
                textTransform:"uppercase",marginBottom:3}}>
                RPA 2024 — §3.5 — Table 3.18
              </div>
              <div style={{fontSize:17,fontWeight:700,color:c.text}}>
                Coefficient de Comportement R
              </div>
              <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>
                Identification du système de contreventement
              </div>
            </div>
            <button type="button" onClick={onClose} style={{
              background:"none",border:"none",color:c.textMuted,
              fontSize:20,cursor:"pointer",padding:4,lineHeight:1}}>✕</button>
          </div>

          {/* Mode tabs */}
          <div style={{display:"flex",gap:7,marginTop:10}}>
            {[{id:"manual",l:"🏗️ Sélection manuelle"},
              {id:"forces",l:"📊 Par effort tranchant"}].map(t=>(
              <button type="button" key={t.id} onClick={()=>setTab(t.id)} style={{
                flex:1,padding:"8px",borderRadius:8,cursor:"pointer",
                border:`1px solid ${tab===t.id?c.blue:c.border}`,
                background:tab===t.id?c.blue+"22":c.elevated,
                color:tab===t.id?c.blue:c.textSec,
                fontSize:13,fontWeight:tab===t.id?700:400}}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        <div style={{padding:"12px 18px 16px"}}>

          {/* ── MANUAL TAB ── */}
          {tab === "manual" && (
            <>
              {/* Material selection cards */}
              <div style={{fontSize:11,color:c.textMuted,textTransform:"uppercase",
                letterSpacing:"0.07em",fontWeight:600,marginBottom:8}}>
                Matériau
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5,marginBottom:12}}>
                {MATERIALS.map(mat => (
                  <button type="button" key={mat.id}
                    onClick={() => { setMatId(mat.id); setSelSysId(null) }}
                    style={{
                      padding:"7px 4px",borderRadius:8,cursor:"pointer",textAlign:"center",
                      border: matId===mat.id ? `2px solid ${c.blue}` : `1px solid ${c.border}`,
                      background: matId===mat.id ? c.blue+"18" : c.elevated,
                    }}>
                    <div style={{fontSize:16,marginBottom:2}}>{mat.icon}</div>
                    <div style={{fontSize:10,fontWeight:600,
                      color:matId===mat.id?c.blue:c.textSec,lineHeight:1.2}}>
                      {mat.label}
                    </div>
                    <div style={{fontSize:9,color:c.textMuted,marginTop:2}}>
                      {mat.systems.length} syst.
                    </div>
                  </button>
                ))}
              </div>

              {/* Systems table for selected material */}
              <div style={{fontSize:11,color:c.textMuted,textTransform:"uppercase",
                letterSpacing:"0.07em",fontWeight:600,marginBottom:8}}>
                Systèmes — {activeMat?.label}
              </div>

              <div style={{border:`1px solid ${c.border}`,borderRadius:10,overflow:"hidden",marginBottom:14,maxHeight:260,overflowY:"auto"}}>
                {/* Table header */}
                <div style={{display:"grid",gridTemplateColumns:"30px 1fr 52px 52px",
                  background:c.elevated,borderBottom:`1px solid ${c.border}`}}>
                  {["#","Système de contreventement","R","Cat."].map((h,i)=>(
                    <div key={i} style={{padding:"7px 10px",fontSize:10,
                      color:c.textMuted,textTransform:"uppercase",
                      letterSpacing:"0.06em",fontWeight:600,
                      textAlign:i>=2?"center":"left"}}>{h}</div>
                  ))}
                </div>

                {/* System rows */}
                {activeMat?.systems.map(sys => {
                  const isSel = selSysId === sys.id
                  return (
                    <div key={sys.id}
                      onClick={() => setSelSysId(sys.id)}
                      style={{
                        display:"grid",gridTemplateColumns:"30px 1fr 52px 52px",
                        borderBottom:`1px solid ${c.border}`,cursor:"pointer",
                        background: isSel ? c.blue+"15" : "transparent",
                        border: isSel ? `1.5px solid ${c.blue}` : undefined,
                      }}>
                      <div style={{padding:"9px 10px",fontSize:11,
                        color:isSel?c.blue:c.textMuted,fontWeight:isSel?700:400,
                        display:"flex",alignItems:"center"}}>
                        {sys.id}
                      </div>
                      <div style={{padding:"9px 10px"}}>
                        <div style={{fontSize:12,color:isSel?c.blue:c.text,
                          fontWeight:isSel?600:400,lineHeight:1.3}}>
                          {sys.label}
                        </div>
                        {sys.desc && (
                          <div style={{fontSize:10,color:c.textMuted,marginTop:2}}>
                            {sys.desc}
                          </div>
                        )}
                      </div>
                      <div style={{padding:"9px 10px",display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:17,fontWeight:700,
                        color:c.amber,fontFamily:"monospace",
                        borderLeft:`1px solid ${c.border}`}}>
                        {sys.R}
                      </div>
                      <div style={{padding:"9px 10px",display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:11,
                        color:sys.qfCat==="a"?c.blue:sys.qfCat==="b"?c.purple:c.textMuted,
                        background:sys.qfCat==="a"?c.blue+"11":sys.qfCat==="b"?c.purple+"11":"transparent",
                        borderLeft:`1px solid ${c.border}`}}>
                        ({sys.qfCat})
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── AUTO TAB (unchanged) ── */}
          {tab === "forces" && (
            <div style={{marginBottom:16}}>
              <div style={{background:c.elevated,border:`1px solid ${c.border}`,
                borderRadius:8,padding:"9px 13px",marginBottom:14,
                display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",
                  background:c.borderLight,flexShrink:0}}/>
                <span style={{fontSize:12,color:c.textMuted,flex:1}}>
                  Robot non connecté — import automatique indisponible
                </span>
                <button type="button" style={{padding:"5px 11px",borderRadius:6,
                  cursor:"not-allowed",background:c.border,border:"none",
                  color:c.textMuted,fontSize:11}}>
                  Connecter
                </button>
              </div>

              <div style={{display:"flex",gap:10,marginBottom:12}}>
                {[{label:"V ossature (kN)",val:Voss,set:setVoss},
                  {label:"V voiles (kN)",  val:Vvoi,set:setVvoi},
                  {label:"V total (kN)",   val:Vtot,set:setVtot}].map(f=>(
                  <div key={f.label} style={{flex:1}}>
                    <div style={{fontSize:11,color:c.textMuted,marginBottom:4}}>{f.label}</div>
                    <input type="number" min={0} value={f.val}
                      onChange={e=>f.set(e.target.value)}
                      style={{width:"100%",background:c.elevated,
                        border:`1px solid ${c.border}`,borderRadius:7,
                        padding:"8px 10px",color:c.text,
                        fontSize:15,fontFamily:"monospace",outline:"none"}}/>
                  </div>
                ))}
              </div>

              <button type="button" onClick={detectFromForces} style={{
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

          {/* Selected system summary + validate */}
          {activeSys && (
            <div style={{background:c.elevated,border:`1px solid ${c.amber}44`,
              borderRadius:10,padding:"12px 16px",marginBottom:14,
              display:"flex",alignItems:"center",gap:16}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:c.textMuted,marginBottom:2}}>
                  {tab==="manual" ? activeMat?.label : "Béton armé"} — {activeSys.label}
                </div>
                <div style={{fontSize:11,color:c.textMuted}}>
                  Cat. Q<sub>F</sub> :&nbsp;
                  <b style={{color:activeSys.qfCat==="a"?c.blue:c.purple}}>
                    ({activeSys.qfCat})
                  </b>
                </div>
              </div>
              <div style={{fontSize:40,fontWeight:700,fontFamily:"monospace",color:c.amber}}>
                {activeSys.R}
              </div>
            </div>
          )}

          <button type="button"
            onClick={() => onValidate(activeSys?.R, activeSys)}
            disabled={!activeSys}
            style={{
              width:"100%",padding:"11px",borderRadius:8,
              cursor:activeSys?"pointer":"not-allowed",
              background:activeSys?c.blue:c.border,
              border:"none",color:"white",fontSize:14,fontWeight:700,
            }}>
            {activeSys ? `Valider R = ${activeSys.R}` : "Sélectionner un système d'abord"}
          </button>
        </div>
      </div>
    </div>
  )
}
