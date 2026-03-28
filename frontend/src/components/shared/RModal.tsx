/**
 * RModal — Coefficient de Comportement R (Phase 6: Atlas theme)
 * RPA 2024 §3.5 — Table 3.18
 */
import { useState } from "react"

// ── Static data ───────────────────────────────────────────────────────────────

interface ForceRatios { ossature: number; voiles: number }

export interface BracingSystem {
  id: number;
  label: string;
  desc: string;
  R: number;
  qfCat: string;
  detect: ((r: ForceRatios) => boolean) | null;
}

export const SYSTEMS: BracingSystem[] = [
  { id:1, label:"Système 1 — Ossature",           desc:"Ossature (portiques). Vossature > 65% Vbase.",                          R:5.5, qfCat:"a", detect: r => r.ossature > 0.65 },
  { id:2, label:"Système 2 — Mixte équiv. ossature", desc:"Mixte. L'ossature reprend 50% à 65% de l'effort tranchant.",        R:5.5, qfCat:"a", detect: r => r.ossature >= 0.50 && r.ossature <= 0.65 },
  { id:3, label:"Système 3 — Ossature + remplissage",desc:"Ossature ou mixte avec remplissage en maçonnerie rigide (≤ 10 cm).", R:3.5, qfCat:"a", detect: null },
  { id:4, label:"Système 4 — Mixte équiv. voiles",   desc:"Les voiles reprennent 50% à 65% de l'effort tranchant.",            R:4.5, qfCat:"b", detect: r => r.voiles >= 0.50 && r.voiles <= 0.65 },
  { id:5, label:"Système 5 — Voiles",                desc:"Contreventement par voiles. Vvoiles > 65% Vbase.",                   R:4.5, qfCat:"b", detect: r => r.voiles > 0.65 },
  { id:6, label:"Système 6 — Noyau / Effet noyau",   desc:"Système à noyau ou à effet noyau. rx, ry ≤ rayon de giration ls.",  R:3.0, qfCat:"b", detect: null },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface RModalProps {
  onClose: () => void;
  onValidate: (r: number | undefined, sys: BracingSystem | null | undefined) => void;
  initSystem: number;
  /** @deprecated will be removed in next cleanup pass */
  c?: unknown;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RModal({ onClose, onValidate, initSystem }: RModalProps) {
  const [tab,    setTab]    = useState<string>("manual")
  const [selSys, setSelSys] = useState<number>(initSystem || 1)
  const [Voss,   setVoss]   = useState<string>("")
  const [Vvoi,   setVvoi]   = useState<string>("")
  const [Vtot,   setVtot]   = useState<string>("")
  const [detSys, setDetSys] = useState<BracingSystem | null>(null)

  const activeSys = tab === "manual"
    ? SYSTEMS.find(s => s.id === selSys)
    : detSys

  function detectFromForces() {
    const vo = parseFloat(Voss), vv = parseFloat(Vvoi), vt = parseFloat(Vtot)
    if (isNaN(vt) || vt <= 0) return
    const ratio: ForceRatios = { ossature:(isNaN(vo)?0:vo)/vt, voiles:(isNaN(vv)?0:vv)/vt }
    setDetSys(SYSTEMS.find(s => s.detect && s.detect(ratio)) ?? null)
  }

  const inputCls = `w-full px-2.5 py-2 rounded-md text-sm font-mono outline-none transition-colors
    bg-atlas-bg dark:bg-atlas-dark-bg
    border border-atlas-border dark:border-atlas-dark-border
    text-atlas-text dark:text-atlas-dark-text
    focus:border-atlas-gold focus:ring-1 focus:ring-atlas-gold/20`

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-atlas-info font-semibold mb-0.5">
              RPA 2024 — §3.5 — Table 3.18
            </div>
            <h2 className="text-[17px] font-bold text-atlas-text dark:text-atlas-dark-text">
              Coefficient de Comportement R
            </h2>
            <p className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">
              Identification du système de contreventement
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="text-atlas-text-muted dark:text-atlas-dark-text-muted hover:text-atlas-text dark:hover:text-atlas-dark-text text-xl leading-none transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        {/* ── Mode tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-1.5 mb-4">
          {[{id:"manual",l:"🏗️ Sélection manuelle"},
            {id:"forces",l:"📊 Par effort tranchant"}].map(t => (
            <button type="button" key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                tab === t.id
                  ? 'border-atlas-gold bg-atlas-gold/15 text-atlas-gold font-bold'
                  : 'border-atlas-border dark:border-atlas-dark-border bg-atlas-bg dark:bg-atlas-dark-bg text-atlas-text-sec dark:text-atlas-dark-text-sec hover:border-atlas-gold/40'
              }`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── Manual selection ───────────────────────────────────────── */}
        {tab === "manual" && (
          <div className="mb-4">
            {SYSTEMS.map(sys => (
              <div key={sys.id} onClick={() => setSelSys(sys.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer mb-1.5 border transition-colors ${
                  selSys === sys.id
                    ? 'bg-atlas-gold/8 border-atlas-gold/40'
                    : 'bg-atlas-bg dark:bg-atlas-dark-bg border-atlas-border dark:border-atlas-dark-border hover:border-atlas-gold/30'
                }`}>
                {/* Radio dot */}
                <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 flex items-center justify-center text-[11px] font-bold text-white transition-colors ${
                  selSys === sys.id
                    ? 'bg-atlas-gold border-atlas-gold'
                    : 'bg-transparent border-atlas-border dark:border-atlas-dark-border'
                }`}>
                  {selSys === sys.id ? "●" : ""}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-atlas-text dark:text-atlas-dark-text mb-0.5">
                    {sys.label}
                    <span className={`ml-2 text-[11px] rounded px-1.5 py-0.5 ${
                      sys.qfCat === 'a'
                        ? 'text-atlas-info bg-atlas-info/15'
                        : 'text-atlas-text-sec dark:text-atlas-dark-text-sec bg-atlas-border/50 dark:bg-atlas-dark-border/50'
                    }`}>
                      Cat. ({sys.qfCat})
                    </span>
                  </div>
                  <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted leading-relaxed">
                    {sys.desc}
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-atlas-gold flex-shrink-0">
                  R={sys.R}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Detection by forces ────────────────────────────────────── */}
        {tab === "forces" && (
          <div className="mb-4">
            {/* Connection status */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg mb-4 bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-border dark:border-atlas-dark-border">
              <div className="w-2 h-2 rounded-full bg-atlas-text-muted dark:bg-atlas-dark-text-muted flex-shrink-0"/>
              <span className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted flex-1">
                Robot non connecté — import automatique indisponible
              </span>
              <button type="button" disabled
                className="px-2.5 py-1 rounded text-[11px] bg-atlas-border/50 dark:bg-atlas-dark-border text-atlas-text-muted dark:text-atlas-dark-text-muted cursor-not-allowed">
                Connecter
              </button>
            </div>

            {/* Force inputs */}
            <div className="flex gap-2.5 mb-3">
              {([{label:"V ossature (kN)",val:Voss,set:setVoss},
                 {label:"V voiles (kN)",  val:Vvoi,set:setVvoi},
                 {label:"V total (kN)",   val:Vtot,set:setVtot}] as const).map(f => (
                <div key={f.label} className="flex-1">
                  <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mb-1">{f.label}</div>
                  <input type="number" min={0} value={f.val}
                    onChange={e => f.set(e.target.value)}
                    className={inputCls}/>
                </div>
              ))}
            </div>

            <button type="button" onClick={detectFromForces}
              className="w-full py-2.5 mb-2.5 rounded-lg text-sm font-bold transition-colors cursor-pointer
                bg-atlas-topbar dark:bg-atlas-dark-topbar text-atlas-gold border border-atlas-gold/40 hover:bg-atlas-topbar/80">
              Détecter le système automatiquement
            </button>

            {detSys ? (
              <div className="px-3 py-2.5 rounded-lg bg-atlas-success/10 border border-atlas-success/30">
                <div className="text-xs text-atlas-success mb-0.5">✅ Système identifié</div>
                <div className="text-sm font-bold text-atlas-text dark:text-atlas-dark-text">{detSys.label}</div>
              </div>
            ) : (Voss || Vvoi || Vtot) ? (
              <div className="px-3 py-2.5 rounded-lg text-xs bg-atlas-warning/10 border border-atlas-warning/30 text-atlas-warning">
                ⚠️ Système 3 ou 6 — sélection manuelle requise
              </div>
            ) : null}
          </div>
        )}

        {/* ── Active system summary ──────────────────────────────────── */}
        {activeSys && (
          <div className="flex items-center gap-4 bg-atlas-bg dark:bg-atlas-dark-bg border border-atlas-gold/30 rounded-xl px-4 py-3 mb-4">
            <div className="flex-1">
              <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mb-0.5">
                Valeur R — {activeSys.label}
              </div>
              <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted">
                Cat. Q<sub>F</sub> :&nbsp;
                <b className={activeSys.qfCat === 'a' ? 'text-atlas-info' : 'text-atlas-text-sec dark:text-atlas-dark-text-sec'}>
                  ({activeSys.qfCat})
                </b>
              </div>
            </div>
            <div className="text-5xl font-bold font-mono text-atlas-gold">{activeSys.R}</div>
          </div>
        )}

        {/* ── Validate button ────────────────────────────────────────── */}
        <button type="button"
          onClick={() => onValidate(activeSys?.R, activeSys)}
          disabled={!activeSys}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition-colors
            bg-atlas-gold text-atlas-green hover:bg-atlas-gold/90
            disabled:opacity-50 disabled:cursor-not-allowed">
          {activeSys ? `Valider R = ${activeSys.R}` : "Sélectionner un système d'abord"}
        </button>
      </div>
    </div>
  )
}
