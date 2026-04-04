"""
StructCalc — RPA 2024 P-Δ (Second-Order) Effect Check
======================================================
Implements §5.9 — Effet P-Δ (stabilité).

References:
    RPA 2024 — DTR BC 2.48
    §5.9     — Effet P-Δ              Eq 5.9, 5.10
    §4.5.2   — Inelastic displacement  Eq 4.15

Key formulas:
    Pk = Σ(Gi + ψ·Qi) for stories at and above level k    [Eq 5.10]
    Vk = Σ Fi for stories at and above level k
    δk = (R / QF) × δek                                    [Eq 4.15]
    θk = (Pk × Δk) / (Vk × hk)                            [Eq 5.9]

Verdict:
    θk < 0.10          → "ok"
    0.10 ≤ θk ≤ 0.20  → "amplify"  (apply 1/(1−θk) amplification)
    θk > 0.20          → "unstable"
"""

from dataclasses import dataclass, field
from typing import List


# ---------------------------------------------------------------------------
# DATA CLASSES
# ---------------------------------------------------------------------------

@dataclass
class StoryPDelta:
    level: int           # 1-based story index
    hk: float            # inter-story height (m)
    Pk: float            # cumulative gravity load above level k (kN)  [Eq 5.10]
    Vk: float            # story shear at level k (kN)
    delta_k: float       # inelastic relative drift Δk = dk − dk−1 (m)
    theta_k: float       # stability index θk = (Pk × Δk)/(Vk × hk)  [Eq 5.9]
    verdict: str         # "ok" | "amplify" | "unstable"
    amplification: float # 1/(1−θk) if "amplify", else 1.0


@dataclass
class DirectionPDelta:
    direction: str                           # "X" or "Y"
    stories: List[StoryPDelta] = field(default_factory=list)
    all_ok: bool = True                      # True if no story has verdict="unstable"
    max_theta: float = 0.0


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
    Returns list of lateral forces Fi (one per story, bottom to top).
    """
    total_wh = sum(
        (float(s["wg"]) + psi * float(s["wq"])) * float(s.get("elevation", 0.0))
        for s in stories
    )
    V_dist = V - Ft
    forces = []
    for s in stories:
        wi = float(s["wg"]) + psi * float(s["wq"])
        hi = float(s.get("elevation", 0.0))
        ratio = (wi * hi / total_wh) if total_wh > 0 else 1.0 / len(stories)
        forces.append(ratio * V_dist)

    if forces and Ft > 0:
        forces[-1] += Ft

    return forces


# ---------------------------------------------------------------------------
# MAIN FUNCTION
# ---------------------------------------------------------------------------

def compute_p_delta(
    stories: list[dict],
    R: float,
    QF: float,
    psi: float,
    V_x: float,
    V_y: float,
    Ft_x: float = 0.0,
    Ft_y: float = 0.0,
) -> tuple["DirectionPDelta", "DirectionPDelta"]:
    """
    Compute P-Δ stability indices per RPA 2024 §5.9.

    Args:
        stories: list of dicts with keys: hk, wg, wq, dek_x, dek_y.
                 'elevation' key is used for force distribution (cumulative height).
        R:   behavior factor
        QF:  quality factor
        psi: accompaniment coefficient ψ
        V_x, V_y:   base shear in X and Y (kN)
        Ft_x, Ft_y: additional top force in X and Y (kN)

    Returns:
        Tuple (result_x, result_y) of DirectionPDelta
    """
    if QF == 0:
        raise ValueError("QF must not be zero")

    amplification_factor = R / QF    # Eq 4.15

    # Build cumulative elevations if not already provided
    # stories[i]["elevation"] should be the absolute elevation from base (m)
    # hk = inter-story height = elevation[i] - elevation[i-1]  (or elevation[0] for ground)

    def _compute_direction(dek_key: str, V: float, Ft: float, direction: str) -> DirectionPDelta:
        result = DirectionPDelta(direction=direction)

        # Lateral forces distributed over stories (bottom → top order)
        forces = _compute_story_forces(stories, V, Ft, psi)

        # Cumulative vertical loads Pk from top down (Eq 5.10)
        # Pk = Σ (Gi + ψ Qi) for i = k to n
        # Build reversed cumulative sum
        n = len(stories)
        gravity_loads = [
            float(stories[i]["wg"]) + psi * float(stories[i]["wq"])
            for i in range(n)
        ]
        # Pk[i] = sum of gravity_loads[i..n-1]
        Pk_list = []
        running = 0.0
        for i in range(n - 1, -1, -1):
            running += gravity_loads[i]
            Pk_list.insert(0, running)

        # Story shear Vk[i] = sum of forces[i..n-1]
        Vk_list = []
        for i in range(n):
            Vk_list.append(sum(forces[i:]))

        dk_prev = 0.0
        all_ok = True
        max_theta = 0.0

        for i, s in enumerate(stories):
            hk = float(s["hk"])
            dek = float(s.get(dek_key, 0.0))

            dk = amplification_factor * dek              # Eq 4.15
            delta_k = dk - dk_prev                       # Eq 4.16

            Pk = Pk_list[i]
            Vk = Vk_list[i]

            # θk = (Pk × Δk) / (Vk × hk)               [Eq 5.9]
            if Vk > 0 and hk > 0:
                theta_k = (Pk * delta_k) / (Vk * hk)
            else:
                theta_k = 0.0

            # Verdict
            if theta_k > 0.20:
                verdict = "unstable"
                amp = 1.0
                all_ok = False
            elif theta_k >= 0.10:
                verdict = "amplify"
                amp = 1.0 / (1.0 - theta_k) if theta_k < 1.0 else 1.0
            else:
                verdict = "ok"
                amp = 1.0

            max_theta = max(max_theta, theta_k)

            result.stories.append(StoryPDelta(
                level=i + 1,
                hk=hk,
                Pk=Pk,
                Vk=Vk,
                delta_k=delta_k,
                theta_k=theta_k,
                verdict=verdict,
                amplification=amp,
            ))
            dk_prev = dk

        result.all_ok = all_ok
        result.max_theta = max_theta
        return result

    result_x = _compute_direction("dek_x", V_x, Ft_x, "X")
    result_y = _compute_direction("dek_y", V_y, Ft_y, "Y")
    return result_x, result_y
