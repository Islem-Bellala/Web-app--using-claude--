/**
 * Bunyan — Paramètres Généraux (Phase 6: Atlas theme)
 * All data from Zustand stores. No color prop — all Tailwind.
 */

import { useState, useEffect } from "react"
import QFModal, { DEF_CHECKED } from "../shared/QFModal"
import RModal, { type BracingSystem } from "../shared/RModal"
import { useProjectStore, useSeismicStore, useStructuralStore } from "../../stores"

const ZONE_LABELS: Record<string, string> = {
  "0":"Zone 0 — Très faible",
  "I":"Zone I (0.07g)","II":"Zone II (0.10g)","III":"Zone III (0.15g)",
  "IV":"Zone IV (0.20g)","V":"Zone V (0.25g)","VI":"Zone VI (0.30g)",
}

const FRAME_SYSTEMS = [
  {v:"ba_no_infill",    l:"Ossature BA sans remplissage",        ct:"CT=0.075"},
  {v:"steel_no_infill", l:"Ossature acier sans remplissage",     ct:"CT=0.085"},
  {v:"ba_with_infill",  l:"Ossature BA/acier avec remplissage",  ct:"CT=0.050"},
  {v:"other",           l:"Autres systèmes",                     ct:"CT=0.050"},
]

// ── Shared sub-components ─────────────────────────────────────────────────────

function CardHeader({ title, accent = 'gold' }: { title: string; accent?: 'gold' | 'green' | 'blue' | 'amber' | 'muted' }) {
  const cls = {
    gold:  'text-atlas-gold',
    green: 'text-atlas-success',
    blue:  'text-atlas-info',
    amber: 'text-atlas-warning',
    muted: 'text-atlas-text-muted dark:text-atlas-dark-text-muted',
  }[accent]
  return (
    <div className={`text-[11px] uppercase tracking-[0.08em] font-bold mb-3 ${cls}`}>
      {title}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] uppercase tracking-[0.06em] font-semibold
      text-atlas-text-sec dark:text-atlas-dark-text-sec mb-1">
      {children}
    </label>
  )
}

const inputCls = `w-full px-2.5 py-2 rounded-md text-[13px] outline-none transition-colors
  bg-atlas-bg dark:bg-atlas-dark-bg
  border border-atlas-border dark:border-atlas-dark-border
  text-atlas-text dark:text-atlas-dark-text
  focus:border-atlas-gold focus:ring-1 focus:ring-atlas-gold/20`

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectParams() {
  const project    = useProjectStore()
  const seismic    = useSeismicStore()
  const structural = useStructuralStore()

  const [showQF, setShowQF] = useState<string | null>(null)
  const [showR,  setShowR]  = useState<string | null>(null)

  useEffect(() => {
    if (project.wilayas.length === 0) project.fetchWilayas()
  }, [])

  const wilaya    = project.wilayas.find(w => w.code === project.wilayaCode)
  const hasCommunes = project.communes.length > 0
  const isZone0   = project.zone === "0"

  const totalW = structural.stories.reduce((a, s) => a + (parseFloat(s.weight) || 0), 0)
  const hn     = structural.stories.length
    ? Math.max(...structural.stories.map(s => parseFloat(s.elevation) || 0))
    : 0

  function handleQFValidate(qf: number, cat: string, chk: Record<string, boolean>) {
    if (showQF === "x")      seismic.setQFParams({ QFx: qf, qfCatX: cat, qfChkX: chk })
    else if (showQF === "y") seismic.setQFParams({ QFy: qf, qfCatY: cat, qfChkY: chk })
    else                     seismic.setQFParams({ QF: qf, qfCat: cat, qfChk: chk })
    setShowQF(null)
  }

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

  return (
    <div className="p-5 min-h-full bg-atlas-bg dark:bg-atlas-dark-bg text-atlas-text dark:text-atlas-dark-text">

      {/* Modals */}
      {showQF && (
        <QFModal
          initCat={showQF==="x" ? seismic.qfCatX : showQF==="y" ? seismic.qfCatY : seismic.qfCat}
          initChecked={showQF==="x" ? seismic.qfChkX : showQF==="y" ? seismic.qfChkY : seismic.qfChk}
          onClose={() => setShowQF(null)}
          onValidate={handleQFValidate}/>
      )}
      {showR && (
        <RModal
          initSystem={showR==="x" ? seismic.selSysX : showR==="y" ? seismic.selSysY : seismic.selSys}
          onClose={() => setShowR(null)}
          onValidate={handleRValidate}/>
      )}

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.12em] text-atlas-gold font-semibold mb-1">
          Bunyan — Paramètres
        </div>
        <h1 className="text-xl font-bold text-atlas-text dark:text-atlas-dark-text">
          Paramètres Généraux
        </h1>
        <p className="text-xs text-atlas-text-sec dark:text-atlas-dark-text-sec mt-1">
          Définis une fois — utilisés par tous les modules de vérification
        </p>
      </div>

      <div className="flex gap-4 flex-wrap items-start">

        {/* ── COL 1: Identification + Sismique ────────────────────── */}
        <div className="flex flex-col gap-3.5 w-60 shrink-0">

          {/* Card: Identification */}
          <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl p-4">
            <CardHeader title="1 — Identification" accent="muted" />
            <p className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mb-3 italic">
              Facultatif — généré automatiquement si vide
            </p>

            {(['projectName', 'engineer', 'reference'] as const).map((key, i) => (
              <div key={key} className="mb-2.5">
                <FieldLabel>
                  {['Nom du projet', 'Ingénieur', 'Référence'][i]}
                </FieldLabel>
                <input type="text"
                  value={project[key]}
                  onChange={e => project.setProjectMeta({ [key]: e.target.value })}
                  placeholder={key === 'projectName' ? `Projet_${project.date}` : key === 'engineer' ? "Nom de l'ingénieur" : 'Réf. dossier'}
                  className={inputCls}
                />
              </div>
            ))}

            <div className="mb-0">
              <FieldLabel>Date</FieldLabel>
              <div className="px-2.5 py-2 rounded-md text-[13px] bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border text-atlas-text-muted dark:text-atlas-dark-text-muted">
                {project.date}
              </div>
            </div>
          </div>

          {/* Card: Paramètres sismiques */}
          <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl p-4 border-l-[3px] border-l-atlas-info">
            <CardHeader title="2 — Paramètres sismiques" accent="blue" />

            {/* Wilaya */}
            <div className="mb-2.5">
              <FieldLabel>Wilaya</FieldLabel>
              <select value={project.wilayaCode} onChange={e => project.setWilaya(e.target.value)}
                disabled={project.wilayasLoading} title="Wilaya"
                className={inputCls}>
                {project.wilayas.map(w => (
                  <option key={w.code} value={w.code}>{w.code} — {w.name}</option>
                ))}
              </select>
            </div>

            {/* Commune */}
            {wilaya?.has_split_zones && hasCommunes && (
              <div className="mb-2.5">
                <FieldLabel>Commune</FieldLabel>
                <select value={project.commune} onChange={e => project.setCommune(e.target.value)}
                  disabled={project.communesLoading} title="Commune"
                  className={`${inputCls} border-atlas-warning/50`}>
                  <option value="">— Autre commune (Zone {wilaya.zone})</option>
                  {[...project.communes]
                    .sort((a,b) => a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name))
                    .map(cm => (
                      <option key={cm.name} value={cm.name}>{cm.name} → Zone {cm.zone}</option>
                    ))}
                </select>
              </div>
            )}
            {wilaya?.has_split_zones && !hasCommunes && !project.communesLoading && (
              <div className="mb-2.5 px-3 py-2 rounded-md text-[11px] leading-relaxed text-atlas-warning bg-atlas-warning/10 border border-atlas-warning/30">
                ⚠️ Wilaya partagée — consulter l'Annexe A du RPA 2024
              </div>
            )}

            {/* Zone badge */}
            <div className={`mb-2.5 px-3 py-2 rounded-md border ${
              isZone0
                ? 'bg-atlas-warning/10 border-atlas-warning/30'
                : 'bg-atlas-info/10 border-atlas-info/30'
            }`}>
              <div className="text-[10px] uppercase tracking-[0.06em] text-atlas-text-muted dark:text-atlas-dark-text-muted mb-0.5">
                Zone sismique
              </div>
              <div className={`text-sm font-bold ${isZone0 ? 'text-atlas-warning' : 'text-atlas-info'}`}>
                {ZONE_LABELS[project.zone] || project.zone}
              </div>
            </div>

            {/* Site class */}
            <div className="mb-2.5">
              <FieldLabel>Classe de site</FieldLabel>
              <div className="flex gap-1">
                {["S1","S2","S3","S4"].map(s => (
                  <button type="button" key={s} onClick={() => project.setSite(s)}
                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                      project.site === s
                        ? 'border-atlas-gold bg-atlas-gold/15 text-atlas-gold font-bold'
                        : 'border-atlas-border dark:border-atlas-dark-border bg-atlas-bg dark:bg-atlas-dark-bg text-atlas-text-sec dark:text-atlas-dark-text-sec hover:border-atlas-gold/40'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Importance group */}
            <div className="mb-2.5">
              <FieldLabel>Groupe d'importance</FieldLabel>
              <select value={project.group} onChange={e => project.setGroup(e.target.value)} title="Groupe d'importance" className={inputCls}>
                <option value="1A">Groupe 1A — I=1.4</option>
                <option value="1B">Groupe 1B — I=1.2</option>
                <option value="2">Groupe 2 — I=1.0</option>
                <option value="3">Groupe 3 — I=0.8</option>
              </select>
            </div>

            {/* Direction toggle */}
            <div className="mb-2.5">
              <FieldLabel>Directions d'analyse</FieldLabel>
              <div className="flex gap-1.5">
                {[
                  { label: 'Direction unique', val: false },
                  { label: 'X et Y séparées', val: true },
                ].map(opt => (
                  <button type="button" key={String(opt.val)} onClick={() => seismic.setTwoDir(opt.val)}
                    className={`flex-1 py-1.5 px-2 rounded-md text-[11px] border transition-colors ${
                      seismic.twoDir === opt.val
                        ? 'border-atlas-gold bg-atlas-gold/15 text-atlas-gold font-semibold'
                        : 'border-atlas-border dark:border-atlas-dark-border text-atlas-text-sec dark:text-atlas-dark-text-sec hover:border-atlas-gold/40 bg-atlas-bg dark:bg-atlas-dark-bg'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* QF and R */}
            {!seismic.twoDir ? (
              <>
                <div className="mb-2.5">
                  <FieldLabel>Facteur qualité QF</FieldLabel>
                  <button type="button" onClick={() => setShowQF("single")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border cursor-pointer transition-colors bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/50">
                    <span>Q<sub>F</sub> = <b className="text-atlas-warning">{seismic.QF.toFixed(2)}</b></span>
                    <span className="text-[11px] text-atlas-info">Calculer →</span>
                  </button>
                </div>
                <div className="mb-2.5">
                  <FieldLabel>Coeff. comportement R</FieldLabel>
                  <button type="button" onClick={() => setShowR("single")}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] border cursor-pointer transition-colors bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/50">
                    <span>R = <b className="text-atlas-danger">{seismic.R}</b></span>
                    <span className="text-[11px] text-atlas-info">Identifier →</span>
                  </button>
                  <p className="text-[11px] text-atlas-text-sec dark:text-atlas-dark-text-sec mt-1 pl-0.5">
                    Syst. {seismic.selSys} · Cat. Q<sub>F</sub> ({seismic.qfCat})
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Direction X */}
                <div className="mb-2 p-2.5 rounded-md bg-atlas-info/8 border border-atlas-info/25">
                  <div className="text-[11px] text-atlas-info font-bold uppercase tracking-[0.06em] mb-2">Direction X</div>
                  <button type="button" onClick={() => setShowQF("x")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded mb-1.5 text-[12px] border cursor-pointer bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/50">
                    <span>Q<sub>Fx</sub> = <b className="text-atlas-warning">{seismic.QFx.toFixed(2)}</b></span>
                    <span className="text-[11px] text-atlas-info">Calculer →</span>
                  </button>
                  <button type="button" onClick={() => setShowR("x")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] border cursor-pointer bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/50">
                    <span>Rx = <b className="text-atlas-danger">{seismic.Rx}</b></span>
                    <span className="text-[11px] text-atlas-info">Identifier →</span>
                  </button>
                </div>
                {/* Direction Y */}
                <div className="mb-2.5 p-2.5 rounded-md bg-atlas-info/5 border border-atlas-info/15">
                  <div className="text-[11px] text-atlas-text-sec dark:text-atlas-dark-text-sec font-bold uppercase tracking-[0.06em] mb-2">Direction Y</div>
                  <button type="button" onClick={() => setShowQF("y")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded mb-1.5 text-[12px] border cursor-pointer bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/50">
                    <span>Q<sub>Fy</sub> = <b className="text-atlas-warning">{seismic.QFy.toFixed(2)}</b></span>
                    <span className="text-[11px] text-atlas-info">Calculer →</span>
                  </button>
                  <button type="button" onClick={() => setShowR("y")}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[12px] border cursor-pointer bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/50">
                    <span>Ry = <b className="text-atlas-danger">{seismic.Ry}</b></span>
                    <span className="text-[11px] text-atlas-info">Identifier →</span>
                  </button>
                </div>
              </>
            )}

            {/* Frame system */}
            <div>
              <FieldLabel>Système pour période T (CT)</FieldLabel>
              <select value={seismic.frameSys} onChange={e => seismic.setField('frameSys', e.target.value)} title="Système structurel" className={inputCls}>
                {FRAME_SYSTEMS.map(f => (
                  <option key={f.v} value={f.v}>{f.ct} — {f.l.split(" ").slice(0,4).join(" ")}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── COL 2: Géométrie et masses ───────────────────────────── */}
        <div className="w-[300px] shrink-0">
          <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl p-4 border-l-[3px] border-l-atlas-success">
            <CardHeader title="3 — Géométrie et masses" accent="green" />

            {/* Column headers */}
            <div className="grid gap-1.5 mb-1.5 text-[10px] uppercase tracking-[0.06em] font-semibold text-atlas-text-muted dark:text-atlas-dark-text-muted [grid-template-columns:1fr_65px_75px_28px]">
              {["Niveau","h (m)","W (kN)",""].map((h,i) => <div key={i}>{h}</div>)}
            </div>

            {/* Story rows */}
            <div className="flex flex-col gap-1.5 mb-2.5 max-h-80 overflow-y-auto">
              {structural.stories.map(s => (
                <div key={s.id} className="grid gap-1.5 items-center [grid-template-columns:1fr_65px_75px_28px]">
                  <input value={s.name} title="Nom du niveau"
                    onChange={e => structural.updateStory(s.id, "name", e.target.value)}
                    className="px-2 py-1.5 rounded text-[12px] outline-none bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border text-atlas-text dark:text-atlas-dark-text focus:border-atlas-gold w-full"/>
                  <input type="number" value={s.elevation} min={0} step={0.5} title="Hauteur (m)"
                    onChange={e => structural.updateStory(s.id, "elevation", e.target.value)}
                    className="px-2 py-1.5 rounded text-[12px] font-mono outline-none bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border text-atlas-info focus:border-atlas-gold w-full"/>
                  <input type="number" value={s.weight} min={0} title="Poids (kN)"
                    onChange={e => structural.updateStory(s.id, "weight", e.target.value)}
                    className="px-2 py-1.5 rounded text-[12px] font-mono outline-none bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border text-atlas-success focus:border-atlas-gold w-full"/>
                  <button type="button" onClick={() => structural.removeStory(s.id)}
                    disabled={structural.stories.length <= 1}
                    className={`w-6 h-6 rounded flex items-center justify-center text-[13px] transition-colors border ${
                      structural.stories.length > 1
                        ? 'bg-atlas-danger/10 border-atlas-danger/30 text-atlas-danger hover:bg-atlas-danger/20 cursor-pointer'
                        : 'border-transparent text-atlas-text-muted dark:text-atlas-dark-text-muted cursor-default'
                    }`}>
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={() => structural.addStory()}
              className="w-full py-1.5 rounded-md text-[12px] font-semibold mb-2.5 transition-colors
                bg-atlas-success/10 border border-atlas-success/30 text-atlas-success
                hover:bg-atlas-success/20 cursor-pointer">
              + Ajouter un niveau
            </button>

            {/* Totals */}
            <div className="flex justify-between items-center px-3 py-2 rounded-md bg-atlas-bg dark:bg-atlas-dark-bg mb-1.5">
              <span className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted">Poids total W</span>
              <span className="text-sm font-bold font-mono text-atlas-success">{totalW.toFixed(0)} kN</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 rounded-md bg-atlas-bg dark:bg-atlas-dark-bg">
              <span className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted">Hauteur totale h<sub>n</sub></span>
              <span className="text-sm font-bold font-mono text-atlas-info">{hn.toFixed(1)} m</span>
            </div>
          </div>
        </div>

        {/* ── COL 3: Résultats dynamiques ──────────────────────────── */}
        <div className="flex-1 min-w-64">
          <div className="bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl p-4 border-l-[3px] border-l-atlas-warning">
            <CardHeader title="4 — Résultats analyse dynamique" accent="amber" />

            {/* Connection status */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-md mb-4 bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border">
              <div className="w-2 h-2 rounded-full bg-atlas-text-muted dark:bg-atlas-dark-text-muted flex-shrink-0" />
              <span className="text-[12px] text-atlas-text-muted dark:text-atlas-dark-text-muted flex-1">
                Robot / ETABS non connecté — saisie manuelle
              </span>
              <button type="button" disabled
                className="px-2.5 py-1 rounded text-[11px] bg-atlas-border/50 dark:bg-atlas-dark-border text-atlas-text-muted dark:text-atlas-dark-text-muted cursor-not-allowed">
                Importer
              </button>
            </div>

            {/* Periods and shear */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {([
                {label:"Période Tx (s)",       key:"Tx"  as const, cls:"text-atlas-info"},
                {label:"Période Ty (s)",        key:"Ty"  as const, cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec"},
                {label:"Effort dyn. Vxd (kN)", key:"Vxd" as const, cls:"text-atlas-info"},
                {label:"Effort dyn. Vyd (kN)", key:"Vyd" as const, cls:"text-atlas-text-sec dark:text-atlas-dark-text-sec"},
              ]).map(f => (
                <div key={f.key}>
                  <FieldLabel>{f.label}</FieldLabel>
                  <input type="number" value={f.val ?? seismic[f.key]} step="0.01" min={0}
                    placeholder="—"
                    onChange={e => seismic.setField(f.key, e.target.value)}
                    className={`w-full px-2.5 py-2 rounded-md text-sm font-mono outline-none transition-colors bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border focus:border-atlas-gold ${f.cls}`}/>
                </div>
              ))}
            </div>

            {/* Displacements */}
            <div className="text-[11px] uppercase tracking-[0.06em] font-semibold text-atlas-text-sec dark:text-atlas-dark-text-sec mb-2">
              Déplacements inter-étages relatifs (cm)
            </div>
            <div className="grid gap-1.5 mb-1.5 text-[10px] uppercase tracking-[0.06em] font-semibold text-atlas-text-muted dark:text-atlas-dark-text-muted [grid-template-columns:1fr_80px_80px]">
              {["Niveau","drx (cm)","dry (cm)"].map(h => <div key={h}>{h}</div>)}
            </div>
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {structural.stories.map(s => (
                <div key={s.id} className="grid gap-1.5 items-center [grid-template-columns:1fr_80px_80px]">
                  <div className="text-[12px] text-atlas-text-sec dark:text-atlas-dark-text-sec py-1">{s.name}</div>
                  <input type="number" value={s.drx||""} step="0.001" min={0} placeholder="—"
                    onChange={e => structural.updateStory(s.id, "drx", e.target.value)}
                    className="px-2 py-1 rounded text-[12px] font-mono outline-none bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-info/30 text-atlas-info focus:border-atlas-gold w-full"/>
                  <input type="number" value={s.dry||""} step="0.001" min={0} placeholder="—"
                    onChange={e => structural.updateStory(s.id, "dry", e.target.value)}
                    className="px-2 py-1 rounded text-[12px] font-mono outline-none bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border text-atlas-text-sec dark:text-atlas-dark-text-sec focus:border-atlas-gold w-full"/>
                </div>
              ))}
            </div>

            {/* Status summary */}
            <div className="mt-4 p-3 rounded-md bg-atlas-bg dark:bg-atlas-dark-bg">
              <div className="text-[11px] uppercase tracking-[0.06em] font-semibold text-atlas-text-muted dark:text-atlas-dark-text-muted mb-2">
                Données disponibles
              </div>
              {[
                {label:"Périodes Tx/Ty",   ok:!!(seismic.Tx && seismic.Ty)},
                {label:"Efforts Vxd/Vyd",  ok:!!(seismic.Vxd && seismic.Vyd)},
                {label:"Déplacements drx", ok:structural.stories.some(s => s.drx)},
                {label:"Déplacements dry", ok:structural.stories.some(s => s.dry)},
              ].map(item => (
                <div key={item.label} className={`flex items-center gap-2 text-[12px] mb-1 ${item.ok ? 'text-atlas-success' : 'text-atlas-text-muted dark:text-atlas-dark-text-muted'}`}>
                  <span>{item.ok ? "✅" : "○"}</span>
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
