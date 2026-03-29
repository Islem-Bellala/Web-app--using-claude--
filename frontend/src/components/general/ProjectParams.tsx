/**
 * Bunyan — Paramètres Généraux (Phase 3)
 * Reads from Zustand stores — no more props drilling.
 *
 * Block 1 — Identification          (facultatif, auto-generated)
 * Block 2 — Paramètres sismiques    (wilaya -> zone, site, groupe, QF, R)
 * Block 3 — Géométrie et masses     (table des niveaux)
 * Block 4 — Résultats analyse dyn.  (Tx, Ty, Vxd, Vyd, déplacements)
 */

import { useState, useEffect } from "react"
import QFModal, { DEF_CHECKED } from "../shared/QFModal"
import RModal, { type BracingSystem } from "../shared/RModal"
import type { AppColors } from "../../types"
import { useProjectStore, useSeismicStore, useStructuralStore } from "../../stores"

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

  // Fetch wilayas on mount if not already loaded
  useEffect(() => {
    if (project.wilayas.length === 0) {
      project.fetchWilayas()
    }
  }, [])

  // Current wilaya info from store
  const wilaya = project.wilayas.find(w => w.code === project.wilayaCode)
  const hasCommunes = project.communes.length > 0

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

  // Card style shared by all columns
  const cardStyle: React.CSSProperties = {
    background: c.surface, border: `1px solid ${c.border}`,
    borderRadius: 14, padding: 16,
    height: '100%', overflowY: 'auto', boxSizing: 'border-box',
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: c.bg, overflow: 'hidden',
      fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      transition: 'background 0.2s',
    }}>

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

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 16px 12px', flexShrink: 0 }}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:4,fontWeight:600}}>
          BUNYAN — PARAMÈTRES
        </div>
        <h1 style={{fontSize:20,fontWeight:700,margin:0,color:c.text}}>
          Paramètres Généraux
        </h1>
        <div style={{color:c.textSec,fontSize:12,marginTop:2}}>
          Définis une fois — utilisés par tous les modules de vérification
        </div>
      </div>

      {/* ── Body: Row 1 + Row 2 ─────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', gap: 10, padding: '0 12px 12px',
        minHeight: 0,
      }}>

        {/* ── ROW 1: Three input columns (~58% height) ──────────────────────── */}
        <div style={{
          flex: '0 0 58%', display: 'flex', gap: 10,
          overflow: 'hidden', minHeight: 0,
        }}>

          {/* Col 1 — Identification */}
          <div style={{ width: 210, flexShrink: 0 }}>
            <div style={cardStyle}>
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
          </div>

          {/* Col 2 — Paramètres sismiques */}
          <div style={{ width: 250, flexShrink: 0 }}>
            <div style={cardStyle}>
              <BlockHeader title="2 — Paramètres sismiques" color={c.blue} c={c}/>

              {/* Wilaya */}
              <Field label="Wilaya" c={c}>
                <select value={project.wilayaCode} onChange={e => project.setWilaya(e.target.value)}
                  disabled={project.wilayasLoading}
                  style={inputStyle}>
                  {project.wilayas.map(w => (
                    <option key={w.code} value={w.code}>{w.code} — {w.name}</option>
                  ))}
                </select>
              </Field>

              {/* Commune — only if split wilaya with communes */}
              {wilaya?.has_split_zones && hasCommunes && (
                <Field label="Commune" c={c}>
                  <select value={project.commune} onChange={e => project.setCommune(e.target.value)}
                    disabled={project.communesLoading} title="Commune"
                    style={{...inputStyle,border:`1px solid ${c.amber}66`}}>
                    <option value="">— Autre commune (Zone {wilaya.zone})</option>
                    {[...project.communes]
                      .sort((a,b) => a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name))
                      .map(cm => (
                        <option key={cm.name} value={cm.name}>{cm.name} → Zone {cm.zone}</option>
                      ))}
                  </select>
                </Field>
              )}
              {wilaya?.has_split_zones && !hasCommunes && !project.communesLoading && (
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
                  title="Groupe d'importance" style={inputStyle}>
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
                  title="Système pour période T" style={inputStyle}>
                  {FRAME_SYSTEMS.map(f => (
                    <option key={f.v} value={f.v}>{f.ct} — {f.l.split(" ").slice(0,4).join(" ")}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          {/* Col 3 — Géométrie et masses */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={cardStyle}>
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
                overflowY:"auto",marginBottom:10,maxHeight:"calc(100% - 200px)"}}>
                {structural.stories.map(s => (
                  <div key={s.id} style={{display:"grid",
                    gridTemplateColumns:"1fr 65px 75px 28px",gap:6,alignItems:"center"}}>
                    <input value={s.name} title="Nom du niveau" placeholder="Niveau"
                      onChange={e => structural.updateStory(s.id, "name", e.target.value)}
                      style={{background:c.elevated,border:`1px solid ${c.border}`,
                        borderRadius:6,padding:"6px 7px",color:c.text,fontSize:12,
                        outline:"none",width:"100%"}}/>
                    <input type="number" value={s.elevation} min={0} step={0.5}
                      title="Hauteur (m)" placeholder="h"
                      onChange={e => structural.updateStory(s.id, "elevation", e.target.value)}
                      style={{background:c.elevated,border:`1px solid ${c.border}`,
                        borderRadius:6,padding:"6px 7px",color:c.purple,
                        fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                    <input type="number" value={s.weight} min={0}
                      title="Poids (kN)" placeholder="W"
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
        </div>

        {/* ── ROW 2: Full-width results ────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
          <div style={{
            background: c.surface, border: `1px solid ${c.border}`,
            borderRadius: 14, padding: 16,
            height: '100%', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxSizing: 'border-box',
          }}>
            <BlockHeader title="4 — Résultats analyse dynamique" color={c.amber} c={c}/>

            {/* Import status bar */}
            <div style={{background:c.elevated,border:`1px solid ${c.border}`,
              borderRadius:8,padding:"8px 13px",marginBottom:12,flexShrink:0,
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

            {/* Main content: side by side */}
            <div style={{ flex: 1, display: 'flex', gap: 16, overflow: 'hidden', minHeight: 0 }}>

              {/* Left: Périodes + Efforts + Status */}
              <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Periods and dynamic shear 2×2 */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
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

                {/* Status summary */}
                <div style={{background:c.elevated,borderRadius:8,padding:"10px 12px"}}>
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

              {/* Right: Déplacements inter-étages table */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                <div style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
                  textTransform:"uppercase",fontWeight:600,marginBottom:8,flexShrink:0}}>
                  Déplacements inter-étages relatifs (cm)
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",
                  gap:6,marginBottom:6,flexShrink:0}}>
                  {["Niveau","drx (cm)","dry (cm)"].map(h => (
                    <div key={h} style={{fontSize:10,color:c.textMuted,
                      textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{h}</div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,overflowY:"auto",flex:1}}>
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
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
