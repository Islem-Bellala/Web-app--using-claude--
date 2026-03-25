/**
 * StructCalc — Paramètres Généraux (Phase 3)
 * Reads from Zustand stores — no more props drilling.
 *
 * Block 1 — Identification          (facultatif, auto-generated)
 * Block 2 — Paramètres sismiques    (wilaya -> zone, site, groupe, QF, R)
 * Block 3 — Géométrie et masses     (table des niveaux)
 * Block 4 — Résultats analyse dyn.  (Tx, Ty, Vxd, Vyd, déplacements)
 */

import { useState } from "react"
import QFModal, { DEF_CHECKED } from "../shared/QFModal"
import RModal, { type BracingSystem } from "../shared/RModal"
import type { AppColors } from "../../types"
import { useProjectStore, useSeismicStore, useStructuralStore } from "../../stores"

// ─────────────────────────────────────────────────────────────────────────────
// WILAYA DATA — RPA 2024 Annex A
// NOTE: Still hardcoded here — will be removed in Phase 4 (fetched from API)
// ─────────────────────────────────────────────────────────────────────────────

interface WilayaEntry {
  code: string;
  name: string;
  zone: string;
  split: boolean;
}

interface CommuneEntry {
  name: string;
  zone: string;
}

interface CommuneData {
  defaultZone: string;
  communes: CommuneEntry[];
}

const WILAYAS: WilayaEntry[] = [
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
const WILAYA_COMMUNES: Record<string, CommuneData> = {
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

const ZONE_LABELS: Record<string, string> = {
  "0":"Zone 0 — Très faible",
  "I":"Zone I (0.07g)","II":"Zone II (0.10g)","III":"Zone III (0.15g)",
  "IV":"Zone IV (0.20g)","V":"Zone V (0.25g)","VI":"Zone VI (0.30g)",
}

interface FrameSystem {
  v: string;
  l: string;
  ct: string;
}

const FRAME_SYSTEMS: FrameSystem[] = [
  {v:"ba_no_infill",   l:"Ossature BA sans remplissage",       ct:"CT=0.075"},
  {v:"steel_no_infill",l:"Ossature acier sans remplissage",    ct:"CT=0.085"},
  {v:"ba_with_infill", l:"Ossature BA/acier avec remplissage", ct:"CT=0.050"},
  {v:"other",          l:"Autres systèmes",                    ct:"CT=0.050"},
]

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function BlockHeader({ title, color, c }: { title: string; color: string; c: AppColors }) {
  return (
    <div style={{fontSize:11,letterSpacing:"0.08em",fontWeight:700,
      color:color,textTransform:"uppercase",marginBottom:12}}>
      {title}
    </div>
  )
}

function Field({ label, children, c }: { label: string; children: React.ReactNode; c: AppColors }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:10}}>
      <label style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
        textTransform:"uppercase",fontWeight:600}}>{label}</label>
      {children}
    </div>
  )
}

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  c: AppColors;
  style?: React.CSSProperties;
}
function TextInput({ value, onChange, placeholder, c, style = {} }: TextInputProps) {
  return (
    <input type="text" value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{background:c.elevated,border:`1px solid ${c.border}`,
        color:c.text,borderRadius:8,padding:"8px 10px",
        fontSize:13,outline:"none",...style}}/>
  )
}

interface DirButtonProps {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
  c: AppColors;
}
function DirButton({ label, active, color, onClick, c }: DirButtonProps) {
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
// PROPS — only c (AppColors) needed now; all data comes from stores
// ─────────────────────────────────────────────────────────────────────────────

interface ProjectParamsProps {
  c: AppColors;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectParams({ c }: ProjectParamsProps) {
  // Stores
  const project    = useProjectStore()
  const seismic    = useSeismicStore()
  const structural = useStructuralStore()

  // Modal visibility — null | "single" | "x" | "y"
  const [showQF, setShowQF] = useState<string | null>(null)
  const [showR,  setShowR]  = useState<string | null>(null)

  // Derive zone from wilaya + commune
  const wilaya      = WILAYAS.find(w => w.code === project.wilayaCode) ?? WILAYAS[8]
  const communeData = WILAYA_COMMUNES[project.wilayaCode]
  const hasCommunes = !!(communeData && communeData.communes.length > 0)

  function deriveZone(code: string, commune: string): string {
    const w = WILAYAS.find(w2 => w2.code === code) ?? WILAYAS[8]
    const cd = WILAYA_COMMUNES[code]
    if (!commune || !cd) return w.zone
    const found = cd.communes.find(c2 => c2.name === commune)
    return found ? found.zone : cd.defaultZone
  }

  function handleWilayaChange(code: string) {
    const newZone = deriveZone(code, "")
    project.setWilaya(code)
    project.setCommune("")
    project.setZone(newZone)
  }

  function handleCommuneChange(commune: string) {
    const newZone = deriveZone(project.wilayaCode, commune)
    project.setCommune(commune)
    project.setZone(newZone)
  }

  // QF modal helpers
  function handleQFValidate(qf: number, cat: string, chk: Record<string, boolean>) {
    if (showQF === "x")      seismic.setQFParams({ QFx: qf, qfCatX: cat, qfChkX: chk })
    else if (showQF === "y") seismic.setQFParams({ QFy: qf, qfCatY: cat, qfChkY: chk })
    else                     seismic.setQFParams({ QF: qf, qfCat: cat, qfChk: chk })
    setShowQF(null)
  }

  // R modal helpers
  function handleRValidate(r: number | undefined, sys: BracingSystem | null | undefined) {
    if (showR === "x") {
      seismic.setRParams({ Rx: r ?? seismic.Rx, selSysX: sys?.id ?? 1 })
      seismic.setField('qfCatX', sys?.qfCat ?? 'a')
    } else if (showR === "y") {
      seismic.setRParams({ Ry: r ?? seismic.Ry, selSysY: sys?.id ?? 1 })
      seismic.setField('qfCatY', sys?.qfCat ?? 'a')
    } else {
      seismic.setRParams({ R: r ?? seismic.R, selSys: sys?.id ?? 1 })
      seismic.setField('qfCat', sys?.qfCat ?? 'a')
    }
    setShowR(null)
  }

  const isZone0 = project.zone === "0"
  const totalW  = structural.stories.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0)
  const hn      = structural.stories.length
    ? Math.max(...structural.stories.map(s => parseFloat(s.elevation) || 0))
    : 0

  const inputStyle: React.CSSProperties = {background:c.elevated,border:`1px solid ${c.border}`,
    color:c.text,borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none",width:"100%"}

  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px",transition:"background 0.2s"}}>

      {/* QF Modals */}
      {showQF && (
        <QFModal c={c}
          initCat={showQF==="x" ? seismic.qfCatX : showQF==="y" ? seismic.qfCatY : seismic.qfCat}
          initChecked={showQF==="x" ? seismic.qfChkX : showQF==="y" ? seismic.qfChkY : seismic.qfChk}
          onClose={() => setShowQF(null)}
          onValidate={handleQFValidate}/>
      )}

      {/* R Modals */}
      {showR && (
        <RModal c={c}
          initSystem={showR==="x" ? seismic.selSysX : showR==="y" ? seismic.selSysY : seismic.selSys}
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
              <TextInput value={project.projectName}
                onChange={v => project.setProjectMeta({ projectName: v })}
                placeholder={`Projet_${project.date}`} c={c}/>
            </Field>
            <Field label="Ingénieur" c={c}>
              <TextInput value={project.engineer}
                onChange={v => project.setProjectMeta({ engineer: v })}
                placeholder="Nom de l'ingénieur" c={c}/>
            </Field>
            <Field label="Référence" c={c}>
              <TextInput value={project.reference}
                onChange={v => project.setProjectMeta({ reference: v })}
                placeholder="Réf. dossier" c={c}/>
            </Field>
            <Field label="Date" c={c}>
              <div style={{background:c.elevated,border:`1px solid ${c.border}`,
                borderRadius:8,padding:"8px 10px",fontSize:13,color:c.textMuted}}>
                {project.date}
              </div>
            </Field>
          </div>

          {/* BLOCK 2 — Paramètres sismiques */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,borderRadius:14,padding:16}}>
            <BlockHeader title="2 — Paramètres sismiques" color={c.blue} c={c}/>

            {/* Wilaya */}
            <Field label="Wilaya" c={c}>
              <select value={project.wilayaCode} onChange={e => handleWilayaChange(e.target.value)}
                style={inputStyle}>
                {WILAYAS.map(w => (
                  <option key={w.code} value={w.code}>{w.code} — {w.name}</option>
                ))}
              </select>
            </Field>

            {/* Commune — only if split wilaya */}
            {wilaya.split && hasCommunes && (
              <Field label="Commune" c={c}>
                <select value={project.commune} onChange={e => handleCommuneChange(e.target.value)}
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
                {ZONE_LABELS[project.zone] || project.zone}
              </div>
            </div>

            {/* Site class */}
            <Field label="Classe de site" c={c}>
              <div style={{display:"flex",gap:5}}>
                {["S1","S2","S3","S4"].map(s => (
                  <button type="button" key={s} onClick={() => project.setSite(s)} style={{
                    flex:1,padding:"6px 0",borderRadius:7,cursor:"pointer",
                    border:`1px solid ${project.site===s ? c.green : c.border}`,
                    background:project.site===s ? c.green+"22" : c.elevated,
                    color:project.site===s ? c.green : c.textSec,
                    fontSize:12,fontWeight:project.site===s ? 700 : 400}}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            {/* Importance group */}
            <Field label="Groupe d'importance" c={c}>
              <select value={project.group} onChange={e => project.setGroup(e.target.value)}
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
                <DirButton label="Direction unique" active={!seismic.twoDir}
                  color={c.blue} onClick={() => seismic.setTwoDir(false)} c={c}/>
                <DirButton label="X et Y séparées" active={seismic.twoDir}
                  color={c.purple} onClick={() => seismic.setTwoDir(true)} c={c}/>
              </div>
            </Field>

            {/* QF and R — single or double */}
            {!seismic.twoDir ? (
              <>
                <Field label="Facteur qualité QF" c={c}>
                  <button type="button" onClick={() => setShowQF("single")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"9px 11px",borderRadius:8,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
                    <span>Q<sub>F</sub> = <b style={{color:c.amber}}>{seismic.QF.toFixed(2)}</b></span>
                    <span style={{fontSize:12,color:c.blue}}>Calculer →</span>
                  </button>
                </Field>
                <Field label="Coeff. comportement R" c={c}>
                  <button type="button" onClick={() => setShowR("single")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"9px 11px",borderRadius:8,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
                    <span>R = <b style={{color:c.red}}>{seismic.R}</b></span>
                    <span style={{fontSize:12,color:c.blue}}>Identifier →</span>
                  </button>
                  <div style={{fontSize:11,color:c.textSec,marginTop:4,paddingLeft:2}}>
                    Syst. {seismic.selSys} · Cat. Q<sub>F</sub> ({seismic.qfCat})
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
                  <button type="button" onClick={() => setShowQF("x")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12,marginBottom:6}}>
                    <span>Q<sub>Fx</sub> = <b style={{color:c.amber}}>{seismic.QFx.toFixed(2)}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
                  </button>
                  <button type="button" onClick={() => setShowR("x")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12}}>
                    <span>Rx = <b style={{color:c.red}}>{seismic.Rx}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Identifier →</span>
                  </button>
                </div>
                {/* Direction Y */}
                <div style={{background:c.purple+"11",border:`1px solid ${c.purple}33`,
                  borderRadius:8,padding:"10px"}}>
                  <div style={{fontSize:11,color:c.purple,fontWeight:700,marginBottom:8,
                    textTransform:"uppercase",letterSpacing:"0.06em"}}>Direction Y</div>
                  <button type="button" onClick={() => setShowQF("y")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12,marginBottom:6}}>
                    <span>Q<sub>Fy</sub> = <b style={{color:c.amber}}>{seismic.QFy.toFixed(2)}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
                  </button>
                  <button type="button" onClick={() => setShowR("y")} style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"8px 10px",borderRadius:7,cursor:"pointer",
                    background:c.elevated,border:`1px solid ${c.border}`,color:c.text,fontSize:12}}>
                    <span>Ry = <b style={{color:c.red}}>{seismic.Ry}</b></span>
                    <span style={{fontSize:11,color:c.blue}}>Identifier →</span>
                  </button>
                </div>
              </>
            )}

            {/* Structural system for period */}
            <Field label="Système pour période T (CT)" c={c}>
              <select value={seismic.frameSys} onChange={e => seismic.setField('frameSys', e.target.value)}
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
              {structural.stories.map(s => (
                <div key={s.id} style={{display:"grid",
                  gridTemplateColumns:"1fr 65px 75px 28px",gap:6,alignItems:"center"}}>
                  <input value={s.name}
                    onChange={e => structural.updateStory(s.id, "name", e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:6,padding:"6px 7px",color:c.text,fontSize:12,
                      outline:"none",width:"100%"}}/>
                  <input type="number" value={s.elevation} min={0} step={0.5}
                    onChange={e => structural.updateStory(s.id, "elevation", e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:6,padding:"6px 7px",color:c.purple,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <input type="number" value={s.weight} min={0}
                    onChange={e => structural.updateStory(s.id, "weight", e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:6,padding:"6px 7px",color:c.green,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <button type="button" onClick={() => structural.removeStory(s.id)}
                    disabled={structural.stories.length<=1}
                    style={{width:24,height:24,borderRadius:5,cursor:"pointer",
                      background:structural.stories.length>1 ? c.red+"22" : "transparent",
                      border:structural.stories.length>1 ? `1px solid ${c.red}44` : "1px solid transparent",
                      color:structural.stories.length>1 ? c.red : c.textMuted,
                      fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => structural.addStory()} style={{
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
              {([
                {label:"Période Tx (s)",      key:"Tx"  as const, color:c.blue,   val:seismic.Tx},
                {label:"Période Ty (s)",      key:"Ty"  as const, color:c.purple, val:seismic.Ty},
                {label:"Effort dyn. Vxd (kN)",key:"Vxd" as const, color:c.blue,   val:seismic.Vxd},
                {label:"Effort dyn. Vyd (kN)",key:"Vyd" as const, color:c.purple, val:seismic.Vyd},
              ]).map(f => (
                <div key={f.key}>
                  <label style={{fontSize:11,color:c.textSec,display:"block",
                    textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600,marginBottom:4}}>
                    {f.label}
                  </label>
                  <input type="number" value={f.val} step="0.01" min={0}
                    placeholder="—"
                    onChange={e => seismic.setField(f.key, e.target.value)}
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
              {structural.stories.map(s => (
                <div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:12,color:c.textSec,padding:"4px 0"}}>{s.name}</div>
                  <input type="number" value={s.drx||""} step="0.001" min={0}
                    placeholder="—"
                    onChange={e => structural.updateStory(s.id, "drx", e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.blue}44`,
                      borderRadius:6,padding:"5px 7px",color:c.blue,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <input type="number" value={s.dry||""} step="0.001" min={0}
                    placeholder="—"
                    onChange={e => structural.updateStory(s.id, "dry", e.target.value)}
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
                {label:"Périodes Tx/Ty",     ok:!!(seismic.Tx && seismic.Ty)},
                {label:"Efforts Vxd/Vyd",    ok:!!(seismic.Vxd && seismic.Vyd)},
                {label:"Déplacements drx",   ok:structural.stories.some(s => s.drx)},
                {label:"Déplacements dry",   ok:structural.stories.some(s => s.dry)},
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
