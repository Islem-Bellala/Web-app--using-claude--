/**
 * QFModal — Facteur de Qualité QF (Phase 6: Atlas theme)
 * RPA 2024 §3.8 — Table 3.19
 */
import { useState, useMemo } from "react"

// ── Static data ───────────────────────────────────────────────────────────────

interface QfCriterion { id: string; label: string; pq: number }

export const QF_CRITERIA: Record<string, QfCriterion[]> = {
  a:[
    {id:"a1", label:"Régularité en plan",             pq:0.05},
    {id:"a2", label:"Régularité en élévation",        pq:0.20},
    {id:"a3", label:"Conditions min. niveaux (≥ 2)",  pq:0.20},
    {id:"a4", label:"Conditions min. travées (≥ 3)",  pq:0.10},
  ],
  b:[
    {id:"b1", label:"Régularité en plan",             pq:0.05},
    {id:"b2", label:"Régularité en élévation",        pq:0.20},
    {id:"b3", label:"Redondance en plan (≥ 2 files)", pq:0.05},
  ],
  c:[],
}
export const QF_MAX: Record<string, number> = { a:1.35, b:1.30, c:1.0 }
export const DEF_CHECKED: Record<string, boolean> = {a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true}

// ── Props ─────────────────────────────────────────────────────────────────────

interface QFModalProps {
  onClose: () => void;
  onValidate: (qf: number, cat: string, chk: Record<string, boolean>) => void;
  initCat: string;
  initChecked: Record<string, boolean>;
  /** @deprecated will be removed in next cleanup pass */
  c?: unknown;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QFModal({ onClose, onValidate, initCat, initChecked }: QFModalProps) {
  const [cat, setCat] = useState<string>(initCat || "a")
  const [chk, setChk] = useState<Record<string, boolean>>(initChecked || DEF_CHECKED)
  const criteria = QF_CRITERIA[cat]

  const qf = useMemo(() => {
    if (cat === "c") return 1.0
    let t = 1.0
    criteria.forEach(cr => { if (!chk[cr.id]) t += cr.pq })
    return +Math.min(t, QF_MAX[cat]).toFixed(2)
  }, [cat, chk, criteria])

  function changeCat(c2: string) {
    setCat(c2)
    const r: Record<string, boolean> = {}
    QF_CRITERIA[c2].forEach(cr => { r[cr.id] = true })
    setChk(r)
  }

  const qfColor = qf <= 1.05 ? 'text-atlas-success' : qf <= 1.20 ? 'text-atlas-warning' : 'text-atlas-danger'

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-atlas-card dark:bg-atlas-dark-card border border-atlas-card-border dark:border-atlas-dark-card-border rounded-xl p-6 shadow-2xl">

        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] text-atlas-info font-semibold mb-0.5">
              RPA 2024 — §3.8 — Table 3.19
            </div>
            <h2 className="text-[17px] font-bold text-atlas-text dark:text-atlas-dark-text">
              Facteur de Qualité Q<sub>F</sub>
            </h2>
            <p className="text-xs text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">
              Q<sub>F</sub> = 1 + Σ P<sub>q</sub>
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="text-atlas-text-muted dark:text-atlas-dark-text-muted hover:text-atlas-text dark:hover:text-atlas-dark-text text-xl leading-none transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        {/* ── Category tabs ──────────────────────────────────────────── */}
        <div className="flex gap-1.5 mb-3.5">
          {[{id:"a",l:"(a) Ossatures",s:"Syst. 1,2,3"},
            {id:"b",l:"(b) Voiles",   s:"Syst. 4,5,6"},
            {id:"c",l:"(c) Spécial",  s:"QF = 1.0"}].map(ct => (
            <button type="button" key={ct.id} onClick={() => changeCat(ct.id)}
              className={`flex-1 py-1.5 px-1 rounded-lg text-xs text-center transition-colors cursor-pointer border ${
                cat === ct.id
                  ? 'border-atlas-gold bg-atlas-gold/15 text-atlas-gold font-bold'
                  : 'border-atlas-border dark:border-atlas-dark-border bg-atlas-bg dark:bg-atlas-dark-bg text-atlas-text-sec dark:text-atlas-dark-text-sec hover:border-atlas-gold/40'
              }`}>
              <div className="font-semibold">{ct.l}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{ct.s}</div>
            </button>
          ))}
        </div>

        {/* ── Criteria list ──────────────────────────────────────────── */}
        {cat === "c" ? (
          <div className="mb-3.5 py-3 text-center text-sm rounded-lg bg-atlas-success/10 border border-atlas-success/30 text-atlas-success">
            Aucune pénalité — <b>Q<sub>F</sub> = 1.0</b>
          </div>
        ) : (
          <div className="mb-3.5">
            <p className="text-[11px] uppercase tracking-[0.07em] text-atlas-text-muted dark:text-atlas-dark-text-muted mb-2">
              ✅ Satisfait = pas de pénalité
            </p>
            {criteria.map(cr => (
              <div key={cr.id}
                onClick={() => setChk(p => ({...p,[cr.id]:!p[cr.id]}))}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer mb-1.5 border transition-colors ${
                  chk[cr.id]
                    ? 'bg-atlas-success/8 border-atlas-success/30'
                    : 'bg-atlas-danger/8 border-atlas-danger/30'
                }`}>
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold text-white border-2 transition-colors ${
                  chk[cr.id]
                    ? 'bg-atlas-success border-atlas-success'
                    : 'bg-transparent border-atlas-danger'
                }`}>
                  {chk[cr.id] ? "✓" : ""}
                </div>
                <div className="flex-1 text-sm text-atlas-text dark:text-atlas-dark-text">{cr.label}</div>
                <div className={`text-sm font-mono font-bold ${chk[cr.id] ? 'text-atlas-success' : 'text-atlas-danger'}`}>
                  {chk[cr.id] ? "+0.00" : `+${cr.pq.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── QF result display ──────────────────────────────────────── */}
        <div className="flex items-center gap-4 bg-atlas-bg dark:bg-atlas-dark-bg rounded-xl px-4 py-3 mb-4">
          <div className="flex-1">
            <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mb-0.5">
              Q<sub>F</sub> résultant
            </div>
            <div className={`text-4xl font-bold font-mono ${qfColor}`}>
              {qf.toFixed(2)}
            </div>
            <div className="text-[11px] text-atlas-text-muted dark:text-atlas-dark-text-muted mt-0.5">
              Plage : 1.00 ≤ Q<sub>F</sub> ≤ {QF_MAX[cat]}
            </div>
          </div>
          <div className="text-5xl">{qf <= 1.05 ? "✅" : qf <= 1.20 ? "⚠️" : "🔴"}</div>
        </div>

        {/* ── Validate button ────────────────────────────────────────── */}
        <button type="button" onClick={() => onValidate(qf, cat, chk)}
          className="w-full py-2.5 rounded-lg text-sm font-bold transition-colors
            bg-atlas-gold text-atlas-green hover:bg-atlas-gold/90 cursor-pointer">
          Valider Q<sub>F</sub> = {qf.toFixed(2)}
        </button>
      </div>
    </div>
  )
}
