/**
 * StructCalc — RPA 2024 Spectrum Visualizer (Session 3 — Full Update)
 * Implements Sad/g (Eq 3.15) + Svd/g (Eq 3.16)
 */
import { useState, useMemo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts"

const DARK = {
  bg:"#020817",surface:"#0a1628",elevated:"#0f172a",border:"#1e293b",borderLight:"#334155",
  text:"#f8fafc",textSec:"#94a3b8",textMuted:"#475569",chartGrid:"#1e293b",
  blue:"#3b82f6",green:"#34d399",amber:"#f59e0b",red:"#f87171",purple:"#a78bfa",
}
const LIGHT = {
  bg:"#f8fafc",surface:"#ffffff",elevated:"#f1f5f9",border:"#e2e8f0",borderLight:"#cbd5e1",
  text:"#0f172a",textSec:"#475569",textMuted:"#94a3b8",chartGrid:"#e2e8f0",
  blue:"#2563eb",green:"#059669",amber:"#d97706",red:"#dc2626",purple:"#7c3aed",
}

const ZONE_A = {"I":0.07,"II":0.10,"III":0.15,"IV":0.20,"V":0.25,"VI":0.30}
const IMPORTANCE_I = {"1A":1.4,"1B":1.2,"2":1.0,"3":0.8}
const HORIZ_TYPE1 = {
  S1:{S:1.00,T1:0.10,T2:0.40,T3:2.0},S2:{S:1.20,T1:0.10,T2:0.50,T3:2.0},
  S3:{S:1.30,T1:0.15,T2:0.60,T3:2.0},S4:{S:1.35,T1:0.15,T2:0.70,T3:2.0},
}
const HORIZ_TYPE2 = {
  S1:{S:1.00,T1:0.05,T2:0.25,T3:1.2},S2:{S:1.30,T1:0.05,T2:0.30,T3:1.2},
  S3:{S:1.55,T1:0.10,T2:0.40,T3:1.2},S4:{S:1.80,T1:0.10,T2:0.50,T3:1.2},
}
const VERT_TYPE1 = {
  S1:{vRatio:0.90,T1:0.05,T2:0.20,T3:1.0,alpha:0.6},S2:{vRatio:0.90,T1:0.05,T2:0.30,T3:1.0,alpha:0.6},
  S3:{vRatio:0.90,T1:0.05,T2:0.40,T3:1.0,alpha:0.6},S4:{vRatio:0.90,T1:0.05,T2:0.50,T3:1.0,alpha:0.6},
}
const VERT_TYPE2 = {
  S1:{vRatio:0.55,T1:0.05,T2:0.15,T3:1.0,alpha:0.8},S2:{vRatio:0.55,T1:0.05,T2:0.20,T3:1.0,alpha:0.8},
  S3:{vRatio:0.55,T1:0.05,T2:0.25,T3:1.0,alpha:0.8},S4:{vRatio:0.55,T1:0.05,T2:0.30,T3:1.0,alpha:0.8},
}
const TYPE1_ZONES = new Set(["IV","V","VI"])

const QF_CRITERIA = {
  a:[
    {id:"a1",label:"Régularité en plan",pq:0.05},
    {id:"a2",label:"Régularité en élévation",pq:0.20},
    {id:"a3",label:"Conditions min. niveaux (≥2)",pq:0.20},
    {id:"a4",label:"Conditions min. travées (≥3)",pq:0.10},
  ],
  b:[
    {id:"b1",label:"Régularité en plan",pq:0.05},
    {id:"b2",label:"Régularité en élévation",pq:0.20},
    {id:"b3",label:"Redondance en plan (≥2 files voiles)",pq:0.05},
  ],
  c:[],
}
const QF_MAX = {a:1.35,b:1.30,c:1.0}

function computeSadH(T,A,I,S,QF,R,T1,T2,T3) {
  const g=QF/R, base=A*I*S, floor=0.2*A*I
  let v
  if(T<T1)      v=base*(2/3+(T/T1)*(2.5*g-2/3))
  else if(T<T2) v=base*2.5*g
  else if(T<T3) v=base*2.5*g*(T2/T)
  else          v=base*2.5*g*(T2*T3/Math.min(T,4)**2)
  return Math.max(v,floor)
}

function computeSvdV(T,Av,I,T1,T2,T3,alpha) {
  const g=1/1.5, floor=0.2*Av*I
  let v
  if(T<T1)      v=Av*I*(2/3+(T/T1)*(2.5*g-2/3))
  else if(T<T2) v=Av*I*2.5*g
  else if(T<T3) v=Av*I*2.5*g*Math.pow(T2/T,alpha)
  else          v=Av*I*2.5*g*Math.pow(T2*T3/Math.min(T,4)**2,alpha)
  return Math.max(v,floor)
}

function buildSpectrum(zone,site,group,QF,R,isVertical) {
  const A=ZONE_A[zone], I=IMPORTANCE_I[group], isT1=TYPE1_ZONES.has(zone)
  if(!isVertical) {
    const p=isT1?HORIZ_TYPE1[site]:HORIZ_TYPE2[site]
    const {S,T1,T2,T3}=p
    const pts=[]
    for(let T=0;T<=4.001;T=Math.round((T+0.01)*1000)/1000)
      pts.push({T:+T.toFixed(3),Sa_g:+computeSadH(T,A,I,S,QF,R,T1,T2,T3).toFixed(5),branch:T<T1?1:T<T2?2:T<T3?3:4})
    return {A,I,S,QF,R,T1,T2,T3,Av:null,
      spectrumType:isT1?"Type 1":"Type 2",
      peakSa:+(A*I*S*2.5*(QF/R)).toFixed(4),
      floor:+(0.2*A*I).toFixed(4),pts,
      label:"Sad(T)/g",eq:"Éq. 3.15"}
  } else {
    const vp=isT1?VERT_TYPE1[site]:VERT_TYPE2[site]
    const {vRatio,T1,T2,T3,alpha}=vp
    const Av=+(vRatio*A).toFixed(4)
    const pts=[]
    for(let T=0;T<=4.001;T=Math.round((T+0.01)*1000)/1000)
      pts.push({T:+T.toFixed(3),Sa_g:+computeSvdV(T,Av,I,T1,T2,T3,alpha).toFixed(5),branch:T<T1?1:T<T2?2:T<T3?3:4})
    return {A,I,S:"1.0",QF:"1.0",R:"1.5",T1,T2,T3,Av,alpha,
      spectrumType:isT1?"Type 1":"Type 2",
      peakSa:+(Av*I*2.5/1.5).toFixed(4),
      floor:+(0.2*Av*I).toFixed(4),pts,
      label:"Svd(T)/g",eq:"Éq. 3.16"}
  }
}

const BLABELS=["","Montée","Palier","Vitesse","Déplacement"]
const BCOLORS=["","#60a5fa","#34d399","#f59e0b","#f87171"]

function Tip({active,payload,c}){
  if(!active||!payload?.length)return null
  const d=payload[0].payload
  return(
    <div style={{background:c.elevated,border:`1px solid ${c.borderLight}`,borderRadius:8,padding:"10px 14px",fontSize:13}}>
      <div style={{color:c.textMuted,marginBottom:3}}>T = <b style={{color:c.text}}>{d.T.toFixed(2)} s</b></div>
      <div style={{color:c.textMuted}}>Sa/g = <b style={{color:c.green,fontSize:16}}>{d.Sa_g.toFixed(4)}</b></div>
      <div style={{marginTop:4}}>
        <span style={{background:BCOLORS[d.branch]+"22",color:BCOLORS[d.branch],borderRadius:4,padding:"2px 6px",fontSize:11}}>
          Branche {d.branch} — {BLABELS[d.branch]}
        </span>
      </div>
    </div>
  )
}

function Sel({label,value,onChange,options,c}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,textTransform:"uppercase"}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{background:c.elevated,border:`1px solid ${c.border}`,color:c.text,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Card({label,value,unit,accent,c}){
  return(
    <div style={{background:c.elevated,border:`1px solid ${accent}44`,borderRadius:10,padding:"12px 14px",flex:1,minWidth:88}}>
      <div style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,textTransform:"uppercase",marginBottom:5}}>{label}</div>
      <div style={{fontSize:26,fontWeight:700,color:accent,fontFamily:"monospace",lineHeight:1.1}}>{value}</div>
      {unit&&<div style={{fontSize:11,color:c.textMuted,marginTop:3}}>{unit}</div>}
    </div>
  )
}

const DEFAULT_CHECKED = {a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true}

function QFModal({onClose,onValidate,initCat,initChecked,c}){
  const [cat,setCat]=useState(initCat)
  const [chk,setChk]=useState(initChecked)
  const criteria=QF_CRITERIA[cat]
  const qf=useMemo(()=>{
    if(cat==="c")return 1.0
    let t=1.0
    criteria.forEach(cr=>{if(!chk[cr.id])t+=cr.pq})
    return +Math.min(t,QF_MAX[cat]).toFixed(2)
  },[cat,chk,criteria])
  function changeCat(c2){
    setCat(c2)
    const r={}
    QF_CRITERIA[c2].forEach(cr=>{r[cr.id]=true})
    setChk(r)
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:28,width:460,maxWidth:"95vw",boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,textTransform:"uppercase",marginBottom:4}}>RPA 2024 — §3.8 — Table 3.19</div>
            <h2 style={{fontSize:18,fontWeight:700,color:c.text,margin:0}}>Facteur de Qualité Q<sub>F</sub></h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:3}}>Q<sub>F</sub> = 1 + Σ P<sub>q</sub> (pénalités non satisfaits)</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:c.textMuted,fontSize:22,cursor:"pointer"}}>✕</button>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:c.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>Catégorie de pondération</div>
          <div style={{display:"flex",gap:8}}>
            {[{id:"a",l:"(a) Ossatures",s:"Syst. 1,2,3"},{id:"b",l:"(b) Voiles",s:"Syst. 4,5,6"},{id:"c",l:"(c) Spécial",s:"QF = 1.0"}].map(ct=>(
              <button key={ct.id} onClick={()=>changeCat(ct.id)}
                style={{flex:1,padding:"8px 6px",borderRadius:8,cursor:"pointer",
                  border:`1px solid ${cat===ct.id?c.blue:c.border}`,
                  background:cat===ct.id?c.blue+"22":c.elevated,
                  color:cat===ct.id?c.blue:c.textSec,
                  fontSize:12,fontWeight:cat===ct.id?700:400,textAlign:"center"}}>
                <div style={{fontWeight:600}}>{ct.l}</div>
                <div style={{fontSize:10,opacity:0.7,marginTop:1}}>{ct.s}</div>
              </button>
            ))}
          </div>
        </div>

        {cat==="c" ? (
          <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,borderRadius:8,padding:"14px",textAlign:"center",color:c.green,marginBottom:16,fontSize:14}}>
            Aucune pénalité — <b>Q<sub>F</sub> = 1.0</b>
          </div>
        ) : (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.08em"}}>
              ✅ = Satisfait (pas de pénalité) &nbsp;|&nbsp; ❌ = Non satisfait (pénalité ajoutée)
            </div>
            {criteria.map(cr=>(
              <div key={cr.id} onClick={()=>setChk(p=>({...p,[cr.id]:!p[cr.id]}))}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,cursor:"pointer",
                  background:chk[cr.id]?c.green+"11":c.red+"11",
                  border:`1px solid ${chk[cr.id]?c.green+"44":c.red+"44"}`,marginBottom:5}}>
                <div style={{width:20,height:20,borderRadius:5,flexShrink:0,
                  border:`2px solid ${chk[cr.id]?c.green:c.red}`,
                  background:chk[cr.id]?c.green:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:"white",fontWeight:700}}>
                  {chk[cr.id]?"✓":""}
                </div>
                <div style={{flex:1,fontSize:13,color:c.text}}>{cr.label}</div>
                <div style={{fontSize:13,fontFamily:"monospace",color:chk[cr.id]?c.green:c.red,fontWeight:700}}>
                  {chk[cr.id]?"+0.00":`+${cr.pq.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{background:c.elevated,borderRadius:10,padding:"12px 16px",marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:2}}>Q<sub>F</sub> résultant</div>
            <div style={{fontSize:34,fontWeight:700,fontFamily:"monospace",color:qf<=1.05?c.green:qf<=1.20?c.amber:c.red}}>
              {qf.toFixed(2)}
            </div>
            <div style={{fontSize:11,color:c.textMuted,marginTop:2}}>Plage : 1.00 ≤ Q<sub>F</sub> ≤ {QF_MAX[cat]}</div>
          </div>
          <div style={{fontSize:42}}>{qf<=1.05?"✅":qf<=1.20?"⚠️":"🔴"}</div>
        </div>

        <button onClick={()=>onValidate(qf,cat,chk)}
          style={{width:"100%",padding:"12px",borderRadius:8,cursor:"pointer",
            background:c.blue,border:"none",color:"white",fontSize:14,fontWeight:700}}>
          Valider Q<sub>F</sub> = {qf.toFixed(2)}
        </button>
      </div>
    </div>
  )
}

export default function SpectrumChart(){
  const [isDark,setIsDark]=useState(true)
  const [isVert,setIsVert]=useState(false)
  const [zone,setZone]=useState("VI")
  const [site,setSite]=useState("S2")
  const [group,setGroup]=useState("2")
  const [QF,setQF]=useState(1.0)
  const [R,setR]=useState(4.5)
  const [qfCat,setQfCat]=useState("a")
  const [qfChk,setQfChk]=useState(DEFAULT_CHECKED)
  const [showQ,setShowQ]=useState(false)
  const robotStatus="disconnected"
  const c=isDark?DARK:LIGHT

  const res=useMemo(()=>buildSpectrum(zone,site,group,QF,R,isVert),[zone,site,group,QF,R,isVert])
  const {T1,T2,T3,peakSa,floor,spectrumType,pts,label,eq}=res

  return(
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",padding:"24px 20px",transition:"background 0.2s,color 0.2s"}}>

      {showQ&&<QFModal c={c} initCat={qfCat} initChecked={qfChk} onClose={()=>setShowQ(false)}
        onValidate={(qf,cat,chk)=>{setQF(qf);setQfCat(cat);setQfChk(chk);setShowQ(false)}}/>}

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:22,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,letterSpacing:"0.15em",color:c.blue,textTransform:"uppercase",marginBottom:5}}>RPA 2024 — DTR BC 2.48 — §3.3.3</div>
          <h1 style={{fontSize:23,fontWeight:700,margin:0,color:c.text}}>Spectre de Réponse de Calcul</h1>
          <div style={{color:c.textMuted,fontSize:12,marginTop:3}}>
            {isVert?"Composante verticale Svd(T)/g — Éq. 3.16":"Composante horizontale Sad(T)/g — Éq. 3.15"}
          </div>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
          {/* H/V toggle */}
          <div style={{display:"flex",alignItems:"center",gap:8,background:c.elevated,border:`1px solid ${c.border}`,borderRadius:8,padding:"6px 12px"}}>
            <span style={{fontSize:12,color:isVert?c.textMuted:c.blue,fontWeight:700}}>H</span>
            <div onClick={()=>setIsVert(v=>!v)}
              style={{width:38,height:20,borderRadius:10,cursor:"pointer",background:isVert?c.purple:c.blue,position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:3,left:isVert?18:3,width:14,height:14,borderRadius:"50%",background:"white",transition:"left 0.2s"}}/>
            </div>
            <span style={{fontSize:12,color:isVert?c.purple:c.textMuted,fontWeight:700}}>V</span>
          </div>
          {/* Theme toggle */}
          <button onClick={()=>setIsDark(d=>!d)} style={{padding:"7px 14px",borderRadius:8,cursor:"pointer",background:c.elevated,border:`1px solid ${c.border}`,color:c.textSec,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
            {isDark?"☀️ Clair":"🌙 Sombre"}
          </button>
        </div>
      </div>

      <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
        {/* Input panel */}
        <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:20,width:210,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,textTransform:"uppercase"}}>Paramètres</div>
          <Sel label="Zone sismique" value={zone} onChange={setZone} c={c} options={[
            {v:"I",l:"Zone I — Faible"},{v:"II",l:"Zone II"},{v:"III",l:"Zone III — Moyenne"},
            {v:"IV",l:"Zone IV"},{v:"V",l:"Zone V — Élevée"},{v:"VI",l:"Zone VI — Élevée"},
          ]}/>
          <Sel label="Classe de site" value={site} onChange={setSite} c={c} options={[
            {v:"S1",l:"S1 — Rocher"},{v:"S2",l:"S2 — Ferme"},{v:"S3",l:"S3 — Meuble"},{v:"S4",l:"S4 — Très meuble"},
          ]}/>
          <Sel label="Groupe d'importance" value={group} onChange={setGroup} c={c} options={[
            {v:"1A",l:"Groupe 1A — I=1.4"},{v:"1B",l:"Groupe 1B — I=1.2"},{v:"2",l:"Groupe 2 — I=1.0"},{v:"3",l:"Groupe 3 — I=0.8"},
          ]}/>

          {!isVert&&<>
            {/* QF button */}
            <div>
              <div style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,textTransform:"uppercase",marginBottom:5}}>Facteur de qualité Q<sub>F</sub></div>
              <button onClick={()=>setShowQ(true)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:8,cursor:"pointer",background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
                <span>Q<sub>F</sub> = <b style={{color:c.amber}}>{QF.toFixed(2)}</b></span>
                <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
              </button>
            </div>
            {/* R from Robot */}
            <div>
              <div style={{fontSize:11,letterSpacing:"0.08em",color:c.textMuted,textTransform:"uppercase",marginBottom:5}}>Coeff. comportement R</div>
              <div style={{background:c.elevated,border:`1px solid ${c.border}`,borderRadius:8,overflow:"hidden"}}>
                <div style={{padding:"6px 10px",fontSize:11,borderBottom:`1px solid ${c.border}`,display:"flex",alignItems:"center",gap:6,color:c.textMuted}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:c.borderLight}}/>
                  Robot non connecté
                </div>
                <input type="number" min={1} max={6} step={0.5} value={R}
                  onChange={e=>setR(+e.target.value)}
                  style={{width:"100%",background:"transparent",border:"none",color:c.text,fontSize:24,fontWeight:700,fontFamily:"monospace",outline:"none",padding:"6px 10px"}}/>
              </div>
            </div>
          </>}

          {isVert&&(
            <div style={{background:c.purple+"11",border:`1px solid ${c.purple}44`,borderRadius:8,padding:"10px 12px",fontSize:12,color:c.textSec,lineHeight:1.8}}>
              Spectre vertical :<br/>
              <b style={{color:c.purple}}>R = 1.5</b> (fixe)<br/>
              <b style={{color:c.purple}}>S = 1.0</b> (fixe)<br/>
              <b style={{color:c.purple}}>QF = 1.0</b> (fixe)
            </div>
          )}

          <div style={{background:TYPE1_ZONES.has(zone)?c.blue+"22":c.green+"22",border:`1px solid ${TYPE1_ZONES.has(zone)?c.blue:c.green}`,borderRadius:8,padding:"8px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,color:c.textMuted,marginBottom:2}}>Type de spectre</div>
            <div style={{fontSize:15,fontWeight:700,color:TYPE1_ZONES.has(zone)?c.blue:c.green}}>{spectrumType}</div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{flex:1,minWidth:280,display:"flex",flexDirection:"column",gap:14}}>

          {/* Param cards — large and readable */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Card label="A"        value={res.A}          unit="zone"         accent={c.amber}    c={c}/>
            <Card label="I"        value={res.I}          unit="importance"   accent={c.purple}   c={c}/>
            <Card label="S"        value={res.S}          unit="site"         accent={c.green}    c={c}/>
            {!isVert&&<>
              <Card label="QF"     value={QF.toFixed(2)}  unit="qualité"      accent={c.amber}    c={c}/>
              <Card label="R"      value={R}              unit="comportement" accent={c.red}      c={c}/>
            </>}
            {isVert&&<>
              <Card label="Av"     value={res.Av}         unit="vertical"     accent={c.purple}   c={c}/>
              <Card label="α"      value={res.alpha}      unit="exposant"     accent={c.purple}   c={c}/>
            </>}
            <Card label="T₁"       value={T1}             unit="sec"          accent={c.textMuted} c={c}/>
            <Card label="T₂"       value={T2}             unit="sec"          accent={c.textMuted} c={c}/>
            <Card label="T₃"       value={T3}             unit="sec"          accent={c.textMuted} c={c}/>
            <Card label="Sa max"   value={peakSa}         unit="palier"       accent={c.red}      c={c}/>
          </div>

          {/* Chart */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:"18px 14px 12px"}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:12}}>
              <span style={{color:c.blue,fontWeight:600}}>{label}</span>
              &nbsp;·&nbsp;{eq} — RPA 2024
              &nbsp;·&nbsp;Plancher min :&nbsp;
              <span style={{color:c.amber,fontFamily:"monospace"}}>{floor}</span>
            </div>
            <div style={{maxWidth:520}}>
              <ResponsiveContainer width="100%" height={290}>
                <LineChart data={pts} margin={{top:4,right:14,bottom:22,left:4}}>
                  <CartesianGrid stroke={c.chartGrid} strokeDasharray="4 4"/>
                  <XAxis dataKey="T" type="number" domain={[0,4]}
                    ticks={[0,0.5,1,1.5,2,2.5,3,3.5,4]}
                    tick={{fill:c.textMuted,fontSize:11}}
                    label={{value:"Période T (s)",position:"insideBottom",offset:-12,fill:c.textMuted,fontSize:11}}/>
                  <YAxis tick={{fill:c.textMuted,fontSize:11}}
                    label={{value:"Sa/g",angle:-90,position:"insideLeft",offset:14,fill:c.textMuted,fontSize:11}}/>
                  <Tooltip content={<Tip c={c}/>}/>
                  <ReferenceLine x={T1} stroke={c.borderLight} strokeDasharray="5 3"
                    label={{value:"T₁",fill:c.textMuted,fontSize:10,position:"top"}}/>
                  <ReferenceLine x={T2} stroke={c.borderLight} strokeDasharray="5 3"
                    label={{value:"T₂",fill:c.textMuted,fontSize:10,position:"top"}}/>
                  <ReferenceLine x={T3} stroke={c.borderLight} strokeDasharray="5 3"
                    label={{value:"T₃",fill:c.textMuted,fontSize:10,position:"top"}}/>
                  <ReferenceLine y={peakSa} stroke={c.red+"44"} strokeDasharray="4 4"/>
                  <ReferenceLine y={floor}  stroke={c.amber+"44"} strokeDasharray="3 3"/>
                  <Line dataKey="Sa_g" dot={false} strokeWidth={2.5}
                    stroke={isVert?c.purple:c.blue}
                    isAnimationActive animationDuration={300}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
              {[1,2,3,4].map(b=>(
                <div key={b} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:c.textMuted}}>
                  <div style={{width:20,height:3,borderRadius:2,background:BCOLORS[b]}}/>
                  {BLABELS[b]}
                </div>
              ))}
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:c.amber}}>
                <div style={{width:20,height:2,borderRadius:2,borderTop:`2px dashed ${c.amber}`}}/>
                Plancher min.
              </div>
            </div>
          </div>

          {/* Formula bar */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:10,padding:"11px 14px",fontSize:12,color:c.textMuted,lineHeight:1.9}}>
            <span style={{color:c.blue,fontWeight:700}}>{eq} — RPA 2024</span>{"  "}
            {!isVert
              ?<span style={{fontFamily:"monospace"}}>Sad(palier) = A·I·S·2.5·(QF/R) = {res.A}·{res.I}·{res.S}·2.5·({QF.toFixed(2)}/{R}) = <span style={{color:c.red,fontWeight:700}}>{peakSa}</span></span>
              :<span style={{fontFamily:"monospace"}}>Svd(palier) = Av·I·(2.5/1.5) = {res.Av}·{res.I}·1.667 = <span style={{color:c.purple,fontWeight:700}}>{peakSa}</span></span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}
