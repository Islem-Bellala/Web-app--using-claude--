"""
StructCalc — RPA 2024 Displacement Verification
================================================
Implements §4.5.2 (inelastic displacements) and §5.10 (drift limits).

References:
    RPA 2024 — DTR BC 2.48
    §4.5.2   — Déplacements inélastiques   Eq 4.15, 4.16
    §5.10    — Limitation des déplacements  Eq 5.11, 5.12, 5.13, Table 5.2
    §1.2     — νA = 0.5 (coefficient de réduction)

Key formula:
    δk = (R / QF) × δek        [Eq 4.15]  ← NOT R × QF
    Δk = δk - δk-1              [Eq 4.16]
"""

from dataclasses import dataclass, field
from typing import List

# ---------------------------------------------------------------------------
# CODE TABLES
# ---------------------------------------------------------------------------

# Table 5.2 — Inter-story drift limits (non-effondrement) by structure type
# Values are as a fraction of story height hk
TABLE_5_2: dict[str, float] = {
    "acier":      0.020,
    "beton_arme": 0.015,
    "paf":        0.010,
    "bois":       0.015,
    "maconnerie": 0.010,
}

# §5.10.2 — Damage limitation limits (νA × Δk ≤ limit × hk)
DAMAGE_LIMITS: dict[str, float] = {
    "fragile": 0.005,
    "ductile": 0.0075,
}

# §1.2 — Reduction coefficient for damage limitation check
NU_A: float = 0.5


# ---------------------------------------------------------------------------
# DATA CLASSES
# ---------------------------------------------------------------------------

@dataclass
class StoryDisplacementInput:
    hk: float     # inter-story height (m)
    dek: float    # elastic displacement from software (m)


@dataclass
class StoryDisplacementResult:
    level: int           # 1-based story index
    hk: float            # inter-story height (m)
    dek: float           # elastic displacement input (m)
    dk: float            # inelastic displacement  δk = (R/QF) × δek  [Eq 4.15]
    delta_k: float       # relative drift  Δk = dk - dk_prev            [Eq 4.16]
    drift: float         # Δk / hk  (dimensionless ratio)
    drift_limit_ne: float   # Table 5.2 limit × hk  (m)  — non-effondrement
    damage_value: float     # νA × Δk  (m)  — left-hand side of §5.10.2 check
    damage_limit: float     # DAMAGE_LIMITS[type] × hk  (m)  — right-hand side
    ok_ne: bool          # Δk ≤ drift_limit_ne?
    ok_ld: bool          # νA × Δk ≤ damage_limit?


@dataclass
class DirectionDisplacements:
    direction: str                              # "X" or "Y"
    R: float
    QF: float
    structure_type: str
    non_structural_type: str
    stories: List[StoryDisplacementResult] = field(default_factory=list)
    all_ok_ne: bool = True     # all stories pass non-effondrement check
    all_ok_ld: bool = True     # all stories pass damage-limitation check


# ---------------------------------------------------------------------------
# MAIN FUNCTION
# ---------------------------------------------------------------------------

def compute_displacements(
    stories: list[dict],
    R: float,
    QF: float,
    structure_type: str,
    non_structural_type: str,
) -> tuple["DirectionDisplacements", "DirectionDisplacements"]:
    """
    Compute inelastic displacements and drift checks per RPA 2024 §4.5.2 + §5.10.

    Args:
        stories: list of dicts with keys: hk, dek_x, dek_y
        R:  behavior factor
        QF: quality factor
        structure_type: key from TABLE_5_2 (e.g. "beton_arme")
        non_structural_type: key from DAMAGE_LIMITS (e.g. "fragile")

    Returns:
        Tuple (result_x, result_y) of DirectionDisplacements

    Formula:
        δk = (R / QF) × δek              [Eq 4.15]
        Δk = δk − δk−1  (0 at ground)    [Eq 4.16]
        Non-effondrement: Δk ≤ limit_ne × hk
        Damage: νA × Δk ≤ limit_ld × hk
    """
    if QF == 0:
        raise ValueError("QF must not be zero")

    drift_limit_frac = TABLE_5_2.get(structure_type, 0.015)
    damage_limit_frac = DAMAGE_LIMITS.get(non_structural_type, 0.005)
    amplification = R / QF

    def _compute_direction(dek_key: str, direction: str) -> DirectionDisplacements:
        result = DirectionDisplacements(
            direction=direction,
            R=R,
            QF=QF,
            structure_type=structure_type,
            non_structural_type=non_structural_type,
        )
        dk_prev = 0.0
        all_ok_ne = True
        all_ok_ld = True

        for i, s in enumerate(stories):
            hk = float(s["hk"])
            dek = float(s.get(dek_key, 0.0))

            dk = amplification * dek                         # Eq 4.15
            delta_k = dk - dk_prev                           # Eq 4.16
            drift = delta_k / hk if hk > 0 else 0.0

            drift_limit_ne = drift_limit_frac * hk
            damage_value = NU_A * delta_k
            damage_limit = damage_limit_frac * hk

            ok_ne = delta_k <= drift_limit_ne
            ok_ld = damage_value <= damage_limit

            if not ok_ne:
                all_ok_ne = False
            if not ok_ld:
                all_ok_ld = False

            result.stories.append(StoryDisplacementResult(
                level=i + 1,
                hk=hk,
                dek=dek,
                dk=dk,
                delta_k=delta_k,
                drift=drift,
                drift_limit_ne=drift_limit_ne,
                damage_value=damage_value,
                damage_limit=damage_limit,
                ok_ne=ok_ne,
                ok_ld=ok_ld,
            ))
            dk_prev = dk

        result.all_ok_ne = all_ok_ne
        result.all_ok_ld = all_ok_ld
        return result

    result_x = _compute_direction("dek_x", "X")
    result_y = _compute_direction("dek_y", "Y")
    return result_x, result_y
