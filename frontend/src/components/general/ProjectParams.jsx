/**
 * StructCalc — Paramètres Généraux
 * Central input hub — fills once, used by all verification modules.
 *
 * Block 1 — Identification          (facultatif, auto-generated)
 * Block 2 — Paramètres sismiques    (wilaya -> zone, site, groupe, QF, R)
 * Block 3 — Géométrie et masses     (table des niveaux)
 * Block 4 — Résultats analyse dyn.  (Tx, Ty, Vxd, Vyd, déplacements)
 */

import { useState } from "react"
import QFModal, { DEF_CHECKED } from "../shared/QFModal.jsx"
import RModal    from "../shared/RModal.jsx"

// ─────────────────────────────────────────────────────────────────────────────
// WILAYA DATA — RPA 2024 Annex A
// ─────────────────────────────────────────────────────────────────────────────
const WILAYAS = [
  {code:"01",name:"Adrar",              zone:"0",  split:false},
  {code:"02",name:"Chlef",              zone:"VI", split:true },
  {code:"03",name:"Laghouat",           zone:"II", split:true },
  {code:"04",name:"Oum El Bouaghi",     zone:"IV", split:true },
  {code:"05",name:"Batna",              zone:"III",split:true },
  {code:"06",name:"Béjaïa",           zone:"VI", split:true },
  {code:"07",name:"Biskra",             zone:"III",split:true },
  {code:"08",name:"Béchar",           zone:"I",  split:false},
  {code:"09",name:"Blida",              zone:"VI", split:false},
  {code:"10",name:"Bouira",             zone:"V",  split:true },
  {code:"11",name:"Tamanrasset",        zone:"0",  split:false},
  {code:"12",name:"Tébessa",          zone:"III",split:true },
  {code:"13",name:"Tlemcen",            zone:"IV", split:true },
  {code:"14",name:"Tiaret",             zone:"III",split:true },
  {code:"15",name:"Tizi Ouzou",         zone:"V",  split:true },
  {code:"16",name:"Alger",              zone:"VI", split:false},
  {code:"17",name:"Djelfa",             zone:"III",split:true },
  {code:"18",name:"Jijel",              zone:"VI", split:true },
  {code:"19",name:"Sétif",            zone:"IV", split:true },
  {code:"20",name:"Saïda",           zone:"I",  split:true },
  {code:"21",name:"Skikda",             zone:"IV", split:true },
  {code:"22",name:"Sidi Bel Abbès",  zone:"I",  split:true },
  {code:"23",name:"Annaba",             zone:"IV", split:false},
  {code:"24",name:"Guelma",             zone:"V",  split:false},
  {code:"25",name:"Constantine",        zone:"V",  split:false},
  {code:"26",name:"Médéa",           zone:"V",  split:true },
  {code:"27",name:"Mostaganem",         zone:"V",  split:true },
  {code:"28",name:"M'Sila",          zone:"IV", split:true },
  {code:"29",name:"Mascara",            zone:"VI", split:true },
  {code:"30",name:"Ouargla",            zone:"0",  split:false},
  {code:"31",name:"Oran",               zone:"VI", split:true },
  {code:"32",name:"El Bayadh",          zone:"II", split:true },
  {code:"33",name:"Illizi",             zone:"0",  split:false},
  {code:"34",name:"Bordj Bou Arréridj",zone:"V", split:true },
  {code:"35",name:"Boumerdès",       zone:"VI", split:true },
  {code:"36",name:"El Tarf",            zone:"V",  split:true },
  {code:"37",name:"Tindouf",            zone:"0",  split:false},
  {code:"38",name:"Tissemsilt",         zone:"IV", split:true },
  {code:"39",name:"El Oued",            zone:"II", split:true },
  {code:"40",name:"Khenchela",          zone:"III",split:true },
  {code:"41",name:"Souk Ahras",         zone:"V",  split:true },
  {code:"42",name:"Tipaza",             zone:"VI", split:false},
  {code:"43",name:"Mila",               zone:"V",  split:true },
  {code:"44",name:"Aïn Defla",       zone:"VI", split:true },
  {code:"45",name:"Naâma",           zone:"II", split:true },
  {code:"46",name:"Aïn Témouchent", zone:"V",  split:true },
  {code:"47",name:"Ghardaïa",        zone:"I",  split:false},
  {code:"48",name:"Relizane",           zone:"VI", split:true },
  {code:"49",name:"Timimoun",           zone:"0",  split:false},
  {code:"50",name:"Bordj Badji Mokhtar",zone:"0", split:false},
  {code:"51",name:"Ouled Djellal",      zone:"II", split:false},
  {code:"52",name:"Béni Abbès",      zone:"0",  split:false},
  {code:"53",name:"In Salah",           zone:"0",  split:false},
  {code:"54",name:"In Guezzam",         zone:"0",  split:false},
  {code:"55",name:"Touggourt",          zone:"I",  split:false},
  {code:"56",name:"Djanet",             zone:"0",  split:false},
  {code:"57",name:"El M'Ghair",      zone:"I",  split:false},
  {code:"58",name:"El Meniaa",          zone:"0",  split:false},
]

// Partial commune data (key split wilayas — same as SpectrumChart Session 5)
const WILAYA_COMMUNES = {
  "02":{defaultZone:"VI",communes:[{name:"Beni Bouattab",zone:"V"},{name:"Taougrite",zone:"V"},{name:"El Marsa",zone:"V"},{name:"Dahra",zone:"V"}]},
  "09":{defaultZone:"VI",communes:[]},
  "16":{defaultZone:"VI",communes:[]},
  "35":{defaultZone:"VI",communes:[{name:"Chaabet El Ameur",zone:"V"},{name:"Leghata",zone:"V"},{name:"Timezrit",zone:"V"},{name:"Isser",zone:"V"},{name:"Bordj Menaiel",zone:"V"},{name:"Naciria",zone:"V"},{name:"Sidi Daoud",zone:"IV"},{name:"Dellys",zone:"IV"},{name:"Afir",zone:"IV"},{name:"Baghlia",zone:"IV"}]},
  "42":{defaultZone:"VI",communes:[]},
  "44":{defaultZone:"VI",communes:[{name:"Djelida",zone:"V"},{name:"El Maine",zone:"V"},{name:"Zeddine",zone:"V"},{name:"Tarik Ibn Ziad",zone:"IV"},{name:"El Hassania",zone:"IV"}]},
  "48":{defaultZone:"VI",communes:[{name:"Ouled Yaich",zone:"V"},{name:"Zemmora",zone:"V"},{name:"Ain Tarek",zone:"IV"},{name:"El Hassi",zone:"IV"}]},
  "06":{defaultZone:"VI",communes:[{name:"Toudja",zone:"V"},{name:"Adekar",zone:"V"},{name:"El Kseur",zone:"V"},{name:"Akfadou",zone:"V"}]},
  "29":{defaultZone:"VI",communes:[{name:"Ain Fares",zone:"V"},{name:"Sidi Abdelmoumen",zone:"V"}]},
  "18":{defaultZone:"V",communes:[{name:"El Taguene",zone:"VI"},{name:"El Aouana",zone:"VI"},{name:"Jijel",zone:"VI"},{name:"El Milia",zone:"IV"}]},
  "19":{defaultZone:"IV",communes:[{name:"Babor",zone:"VI"},{name:"Bousselam",zone:"VI"},{name:"Ain Sebt",zone:"V"},{name:"Ain El Kebira",zone:"V"},{name:"Bougaa",zone:"V"}]},
  "10":{defaultZone:"V",communes:[{name:"Taguedit",zone:"IV"},{name:"Mezdour",zone:"IV"},{name:"Dirah",zone:"IV"}]},
  "15":{defaultZone:"IV",communes:[{name:"Illilten",zone:"V"},{name:"Bouzguen",zone:"V"},{name:"Boghni",zone:"V"},{name:"Draa El Mizan",zone:"V"},{name:"Tizi Ghenif",zone:"V"}]},
  "34":{defaultZone:"IV",communes:[{name:"Tafreg",zone:"V"},{name:"Djaafra",zone:"V"},{name:"El Main",zone:"V"}]},
}

const ZONE_LABELS = {
  "0":"Zone 0 — Très faible",
  "I":"Zone I (0.07g)","II":"Zone II (0.10g)","III":"Zone III (0.15g)",
  "IV":"Zone IV (0.20g)","V":"Zone V (0.25g)","VI":"Zone VI (0.30g)",
}

const FRAME_SYSTEMS = [
  {v:"ba_no_infill",   l:"Ossature BA sans remplissage",       ct:"CT=0.075"},
  {v:"steel_no_infill",l:"Ossature acier sans remplissage",    ct:"CT=0.085"},
  {v:"ba_with_infill", l:"Ossature BA/acier avec remplissage", ct:"CT=0.050"},
  {v:"other",          l:"Autres systèmes",                    ct:"CT=0.050"},
]

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function BlockHeader({ title, color, c }) {
  return (
    <div style={{fontSize:11,letterSpacing:"0.08em",fontWeight:700,
      color:color,textTransform:"uppercase",marginBottom:12}}>
      {title}
    </div>
  )
}

function Field({ label, children, c }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
      <label style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
        textTransform:"uppercase",fontWeight:600}}>{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, c, style={} }) {
  return (
    <input type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{background:c.elevated,border:`1px solid ${c.border}`,
        color:c.text,borderRadius:8,padding:"8px 10px",
        fontSize:13,outline:"none",...style}}/>
  )
}

function NumInput({ value, onChange, placeholder, c, style={} }) {
  return (
    <input type="number" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{background:c.elevated,border:`1px solid ${c.border}`,
        color:c.text,borderRadius:8,padding:"8px 10px",
        fontSize:13,fontFamily:"monospace",outline:"none",...style}}/>
  )
}

function DirButton({ label, active, color, onClick, c }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex:1,padding:"6px",borderRadius:8,cursor:"pointer",
      border:`1px solid ${active ? color : c.border}`,
      background:active ? color+"22" : c.elevated,
      color:active ? color : c.textSec,
      fontSize:12,fontWeight:active ? 700 : 400}}>
      {label}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectParams({ params, setParams, c }) {
  // Modal visibility
  const [showQF,  setShowQF]  = useState(null)  // null | "single" | "x" | "y"
  const [showR,   setShowR]   = useState(null)  // null | "single" | "x" | "y"

  // Derive zone from wilaya + commune
  const wilaya      = WILAYAS.find(w => w.code === params.wilayaCode) || WILAYAS[8]
  const communeData = WILAYA_COMMUNES[params.wilayaCode]
  const hasCommunes = !!(communeData && communeData.communes.length > 0)

  function deriveZone(code, commune) {
    const w = WILAYAS.find(w2 => w2.code === code) || WILAYAS[8]
    const cd = WILAYA_COMMUNES[code]
    if (!commune || !cd) return w.zone
    const found = cd.communes.find(c2 => c2.name === commune)
    return found ? found.zone : cd.defaultZone
  }

  function update(key, val) {
    setParams(p => ({...p, [key]:val}))
  }

  function handleWilayaChange(code) {
    const newZone = deriveZone(code, "")
    setParams(p => ({...p, wilayaCode:code, commune:"", zone:newZone}))
  }

  function handleCommuneChange(commune) {
    const newZone = deriveZone(params.wilayaCode, commune)
    setParams(p => ({...p, commune, zone:newZone}))
  }

  // QF modal helpers
  function openQF(dir) { setShowQF(dir) }
  function handleQFValidate(qf, cat, chk) {
    if (showQF === "x")      setParams(p => ({...p, QFx:qf, qfCatX:cat, qfChkX:chk}))
    else if (showQF === "y") setParams(p => ({...p, QFy:qf, qfCatY:cat, qfChkY:chk}))
    else                     setParams(p => ({...p, QF:qf,  qfCat:cat,  qfChk:chk}))
    setShowQF(null)
  }

  // R modal helpers
  function openR(dir) { setShowR(dir) }
  function handleRValidate(r, sys) {
    if (showR === "x")      setParams(p => ({...p, Rx:r, selSysX:sys?.id||1, qfCatX:sys?.qfCat||"a"}))
    else if (showR === "y") setParams(p => ({...p, Ry:r, selSysY:sys?.id||1, qfCatY:sys?.qfCat||"a"}))
    else                    setParams(p => ({...p, R:r,  selSys:sys?.id||1,  qfCat:sys?.qfCat||"a"}))
    setShowR(null)
  }

  // Storey table
  function addStorey() {
    const last = params.stories[params.stories.length - 1]
    const lastElev = parseFloat(last?.elevation) || 0
    const step = params.stories.length >= 2
      ? parseFloat(last.elevation) - parseFloat(params.stories[params.stories.length-2].elevation)
      : 3.0
    const newStorey = {
      id: Date.now(),
      name: `Etage ${params.stories.length}`,
      elevation: (lastElev + step).toFixed(1),
      weight: last?.weight || "1000",
      drx:"", dry:"",
    }
    setParams(p => ({...p, stories:[...p.stories, newStorey]}))
  }

  function removeStorey(id) {
    if (params.stories.length <= 1) return
    setParams(p => ({...p, stories:p.stories.filter(s => s.id !== id)}))
  }

  function updateStorey(id, field, val) {
    setParams(p => ({...p, stories:p.stories.map(s => s.id===id ? {...s,[field]:val} : s)}))
  }

  const isZone0 = params.zone === "0"
  const totalW  = params.stories.reduce((a,s) => a+(parseFloat(s.weight)||0), 0)
  const hn      = params.stories.length
    ? Math.max(...params.stories.map(s => parseFloat(s.elevation)||0))
    : 0

  const inputStyle = {background:c.elevated,border:`1px solid ${c.border}`,
    color:c.text,borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none",width:"100%"}

  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px",transition:"background 0.2s"}}>

      {/* QF Modals */}
      {showQF && (
        <QFModal c={c}
          initCat={showQF==="x" ? params.qfCatX : showQF==="y" ? params.qfCatY : params.qfCat}
          initChecked={showQF==="x" ? params.qfChkX : showQF==="y" ? params.qfChkY : params.qfChk}
          onClose={() => setShowQF(null)}
          onValidate={handleQFValidate}/>
      )}

      {/* R Modals */}
      {showR && (
        <RModal c={c}
          initSystem={showR==="x" ? params.selSysX : showR==="y" ? params.selSysY : params.selSys}
          onClose={() => setShowR(null)}
          onValidate={handleRValidate}/>
      )}

      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:5,fontWeight:600}}>
          StructCalc — Paramètres
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>
          Paramètres Généraux
        </h1>
        <div style={{color:c.textSec,fontSize:13,marginTop:3}}>
          Définis une fois — utilisés par tous les modules de vérification
        </div>
      </div>

      <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"flex-start"}}>

        {/* ── COLUMN 1: Identification + Sismique ── */}
        <div style={{display:"flex",flexDirection:"column",gap:14,width:240,flexShrink:0}}>

          {/* BLOCK 1 — Identification */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:16}}>
            <BlockHeader title="1 — Identification" color={c.textMuted} c={c}/>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:10,fontStyle:"italic"}}>
              Facultatif — généré automatiquement si vide
            </div>

            <Field label="Nom du projet" c={c}>
              <TextInput value={params.projectName}
                onChange={v => update("projectName",v)}
                placeholder={`Projet_${params.date}`} c={c}/>
            </Field>
            <Field label="Ingénieur" c={c}>
              <TextInput value={params.engineer}
                onChange={v => update("engineer",v)}
                placeholder="Nom de l'ingénieur" c={c}/>
            </Field>
            <Field label="Référence" c={c}>
              <TextInput value={params.reference}
                onChange={v => update("reference",v)}
                placeholder="Réf. dossier" c={c}/>
            </Field>
            <Field label="Date" c={c}>
              <div style={{background:c.elevated,border:`1px solid ${c.border}`,
                borderRadius:8,padding:"8px 10px",fontSize:13,color:c.textMuted}}>
                {params.date}
              </div>
            </Field>
          </div>

          {/* BLOCK 2 — Paramètres sismiques */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:16}}>
            <BlockHeader title="2 — Paramètres sismiques" color={c.blue} c={c}/>

            {/* Wilaya */}
            <Field label="Wilaya" c={c}>
              <select value={params.wilayaCode} onChange={e => handleWilayaChange(e.target.value)}
                style={inputStyle}>
                {WILAYAS.map(w => (
                  <option key={w.code} value={w.code}>{w.code} — {w.name}</option>
                ))}
              </select>
            </Field>

            {/* Commune — only if split wilaya */}
            {wilaya.split && hasCommunes && (
              <Field label="Commune" c={c}>
                <select value={params.commune} onChange={e => handleCommuneChange(e.target.value)}
                  style={{...inputStyle,border:`1px solid ${c.amber}66`}}>
                  <option value="">— Autre commune (Zone {communeData?.defaultZone || wilaya.zone})</option>
                  {[...communeData.communes]
                    .sort((a,b) => a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name))
                    .map(cm => (
                      <option key={cm.name} value={cm.name}>{cm.name} → Zone {cm.zone}</option>
                    ))}
                </select>
              </Field>
            )}
            {wilaya.split && !hasCommunes && (
              <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,
                borderRadius:8,padding:"8px 10px",fontSize:11,color:c.amber,
                lineHeight:1.5,marginBottom:10}}>
                ⚠️ Wilaya partagée — consulter l'Annexe A du RPA 2024
              </div>
            )}

            {/* Zone display */}
            <div style={{background:isZone0 ? c.amber+"18" : c.blue+"18",
              border:`1px solid ${isZone0 ? c.amber : c.blue}55`,
              borderRadius:8,padding:"8px 11px",marginBottom:10}}>
              <div style={{fontSize:10,color:c.textMuted,marginBottom:2,
                textTransform:"uppercase",letterSpacing:"0.06em"}}>Zone sismique</div>
              <div style={{fontSize:14,fontWeight:700,color:isZone0 ? c.amber : c.blue}}>
                {ZONE_LABELS[params.zone] || params.zone}
              </div>
            </div>

            {/* Site class */}
            <Field label="Classe de site" c={c}>
              <div style={{display:"flex",gap:5}}>
                {["S1","S2","S3","S4"].map(s => (
                  <button type="button" key={s} onClick={() => update("site",s)} style={{
                    flex:1,padding:"6px 0",borderRadius:7,cursor:"pointer",
                    border:`1px solid ${params.site===s ? c.green : c.border}`,
                    background:params.site===s ? c.green+"22" : c.elevated,
                    color:params.site===s ? c.green : c.textSec,
                    fontSize:12,fontWeight:params.site===s ? 700 : 400}}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            {/* Importance group */}
            <Field label="Groupe d'importance" c={c}>
              <select value={params.group} onChange={e => update("group",e.target.value)}
                style={inputStyle}>
                <option value="1A">Groupe 1A — I=1.4</option>
                <option value="1B">Groupe 1B — I=1.2</option>
                <option value="2">Groupe 2 — I=1.0</option>
                <option value="3">Groupe 3 — I=0.8</option>
              </select>
            </Field>

            {/* Direction toggle */}
            <Field label="Directions d'analyse (spectre)" c={c}>
              <div style={{display:"flex",gap:6}}>
                <DirButton label="Direction unique" active={!params.twoDir}
                  color={c.blue} onClick={() => update("twoDir",false)} c={c}/>
                <DirButton label="X et Y séparées" active={params.twoDir}
                  color={c.purple} onClick={() => update("twoDir",true)} c={c}/>
              </div>
            </Field>

            {/* QF and R — single or double */}
            {!params.twoDir ? (
              <>
                <Field label="Facteur qualité QF" c={c}>
                  <button type="button" onClick={() => openQF("single")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"9px 11px",borderRadius:8,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
                    <span>Q<sub>F</sub> = <b style={{color:c.amber}}>{params.QF.toFixed(2)}</b></span>
                    <span style={{fontSize:12,color:c.blue}}>Calculer →</span>
                  </button>
                </Field>
                <Field label="Coeff. comportement R" c={c}>
                  <button type="button" onClick={() => openR("single")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"9px 11px",borderRadius:8,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
                    <span>R = <b style={{color:c.red}}>{params.R}</b></span>
                    <span style={{fontSize:12,color:c.blue}}>Identifier →</span>
                  </button>
                  <div style={{fontSize:11,color:c.textSec,marginTop:4,paddingLeft:2}}>
                    Syst. {params.selSys} · Cat. Q<sub>F</sub> ({params.qfCat})
                  </div>
                </Field>
              </>
            ) : (
              <>
                {/* Direction X */}
                <div style={{background:c.blue+"11",border:`1px solid ${c.blue}33`,
                  borderRadius:8,padding:"10px",marginBottom:8}}>
                  <div style={{fontSize:11,color:c.blue,fontWeight:700,marginBottom:8,
                    textTransform:"uppercase",letterSpacing:"0.06em"}}>Direction X</div>
                  <button type="button" onClick={() => openQF("x")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12,marginBottom:6}}>
                    <span>Q<sub>Fx</sub> = <b style={{color:c.amber}}>{params.QFx.toFixed(2)}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
                  </button>
                  <button type="button" onClick={() => openR("x")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12}}>
                    <span>Rx = <b style={{color:c.red}}>{params.Rx}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Identifier →</span>
                  </button>
                </div>
                {/* Direction Y */}
                <div style={{background:c.purple+"11",border:`1px solid ${c.purple}33`,
                  borderRadius:8,padding:"10px"}}>
                  <div style={{fontSize:11,color:c.purple,fontWeight:700,marginBottom:8,
                    textTransform:"uppercase",letterSpacing:"0.06em"}}>Direction Y</div>
                  <button type="button" onClick={() => openQF("y")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12,marginBottom:6}}>
                    <span>Q<sub>Fy</sub> = <b style={{color:c.amber}}>{params.QFy.toFixed(2)}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
                  </button>
                  <button type="button" onClick={() => openR("y")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12}}>
                    <span>Ry = <b style={{color:c.red}}>{params.Ry}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Identifier →</span>
                  </button>
                </div>
              </>
            )}

            {/* Structural system for period */}
            <Field label="Système pour période T (CT)" c={c}>
              <select value={params.frameSys} onChange={e => update("frameSys",e.target.value)}
                style={inputStyle}>
                {FRAME_SYSTEMS.map(f => (
                  <option key={f.v} value={f.v}>{f.ct} — {f.l.split(" ").slice(0,4).join(" ")}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── COLUMN 2: Géométrie ── */}
        <div style={{display:"flex",flexDirection:"column",gap:14,width:300,flexShrink:0}}>
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:16}}>
            <BlockHeader title="3 — Géométrie et masses" color={c.green} c={c}/>

            {/* Column headers */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 65px 75px 28px",
              gap:6,marginBottom:6}}>
              {["Niveau","h (m)","W (kN)",""].map((h,i) => (
                <div key={i} style={{fontSize:10,color:c.textMuted,
                  textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{h}</div>
              ))}
            </div>

            {/* Storey rows */}
            <div style={{display:"flex",flexDirection:"column",gap:5,
              maxHeight:340,overflowY:"auto",marginBottom:10}}>
              {params.stories.map(s => (
                <div key={s.id} style={{display:"grid",
                  gridTemplateColumns:"1fr 65px 75px 28px",gap:6,alignItems:"center"}}>
                  <input value={s.name}
                    onChange={e => updateStorey(s.id,"name",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:6,padding:"6px 7px",color:c.text,fontSize:12,
                      outline:"none",width:"100%"}}/>
                  <input type="number" value={s.elevation} min={0} step={0.5}
                    onChange={e => updateStorey(s.id,"elevation",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:6,padding:"6px 7px",color:c.purple,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <input type="number" value={s.weight} min={0}
                    onChange={e => updateStorey(s.id,"weight",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:6,padding:"6px 7px",color:c.green,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <button type="button" onClick={() => removeStorey(s.id)}
                    disabled={params.stories.length<=1}
                    style={{width:24,height:24,borderRadius:5,cursor:"pointer",
                      background:params.stories.length>1 ? c.red+"22" : "transparent",
                      border:params.stories.length>1 ? `1px solid ${c.red}44` : "1px solid transparent",
                      color:params.stories.length>1 ? c.red : c.textMuted,
                      fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addStorey} style={{
              width:"100%",padding:"7px",borderRadius:7,cursor:"pointer",
              background:c.green+"22",border:`1px solid ${c.green}44`,
              color:c.green,fontSize:12,fontWeight:600,marginBottom:10}}>
              + Ajouter un niveau
            </button>

            {/* Totals */}
            <div style={{background:c.elevated,borderRadius:8,padding:"8px 11px",
              display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <span style={{fontSize:11,color:c.textMuted}}>Poids total W</span>
              <span style={{fontSize:14,fontWeight:700,color:c.green,fontFamily:"monospace"}}>
                {totalW.toFixed(0)} kN
              </span>
            </div>
            <div style={{background:c.elevated,borderRadius:8,padding:"8px 11px",
              display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:11,color:c.textMuted}}>Hauteur totale h<sub>n</sub></span>
              <span style={{fontSize:14,fontWeight:700,color:c.purple,fontFamily:"monospace"}}>
                {hn.toFixed(1)} m
              </span>
            </div>
          </div>
        </div>

        {/* ── COLUMN 3: Dynamic results ── */}
        <div style={{flex:1,minWidth:260}}>
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:16}}>
            <BlockHeader title="4 — Résultats analyse dynamique" color={c.amber} c={c}/>

            <div style={{background:c.elevated,border:`1px solid ${c.border}`,
              borderRadius:8,padding:"9px 13px",marginBottom:14,
              display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:c.borderLight,flexShrink:0}}/>
              <span style={{fontSize:12,color:c.textMuted,flex:1}}>
                Robot / ETABS non connecté — saisie manuelle
              </span>
              <button type="button" style={{padding:"5px 11px",borderRadius:6,cursor:"not-allowed",
                background:c.border,border:"none",color:c.textMuted,fontSize:11}}>
                Importer
              </button>
            </div>

            {/* Periods and dynamic shear */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {[
                {label:"Période Tx (s)",key:"Tx",color:c.blue},
                {label:"Période Ty (s)",key:"Ty",color:c.purple},
                {label:"Effort dyn. Vxd (kN)",key:"Vxd",color:c.blue},
                {label:"Effort dyn. Vyd (kN)",key:"Vyd",color:c.purple},
              ].map(f => (
                <div key={f.key}>
                  <label style={{fontSize:11,color:c.textSec,display:"block",
                    textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600,marginBottom:4}}>
                    {f.label}
                  </label>
                  <input type="number" value={params[f.key]} step="0.01" min={0}
                    placeholder="—"
                    onChange={e => update(f.key, e.target.value)}
                    style={{width:"100%",background:c.elevated,border:`1px solid ${f.color}44`,
                      borderRadius:8,padding:"8px 10px",color:f.color,
                      fontSize:14,fontFamily:"monospace",outline:"none"}}/>
                </div>
              ))}
            </div>

            {/* Per-floor displacements */}
            <div style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
              textTransform:"uppercase",fontWeight:600,marginBottom:8}}>
              Déplacements inter-étages relatifs (cm)
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",
              gap:6,marginBottom:6}}>
              {["Niveau","drx (cm)","dry (cm)"].map(h => (
                <div key={h} style={{fontSize:10,color:c.textMuted,
                  textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{h}</div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:200,overflowY:"auto"}}>
              {params.stories.map(s => (
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:12,color:c.textSec,padding:"4px 0"}}>{s.name}</div>
                  <input type="number" value={s.drx||""} step="0.001" min={0}
                    placeholder="—"
                    onChange={e => updateStorey(s.id,"drx",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.blue}44`,
                      borderRadius:6,padding:"5px 7px",color:c.blue,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <input type="number" value={s.dry||""} step="0.001" min={0}
                    placeholder="—"
                    onChange={e => updateStorey(s.id,"dry",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.purple}44`,
                      borderRadius:6,padding:"5px 7px",color:c.purple,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                </div>
              ))}
            </div>

            {/* Status summary */}
            <div style={{marginTop:14,background:c.elevated,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:11,color:c.textMuted,marginBottom:6,
                textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>
                Données disponibles
              </div>
              {[
                {label:"Périodes Tx/Ty",     ok:!!(params.Tx && params.Ty)},
                {label:"Efforts Vxd/Vyd",    ok:!!(params.Vxd && params.Vyd)},
                {label:"Déplacements drx",   ok:params.stories.some(s => s.drx)},
                {label:"Déplacements dry",   ok:params.stories.some(s => s.dry)},
              ].map(item => (
                <div key={item.label} style={{display:"flex",alignItems:"center",gap:8,
                  fontSize:12,color:item.ok ? c.green : c.textMuted,marginBottom:3}}>
                  <span style={{fontSize:14}}>{item.ok ? "✅" : "○"}</span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
