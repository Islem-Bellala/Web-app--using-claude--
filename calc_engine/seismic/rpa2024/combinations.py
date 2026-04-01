"""
Bunyan — Combinaisons Sismiques (RPA 2024)
============================================
§5.2 Eq 5.1-5.4, Table 4.2, Table 5.1

Generates seismic load combinations per RPA 2024 §5.2.
Handles both horizontal-only (8 combos, E1+E2) and
horizontal+vertical (24 combos, E3+E4+E5) cases.

No framework imports — pure Python.
"""

from dataclasses import dataclass
from itertools import product
from typing import List


# =============================================================================
# TABLE 5.1 — Av·I vertical acceleration coefficients
# Keyed by (zone: str, group: str) → float
# RPA 2024 — Table 5.1
# =============================================================================

TABLE_5_1: dict = {
    ("I",   "1A"): 0.054, ("I",   "1B"): 0.046, ("I",   "2"): 0.039, ("I",   "3"): 0.031,
    ("II",  "1A"): 0.077, ("II",  "1B"): 0.066, ("II",  "2"): 0.055, ("II",  "3"): 0.044,
    ("III", "1A"): 0.116, ("III", "1B"): 0.099, ("III", "2"): 0.083, ("III", "3"): 0.066,
    ("IV",  "1A"): 0.252, ("IV",  "1B"): 0.216, ("IV",  "2"): 0.180, ("IV",  "3"): 0.144,
    ("V",   "1A"): 0.315, ("V",   "1B"): 0.270, ("V",   "2"): 0.225, ("V",   "3"): 0.180,
    ("VI",  "1A"): 0.378, ("VI",  "1B"): 0.324, ("VI",  "2"): 0.270, ("VI",  "3"): 0.216,
}


# =============================================================================
# PSI_TABLE — Coefficient d'accompagnement ψ
# Table 4.2 RPA 2024
# =============================================================================

PSI_TABLE: dict = {
    1: 0.30,   # Habitation, bureaux
    2: 0.40,   # Public temporaire (salles, restaurants…)
    3: 0.50,   # Entrepôts, hangars
    4: 1.00,   # Archives, bibliothèques, réservoirs
    5: 0.60,   # Autres locaux
}

PSI_LABELS: dict = {
    1: "Habitation, bureaux",
    2: "Public temporaire (salles, restaurants…)",
    3: "Entrepôts, hangars",
    4: "Archives, bibliothèques, réservoirs",
    5: "Autres locaux",
}


# =============================================================================
# COMBINATION EXPRESSION
# =============================================================================

@dataclass
class CombinationExpr:
    """
    A single seismic load combination.

    Gravity: G + ψ·Q
    Seismic: seismic_id with sign permutation (ex_coeff, ey_coeff, ez_coeff)
    """
    id: str           # e.g. "E1_1", "E3_5"
    label: str        # e.g. "G + 0.30·Q + Ex + 0.3Ey"
    gravity: str      # e.g. "G + 0.30·Q"
    seismic_id: str   # "E1", "E2", "E3", "E4", "E5"
    ex_coeff: float
    ey_coeff: float
    ez_coeff: float


# =============================================================================
# HELPERS
# =============================================================================

def _fmt_coeff(val: float) -> str:
    """Format a coefficient for label display (e.g. 1.0 → '1', 0.3 → '0.3')."""
    if abs(val) == 1.0:
        return "1"
    return f"{abs(val):.1f}"


def _seismic_label(ex: float, ey: float, ez: float) -> str:
    """Build a human-readable seismic component string like 'Ex + 0.3Ey - 0.3Ez'."""
    parts: List[str] = []
    for coeff, axis in [(ex, "Ex"), (ey, "Ey"), (ez, "Ez")]:
        if coeff == 0.0:
            continue
        c_str = _fmt_coeff(coeff) + axis
        if not parts:
            token = f"-{c_str}" if coeff < 0 else c_str
        else:
            token = f"- {c_str}" if coeff < 0 else f"+ {c_str}"
        parts.append(token)
    return " ".join(parts)


def _make_combos(
    seismic_id: str,
    ex_base: float,
    ey_base: float,
    ez_base: float,
    psi: float,
    gravity: str,
) -> List[CombinationExpr]:
    """
    Generate all sign permutations for a given seismic group (E1–E5).

    - If ez_base == 0 → 4 combos (±ex, ±ey)
    - If ez_base != 0 → 8 combos (±ex, ±ey, ±ez)
    """
    sign_sets = (
        list(product([1, -1], [1, -1]))
        if ez_base == 0.0
        else list(product([1, -1], [1, -1], [1, -1]))
    )

    combos: List[CombinationExpr] = []
    for i, signs in enumerate(sign_sets, start=1):
        if ez_base == 0.0:
            sx, sy = signs  # type: ignore[misc]
            sz = 0
        else:
            sx, sy, sz = signs  # type: ignore[misc]

        ex = round(sx * ex_base, 10)
        ey = round(sy * ey_base, 10)
        ez = round(sz * ez_base, 10)

        seismic_part = _seismic_label(ex, ey, ez)
        label = f"{gravity} + {seismic_part}"

        combos.append(CombinationExpr(
            id=f"{seismic_id}_{i}",
            label=label,
            gravity=gravity,
            seismic_id=seismic_id,
            ex_coeff=ex,
            ey_coeff=ey,
            ez_coeff=ez,
        ))
    return combos


# =============================================================================
# PUBLIC API
# =============================================================================

def requires_vertical_component(zone: str, group: str) -> bool:
    """
    Returns True if the vertical seismic component must be included.

    Condition: Av·I > 0.25 (RPA 2024 §5.2)

    Args:
        zone:  Seismic zone string ("I", "II", …, "VI")
        group: Importance group ("1A", "1B", "2", "3")
    """
    av_i = TABLE_5_1.get((zone, group), 0.0)
    return av_i > 0.25


def generate_combinations(
    psi: float,
    include_vertical: bool,
) -> List[CombinationExpr]:
    """
    Generate seismic load combinations per RPA 2024 §5.2 (Eq. 5.1–5.4).

    Args:
        psi:              Coefficient d'accompagnement ψ (Table 4.2).
        include_vertical: If True → 24 combos (E3+E4+E5 with Ez).
                          If False → 8 combos (E1+E2, horizontal only).

    Returns:
        List of CombinationExpr objects.
        Horizontal only: 8 items (E1×4 + E2×4)
        With vertical:  24 items (E3×8 + E4×8 + E5×8)
    """
    gravity = f"G + {psi:.2f}·Q"

    if not include_vertical:
        # E1: (±1, ±0.3, 0) — X dominant
        # E2: (±0.3, ±1, 0) — Y dominant
        return (
            _make_combos("E1", 1.0, 0.3, 0.0, psi, gravity)
            + _make_combos("E2", 0.3, 1.0, 0.0, psi, gravity)
        )
    else:
        # E3: (±1, ±0.3, ±0.3)
        # E4: (±0.3, ±1, ±0.3)
        # E5: (±0.3, ±0.3, ±1)
        return (
            _make_combos("E3", 1.0, 0.3, 0.3, psi, gravity)
            + _make_combos("E4", 0.3, 1.0, 0.3, psi, gravity)
            + _make_combos("E5", 0.3, 0.3, 1.0, psi, gravity)
        )
