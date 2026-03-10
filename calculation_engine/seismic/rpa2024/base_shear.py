"""
StructCalc — RPA 2024 Static Equivalent Method
================================================
Computes the total base shear force V and distributes it
along the height of the structure.

Code reference:
    RPA 2024 — DTR BC 2.48
    Section 4.2 — Méthode Statique Équivalente
    Equations 4.1, 4.2, 4.3, 4.4

Engineering Core Isolation Principle:
    Pure engineering formulas only. No API, no DB, no UI.
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
    BEHAVIOUR_COEFFICIENTS,
    get_spectrum_params,
    get_damping_factor,
    compute_quality_factor,
    QualityPenalty,
)
from .spectrum import compute_Sae_g


# =============================================================================
# FUNDAMENTAL PERIOD — Equation 4.4
# =============================================================================

class FrameSystem:
    """Structural system types for empirical period formula."""
    BA_NO_INFILL   = "ba_no_infill"    # Ossature BA sans remplissage — CT = 0.075
    STEEL_NO_INFILL = "steel_no_infill" # Ossature acier sans remplissage — CT = 0.085
    BA_WITH_INFILL  = "ba_with_infill"  # Ossature BA/acier avec remplissage — CT = 0.050
    OTHER           = "other"           # Autres — CT = 0.050


# Empirical period coefficients CT
# RPA 2024 — Section 4.2.4, Table following Eqn 4.4
CT_VALUES = {
    FrameSystem.BA_NO_INFILL:    0.075,
    FrameSystem.STEEL_NO_INFILL: 0.085,
    FrameSystem.BA_WITH_INFILL:  0.050,
    FrameSystem.OTHER:           0.050,
}


def compute_empirical_period(hn: float, frame_system: str) -> float:
    """
    Computes the empirical fundamental period T_empirique.

    Formula: T_emp = CT × hn^(3/4)    [Equation 4.4, RPA 2024]

    Args:
        hn:           Total building height (m)
        frame_system: Structural system type (use FrameSystem constants)

    Returns:
        T_emp — empirical fundamental period (seconds)

    Code reference: RPA 2024 — Section 4.2.4, Equation 4.4
    """
    CT = CT_VALUES.get(frame_system, 0.050)
    return CT * (hn ** 0.75)


def get_design_period(
    hn: float,
    frame_system: str,
    T_calculated: Optional[float] = None,
) -> float:
    """
    Returns the design period T0 for the static equivalent method.

    Rules per RPA 2024 §4.2.4:
    - If only empirical: T0 = T_emp
    - If calculated (Rayleigh or FEM): T0 = min(T_calc, 1.3 × T_emp)
    - The cap 1.3 × T_emp prevents over-flexibility assumptions

    Args:
        hn:           Total building height (m)
        frame_system: Structural system type
        T_calculated: Period from Rayleigh or FEM analysis (optional, seconds)

    Returns:
        T0 — design period to use in base shear formula (seconds)

    Code reference: RPA 2024 — Section 4.2.4
    """
    T_emp = compute_empirical_period(hn, frame_system)
    T_max = 1.3 * T_emp   # RPA 2024 upper cap

    if T_calculated is None:
        return T_emp

    return min(T_calculated, T_max)


# =============================================================================
# INPUT / OUTPUT DATA CLASSES
# =============================================================================

@dataclass
class StoryMass:
    """Mass and height data for one storey."""
    name:      str    # e.g. "RDC", "Etage 1"
    elevation: float  # m — height from ground
    weight:    float  # kN — seismic weight Wi of this storey


@dataclass
class BaseShearInput:
    """
    Input parameters for the static equivalent method.
    RPA 2024 — Section 4.2
    """
    zone:             SeismicZone
    site_class:       SiteClass
    importance_group: ImportanceGroup
    R:                float          # Behaviour coefficient
    Q:                float          # Quality factor (from compute_quality_factor)
    W:                float          # Total seismic weight (kN)
    T0:               float          # Design period (s) — from get_design_period()
    xi_percent:       float = 5.0    # Damping ratio (%)
    stories:          List[StoryMass] = field(default_factory=list)


@dataclass
class StoryForce:
    """Seismic force assigned to a storey."""
    name:      str
    elevation: float   # m
    weight:    float   # kN — Wi
    Fi:        float   # kN — seismic force at this storey
    ratio:     float   # Wi·hi / Σ(Wj·hj) — distribution factor


@dataclass
class BaseShearResult:
    """
    Complete result of the static equivalent method.
    RPA 2024 — Section 4.2, Equations 4.1 and 4.2
    """
    input:        BaseShearInput
    Sad_g:        float              # Design spectral ordinate Sad(T0)/g
    V:            float              # Total base shear (kN) — Equation 4.1
    story_forces: List[StoryForce]   # Distribution per storey — Equation 4.2
    Ft:           float = 0.0        # Additional top force (kN) — Equation 4.3

    def summary(self) -> str:
        lines = [
            "RPA 2024 — Static Equivalent Method",
            "─" * 40,
            f"  Period T0    : {self.input.T0:.3f} s",
            f"  Sad(T0)/g   : {self.Sad_g:.4f}",
            f"  R           : {self.input.R}",
            f"  Q           : {self.input.Q}",
            f"  W           : {self.input.W:.1f} kN",
            f"  V = 0.8·Sad·W : {self.V:.1f} kN",
            "─" * 40,
            "  Storey forces (Fi):",
        ]
        for f in self.story_forces:
            lines.append(f"    {f.name:<12} hi={f.elevation:.1f}m  Fi={f.Fi:.1f} kN")
        return "\n".join(lines)


# =============================================================================
# BASE SHEAR COMPUTATION — Equation 4.1
# =============================================================================

def compute_base_shear(inp: BaseShearInput) -> BaseShearResult:
    """
    Computes total base shear V and storey force distribution.

    Step 1 — Design spectrum at T0:
        Sae(T0)/g = [from Equation 3.8]
        Sad(T0)/g = Sae/g × Q / R

    Step 2 — Total base shear (Equation 4.1):
        V = 0.8 × Sad(T0)/g × W

    Step 3 — Distribute forces (Equation 4.2):
        Fi = (Wi × hi) / Σ(Wj × hj) × (V - Ft)

    Step 4 — Additional top force Ft (Equation 4.3):
        If T0 > 0.7s: Ft = 0.07 × T0 × V  (max 0.25V)
        Otherwise:    Ft = 0

    Args:
        inp: BaseShearInput with all required parameters

    Returns:
        BaseShearResult with V and storey force distribution

    Code reference: RPA 2024 — Section 4.2, Equations 4.1–4.3
    """

    # ── Step 1: Design spectral acceleration at T0 ────────────────────────────
    A      = ZONE_ACCELERATION[inp.zone]
    I      = IMPORTANCE_FACTOR[inp.importance_group]
    params = get_spectrum_params(inp.zone, inp.site_class)
    eta    = get_damping_factor(inp.xi_percent)

    Sae_g, _ = compute_Sae_g(
        T=inp.T0,
        A=A, I=I, S=params.S, eta=eta,
        T1=params.T1, T2=params.T2, T3=params.T3,
    )

    # Design spectrum: divide by R, multiply by Q
    # RPA 2024 — Section 3.3.3
    Sad_g = Sae_g * inp.Q / inp.R

    # ── Step 2: Total base shear ──────────────────────────────────────────────
    # V = 0.8 × Sad(T0)/g × W    [Equation 4.1]
    # The factor 0.85 in some documents refers to the modal method check
    V = 0.8 * Sad_g * inp.W

    # ── Step 3: Additional top force Ft ──────────────────────────────────────
    # Accounts for higher mode effects in flexible structures
    # [Equation 4.3]
    if inp.T0 > 0.7:
        Ft = min(0.07 * inp.T0 * V, 0.25 * V)
    else:
        Ft = 0.0

    # ── Step 4: Distribute forces along height ────────────────────────────────
    # Fi = (Wi × hi) / Σ(Wj × hj) × (V - Ft)    [Equation 4.2]
    V_distributed = V - Ft

    # Compute denominator: Σ(Wj × hj)
    sum_Wh = sum(s.weight * s.elevation for s in inp.stories)

    story_forces = []
    for storey in inp.stories:
        if sum_Wh > 0:
            ratio = (storey.weight * storey.elevation) / sum_Wh
        else:
            ratio = 1.0 / len(inp.stories)   # fallback: equal distribution

        Fi = ratio * V_distributed

        story_forces.append(StoryForce(
            name=storey.name,
            elevation=storey.elevation,
            weight=storey.weight,
            Fi=Fi,
            ratio=ratio,
        ))

    # Add Ft to the top storey
    if story_forces and Ft > 0:
        story_forces[-1].Fi += Ft

    return BaseShearResult(
        input=inp,
        Sad_g=Sad_g,
        V=V,
        Ft=Ft,
        story_forces=story_forces,
    )
