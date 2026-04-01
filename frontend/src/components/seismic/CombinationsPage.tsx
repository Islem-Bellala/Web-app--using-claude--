/**
 * Bunyan — Combinaisons Sismiques
 * RPA 2024 §5.2 — Eq. 5.1–5.4
 *
 * Auto-calculates on input changes.
 * 8 combinations (E1+E2) or 24 combinations (E3+E4+E5) depending on Av·I.
 */

import { useState, useEffect, useRef } from "react"
import type { AppColors, CombinationsResponse, CombinationOut } from "../../types"
import { useProjectStore } from "../../stores"
import { computeCombinations } from "../../services/api"

// ── Row component ─────────────────────────────────────────────────────────────

interface ComboRowProps {
  combo: CombinationOut;
  idx: number;
  c: AppColors;
}

function ComboRow({ combo, idx, c }: ComboRowProps) {
  const isE1E2 = combo.seismic_id === "E1" || combo.seismic_id === "E2"
  const rowBg = isE1E2 ? c.blue + "0d" : c.purple + "0d"
  const idColor = isE1E2 ? c.blue : c.purple

  function fmtCoeff(v: number): string {
    if (v === 0) return "—"
    return v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "32px 56px 1fr 52px 52px 52px",
      gap: 6,
      alignItems: "center",
      padding: "7px 10px",
      borderRadius: 6,
      background: rowBg,
      border: `1px solid ${isE1E2 ? c.blue : c.purple}22`,
    }}>
      <div style={{ fontSize: 11, color: c.textMuted, fontFamily: "monospace", textAlign: "right" }}>
        {idx + 1}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: idColor,
        fontFamily: "monospace", textAlign: "center",
        background: idColor + "18", borderRadius: 4, padding: "2px 5px",
      }}>
        {combo.id}
      </div>
      <div style={{ fontSize: 11, color: c.text, fontFamily: "'IBM Plex Mono', monospace" }}>
        {combo.label}
      </div>
      <div style={{
        fontSize: 11, fontFamily: "monospace", textAlign: "center",
        color: combo.ex_coeff !== 0 ? c.blue : c.textMuted,
        fontWeight: combo.ex_coeff !== 0 ? 700 : 400,
      }}>
        {fmtCoeff(combo.ex_coeff)}
      </div>
      <div style={{
        fontSize: 11, fontFamily: "monospace", textAlign: "center",
        color: combo.ey_coeff !== 0 ? c.purple : c.textMuted,
        fontWeight: combo.ey_coeff !== 0 ? 700 : 400,
      }}>
        {fmtCoeff(combo.ey_coeff)}
      </div>
      <div style={{
        fontSize: 11, fontFamily: "monospace", textAlign: "center",
        color: combo.ez_coeff !== 0 ? c.amber : c.textMuted,
        fontWeight: combo.ez_coeff !== 0 ? 700 : 400,
      }}>
        {fmtCoeff(combo.ez_coeff)}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CombinationsPageProps {
  c: AppColors;
}

export default function CombinationsPage({ c }: CombinationsPageProps) {
  const project = useProjectStore()

  const [result, setResult] = useState<CombinationsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [apiErr, setApiErr] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const isReady = !!project.zone && !!project.group && project.zone !== "0"

  // Auto-calculate on input changes (400ms debounce)
  useEffect(() => {
    if (!isReady) {
      setResult(null)
      return
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      setLoading(true)
      setApiErr(null)
      try {
        const res = await computeCombinations(
          { zone: project.zone, group: project.group, psi: project.psi },
          ctrl.signal,
        )
        setResult(res)
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return
        const error = err as Error
        const msg = error.message.toLowerCase()
        setApiErr(
          msg.includes("failed to fetch") || msg.includes("network")
            ? "Backend non démarré — uvicorn backend.main:app --reload --port 8000"
            : error.message,
        )
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [project.zone, project.group, project.psi])

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      background: c.bg, fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif",
      transition: "background 0.2s", overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{ padding: "18px 20px 10px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.12em", color: c.blue,
          textTransform: "uppercase", marginBottom: 4, fontWeight: 600 }}>
          RPA 2024 — §5.2 Eq. 5.1–5.4
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: c.text }}>
          Combinaisons Sismiques
        </h1>
        <div style={{ color: c.textSec, fontSize: 13, marginTop: 3 }}>
          G + ψ·Q ± Ex ± 0.3Ey (± 0.3Ez si Av·I &gt; 0.25)
        </div>
      </div>

      {/* No project params yet */}
      {!isReady && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 12, color: c.textMuted, padding: 32,
        }}>
          <div style={{ fontSize: 36 }}>🔗</div>
          <div style={{
            fontSize: 14, color: c.textSec, textAlign: "center", maxWidth: 420, lineHeight: 1.6,
          }}>
            Veuillez d'abord définir la zone sismique et le groupe d'importance dans les{" "}
            <b style={{ color: c.blue }}>Paramètres du projet</b>.
          </div>
        </div>
      )}

      {isReady && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "0 20px 16px" }}>

          {/* Summary card */}
          {result && (
            <div style={{
              background: c.surface, border: `1px solid ${c.border}`,
              borderRadius: 12, padding: "12px 16px", marginBottom: 12, flexShrink: 0,
              display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
            }}>
              {[
                { l: "Zone", v: project.zone, col: c.blue },
                { l: "Groupe", v: project.group, col: c.purple },
                { l: "ψ", v: result.psi.toFixed(2), col: c.amber },
                { l: "Av·I", v: result.av_i.toFixed(3), col: result.include_vertical ? c.red : c.green },
                {
                  l: "Composante verticale",
                  v: result.include_vertical ? "Oui" : "Non",
                  col: result.include_vertical ? c.red : c.green,
                },
                { l: "Combinaisons", v: String(result.total_count), col: c.blue },
              ].map(b => (
                <div key={b.l} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 10, color: c.textMuted, textTransform: "uppercase",
                    letterSpacing: "0.06em", fontWeight: 600 }}>
                    {b.l}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: b.col, fontFamily: "monospace" }}>
                    {b.v}
                  </div>
                </div>
              ))}

              {result.include_vertical && (
                <div style={{
                  marginLeft: "auto", background: c.red + "15",
                  border: `1px solid ${c.red}44`, borderRadius: 8,
                  padding: "6px 12px", fontSize: 12, color: c.red,
                }}>
                  ⚠️ Av·I = {result.av_i.toFixed(3)} &gt; 0.25 — composante Ez incluse (24 combinaisons)
                </div>
              )}
            </div>
          )}

          {loading && (
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 10, fontStyle: "italic", flexShrink: 0 }}>
              Calcul en cours…
            </div>
          )}

          {apiErr && (
            <div style={{
              background: c.red + "15", border: `1px solid ${c.red}44`,
              borderRadius: 8, padding: "10px 12px", fontSize: 11, color: c.red,
              lineHeight: 1.5, marginBottom: 12, flexShrink: 0,
            }}>
              ❌ {apiErr}
            </div>
          )}

          {/* Table */}
          {result && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
              background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12 }}>

              {/* Table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "32px 56px 1fr 52px 52px 52px",
                gap: 6, padding: "8px 10px",
                borderBottom: `1px solid ${c.border}`,
                flexShrink: 0,
              }}>
                {[
                  { l: "N°",       col: c.textMuted },
                  { l: "Réf.",     col: c.textMuted },
                  { l: "Combinaison", col: c.textMuted },
                  { l: "Ex",       col: c.blue },
                  { l: "Ey",       col: c.purple },
                  { l: "Ez",       col: c.amber },
                ].map(h => (
                  <div key={h.l} style={{
                    fontSize: 10, fontWeight: 700, color: h.col,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    textAlign: h.l === "Combinaison" ? "left" : "center",
                  }}>
                    {h.l}
                  </div>
                ))}
              </div>

              {/* Scrollable rows */}
              <div style={{ flex: 1, overflowY: "auto", padding: "6px 6px 10px", display: "flex", flexDirection: "column", gap: 3 }}>
                {result.combinations.map((combo, idx) => (
                  <ComboRow key={combo.id} combo={combo} idx={idx} c={c} />
                ))}
              </div>
            </div>
          )}

          {!result && !loading && !apiErr && (
            <div style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 12, color: c.textMuted,
            }}>
              <div style={{ fontSize: 36 }}>🔗</div>
              <div style={{ fontSize: 14, color: c.textSec }}>
                Chargement des combinaisons…
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
