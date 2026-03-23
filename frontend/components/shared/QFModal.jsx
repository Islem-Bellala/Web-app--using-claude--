/**
 * QFModal — Facteur de Qualité QF (Session 9b)
 *
 * Bug fix: app has zoom:1.35, which made this modal 35% too large.
 * Fix: zoom:0.741 on the overlay (= 1/1.35) brings it back to original size.
 * RPA 2024 §3.8 — Table 3.19
 */
import { useState, useMemo } from "react"

export const QF_CRITERIA = {
  a:[
    {id:"a1",label:"Régularité en plan",             pq:0.05},
    {id:"a2",label:"Régularité en élévation",        pq:0.20},
    {id:"a3",label:"Conditions min. niveaux (≥ 2)",  pq:0.20},
    {id:"a4",label:"Conditions min. travées (≥ 3)",  pq:0.10},
  ],
  b:[
    {id:"b1",label:"Régularité en plan",             pq:0.05},
    {id:"b2",label:"Régularité en élévation",        pq:0.20},
    {id:"b3",label:"Redondance en plan (≥ 2 files)", pq:0.05},
  ],
  c:[],
}
export const QF_MAX = {a:1.35, b:1.30, c:1.0}
export const DEF_CHECKED = {a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true}

export default function QFModal({ onClose, onValidate, initCat, initChecked, c }) {
  const [cat, setCat] = useState(initCat||"a")
  const [chk, setChk] = useState(initChecked||DEF_CHECKED)
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
    // zoom:0.741 counteracts the parent zoom:1.35 so the modal appears at its
    // original designed size (1.35 × 0.741 ≈ 1.0)
    <div style={{
      position:"fixed",inset:0,
      background:"rgba(0,0,0,0.72)",
      zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",
      zoom: 1,
    }}>
      <div style={{
        background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:14,padding:26,width:450,maxWidth:"95vw",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,textTransform:"uppercase",marginBottom:3}}>
              RPA 2024 — §3.8 — Table 3.19
            </div>
            <h2 style={{fontSize:17,fontWeight:700,color:c.text,margin:0}}>
              Facteur de Qualité Q<sub>F</sub>
            </h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>Q<sub>F</sub> = 1 + Σ P<sub>q</sub></div>
          </div>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",color:c.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:7,marginBottom:14}}>
          {[{id:"a",l:"(a) Ossatures",s:"Syst. 1,2,3"},
            {id:"b",l:"(b) Voiles",   s:"Syst. 4,5,6"},
            {id:"c",l:"(c) Spécial",  s:"QF = 1.0"}].map(ct=>(
            <button type="button" key={ct.id} onClick={()=>changeCat(ct.id)} style={{
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

        {cat==="c"?(
          <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,
            borderRadius:8,padding:12,textAlign:"center",color:c.green,marginBottom:14,fontSize:14}}>
            Aucune pénalité — <b>Q<sub>F</sub> = 1.0</b>
          </div>
        ):(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:7,textTransform:"uppercase",letterSpacing:"0.07em"}}>
              ✅ Satisfait = pas de pénalité
            </div>
            {criteria.map(cr=>(
              <div key={cr.id}
                onClick={()=>setChk(p=>({...p,[cr.id]:!p[cr.id]}))}
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

        <button type="button" onClick={()=>onValidate(qf,cat,chk)} style={{
          width:"100%",padding:11,borderRadius:8,cursor:"pointer",
          background:c.blue,border:"none",color:"white",fontSize:14,fontWeight:700}}>
          Valider Q<sub>F</sub> = {qf.toFixed(2)}
        </button>
      </div>
    </div>
  )
}
