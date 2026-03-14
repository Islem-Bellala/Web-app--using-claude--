"""
StructCalc — RPA 2024 Static Equivalent Method
================================================
Session 8 fix: corrected base shear formula V = λ × Sad(T0)/g × W

λ = 0.85  if T0 ≤ 2×T2  AND  n_floors > 2  (RPA 2024 §4.2)
λ = 1.0   otherwise

Previous sessions incorrectly used the fixed factor 0.8.
The Excel reference sheet (VRPA2024_V1.5) confirms this rule.

Code reference:
    RPA 2024 — DTR BC 2.48
    Section 4.2 — Méthode Statique Équivalente
    Equations 4.1, 4.2, 4.3, 4.4
"""

import math
from dataclasses import dataclass, field
from typing import List, Optional

from .parameters import (
    SeismicZone,
    SiteClass,
    ImportanceGroup,
    ZONE_ACCELERATION,
    IMPORTANCE_FACTOR,
    get_spectrum_params,
    get_damping_factor,
)
from .spectrum import compute_Sae_g


# =============================================================================
# FUNDAMENTAL PERIOD — Equation 4.4
# =============================================================================

class FrameSystem:
    BA_NO_INFILL    = "ba_no_infill"
    STEEL_NO_INFILL = "steel_no_infill"
    BA_WITH_INFILL  = "ba_with_infill"
    OTHER           = "other"

CT_VALUES = {
    FrameSystem.BA_NO_INFILL:    0.075,
    FrameSystem.STEEL_NO_INFILL: 0.085,
    FrameSystem.BA_WITH_INFILL:  0.050,
    FrameSystem.OTHER:           0.050,
}


def compute_empirical_period(hn: float, frame_system: str) -> float:
    """
    T_emp = CT × hn^(3/4)    [Equation 4.4]
    """
    CT = CT_VALUES.get(frame_system, 0.050)
    return CT * (hn ** 0.75)


def get_design_period(
    hn: float,
    frame_system: str,
    T_calculated: Optional[float] = None,
) -> float:
    """
    T0 = T_emp                          if no calculated period
    T0 = min(T_calculated, 1.3×T_emp)   if calculated period provided
    """
    T_emp = compute_empirical_period(hn, frame_system)
    T_max = 1.3 * T_emp
    if T_calculated is None:
        return T_emp
    return min(T_calculated, T_max)


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class StoryMass:
    name:      str
    elevation: float   # m
    weight:    float   # kN


@dataclass
class BaseShearInput:
    zone:             SeismicZone
    site_class:       SiteClass
    importance_group: ImportanceGroup
    R:                float
    Q:                float          # quality factor QF
    W:                float          # total seismic weight (kN)
    T0:               float          # design period (s)
    xi_percent:       float = 5.0
    stories:          List[StoryMass] = field(default_factory=list)


@dataclass
class StoryForce:
    name:      str
    elevation: float
    weight:    float
    Fi:        float   # kN
    ratio:     float   # Wi·hi / Σ(Wj·hj)


@dataclass
class BaseShearResult:
    input:        BaseShearInput
    Sad_g:        float
    V:            float              # kN
    lambda_coef:  float              # λ — NEW: 0.85 or 1.0
    story_forces: List[StoryForce]
    Ft:           float = 0.0

    def summary(self) -> str:
        lines = [
            "RPA 2024 — Static Equivalent Method",
            "─" * 40,
            f"  Period T0    : {self.input.T0:.3f} s",
            f"  Sad(T0)/g   : {self.Sad_g:.4f}",
            f"  λ           : {self.lambda_coef}",
            f"  R           : {self.input.R}",
            f"  Q           : {self.input.Q}",
            f"  W           : {self.input.W:.1f} kN",
            f"  V = λ·Sad·W : {self.V:.1f} kN",
            "─" * 40,
        ]
        for f in self.story_forces:
            lines.append(f"    {f.name:<12} hi={f.elevation:.1f}m  Fi={f.Fi:.1f} kN")
        return "\n".join(lines)


# =============================================================================
# BASE SHEAR COMPUTATION — Equation 4.1 (corrected with λ)
# =============================================================================

def compute_base_shear(inp: BaseShearInput) -> BaseShearResult:
    """
    V = λ × Sad(T0)/g × W    [Equation 4.1 — corrected]

    λ = 0.85  if T0 ≤ 2×T2  AND  n_floors > 2
    λ = 1.0   otherwise

    Previously this used a fixed 0.8 factor — that was wrong.
    The Excel reference (VRPA2024_V1.5) confirms λ is 0.85 or 1.0.

    Code reference: RPA 2024 §4.2, Equations 4.1–4.4
    """

    # ── Step 1: Spectral parameters ───────────────────────────────────────────
    A      = ZONE_ACCELERATION[inp.zone]
    I      = IMPORTANCE_FACTOR[inp.importance_group]
    params = get_spectrum_params(inp.zone, inp.site_class)
    eta    = get_damping_factor(inp.xi_percent)

    Sae_g, _ = compute_Sae_g(
        T=inp.T0, A=A, I=I, S=params.S, eta=eta,
        T1=params.T1, T2=params.T2, T3=params.T3,
    )

    Sad_g = Sae_g * inp.Q / inp.R

    # ── Step 2: λ correction coefficient ─────────────────────────────────────
    # RPA 2024 §4.2: λ = 0.85 if T0 ≤ 2×T2 AND building has more than 2 floors
    n_floors    = len(inp.stories)
    lambda_coef = 0.85 if (inp.T0 <= 2.0 * params.T2 and n_floors > 2) else 1.0

    # ── Step 3: Total base shear ──────────────────────────────────────────────
    V = lambda_coef * Sad_g * inp.W

    # ── Step 4: Additional top force Ft ──────────────────────────────────────
    if inp.T0 > 0.7:
        Ft = min(0.07 * inp.T0 * V, 0.25 * V)
    else:
        Ft = 0.0

    # ── Step 5: Distribute forces ─────────────────────────────────────────────
    V_distributed = V - Ft
    sum_Wh = sum(s.weight * s.elevation for s in inp.stories)

    story_forces = []
    for storey in inp.stories:
        ratio = (storey.weight * storey.elevation / sum_Wh) if sum_Wh > 0 else 1.0/len(inp.stories)
        Fi    = ratio * V_distributed
        story_forces.append(StoryForce(
            name=storey.name, elevation=storey.elevation,
            weight=storey.weight, Fi=Fi, ratio=ratio,
        ))

    if story_forces and Ft > 0:
        story_forces[-1].Fi += Ft

    return BaseShearResult(
        input=inp,
        Sad_g=Sad_g,
        V=V,
        lambda_coef=lambda_coef,
        Ft=Ft,
        story_forces=story_forces,
    )
