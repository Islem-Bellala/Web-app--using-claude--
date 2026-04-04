"""
StructCalc — RPA 2024 Overturning & Sliding Verification
=========================================================
Implements §5.5 — Renversement et glissement.

References:
    RPA 2024 — DTR BC 2.48
    §4.5.1   — Lateral force distribution
    §5.5     — Vérification au renversement et glissement

Key formulas:
    Fk = (V − Ft) × (Wk × Hk) / Σ(Wj × Hj)   — force at level k
    M_renvers = Σ(Fk × Hk)                      — overturning moment
    M_stab_x  = W_total × Lx / 2                — stabilizing moment (X direction)
    M_stab_y  = W_total × Ly / 2                — stabilizing moment (Y direction)
    coeff_renvers = M_stab / M_renvers  ≥ 1.3
    F_glissement  = V  (base shear)
    F_resistance  = μ × W_total
    coeff_gliss   = F_resistance / F_glissement  ≥ 1.25
"""

from dataclasses import dataclass


# ---------------------------------------------------------------------------
# DATA CLASSES
# ---------------------------------------------------------------------------

@dataclass
class DirectionOverturning:
    direction: str          # "X" or "Y"
    V: float                # base shear (kN)
    M_renvers: float        # overturning moment (kN·m)
    M_stab: float           # stabilizing moment (kN·m)
    coeff_renvers: float    # M_stab / M_renvers
    ok_renvers: bool        # coeff_renvers ≥ 1.3
    F_glissement: float     # lateral force = V (kN)
    F_resistance: float     # μ × W_total (kN)
    coeff_glissement: float # F_resistance / F_glissement
    ok_glissement: bool     # coeff_glissement ≥ 1.25


@dataclass
class OverturningResult:
    x: DirectionOverturning
    y: DirectionOverturning


# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def _compute_story_forces(
    stories: list[dict],
    V: float,
    Ft: float,
    psi: float,
) -> list[float]:
    """
    Distribute (V − Ft) proportional to Wi × Hi, add Ft to top story.
    Wi = wg_i + ψ × wq_i
    Hi = cumulative elevation from base (absolute, not inter-story height)
    """
    n = len(stories)
    weights = [float(s["wg"]) + psi * float(s["wq"]) for s in stories]
    heights = [float(s.get("elevation", 0.0)) for s in stories]

    total_wh = sum(w * h for w, h in zip(weights, heights))
    V_dist = V - Ft

    forces = []
    for w, h in zip(weights, heights):
        ratio = (w * h / total_wh) if total_wh > 0 else 1.0 / n
        forces.append(ratio * V_dist)

    if forces and Ft > 0:
        forces[-1] += Ft

    return forces


# ---------------------------------------------------------------------------
# MAIN FUNCTION
# ---------------------------------------------------------------------------

def compute_overturning(
    stories: list[dict],
    V_x: float,
    V_y: float,
    Ft_x: float,
    Ft_y: float,
    psi: float,
    lx: float,
    ly: float,
    mu: float,
    W_total: float,
) -> OverturningResult:
    """
    Compute overturning and sliding verification per RPA 2024 §5.5.

    Args:
        stories:  list of dicts with keys: wg, wq, elevation (absolute height from base, m)
        V_x, V_y: base shear in X and Y (kN)
        Ft_x, Ft_y: additional top force in X and Y (kN)
        psi:      accompaniment coefficient ψ
        lx, ly:   building plan dimensions (m)
        mu:       soil-foundation friction coefficient
        W_total:  total seismic weight (kN)

    Returns:
        OverturningResult with per-direction checks
    """
    def _compute_direction(
        V: float, Ft: float, L: float, direction: str
    ) -> DirectionOverturning:
        forces = _compute_story_forces(stories, V, Ft, psi)
        heights = [float(s.get("elevation", 0.0)) for s in stories]

        # Overturning moment: M = Σ(Fk × Hk)
        M_renvers = sum(f * h for f, h in zip(forces, heights))

        # Stabilizing moment: M_stab = W_total × L / 2
        M_stab = W_total * L / 2.0

        coeff_renvers = (M_stab / M_renvers) if M_renvers > 0 else float("inf")
        ok_renvers = coeff_renvers >= 1.3

        # Sliding check
        F_glissement = V
        F_resistance = mu * W_total
        coeff_glissement = (F_resistance / F_glissement) if F_glissement > 0 else float("inf")
        ok_glissement = coeff_glissement >= 1.25

        return DirectionOverturning(
            direction=direction,
            V=V,
            M_renvers=M_renvers,
            M_stab=M_stab,
            coeff_renvers=coeff_renvers,
            ok_renvers=ok_renvers,
            F_glissement=F_glissement,
            F_resistance=F_resistance,
            coeff_glissement=coeff_glissement,
            ok_glissement=ok_glissement,
        )

    result_x = _compute_direction(V_x, Ft_x, lx, "X")
    result_y = _compute_direction(V_y, Ft_y, ly, "Y")

    return OverturningResult(x=result_x, y=result_y)
