"""
StructCalc — RPA 2024 Elastic Response Spectrum
=================================================
This module computes the elastic design response spectrum Sae(T)/g
according to RPA 2024 (DTR BC 2.48), Section 3.3.1, Equation 3.8.

This is the foundation of all seismic calculations in StructCalc.
The spectrum is computed here and then:
    1. Displayed to the engineer (frontend chart)
    2. Exported to Robot / ETABS for modal analysis

Engineering Core Isolation Principle:
    This module contains ONLY engineering formulas.
    No FastAPI routes, no database calls, no UI code.

Code reference:
    RPA 2024 — DTR BC 2.48
    Section 3.3.1 — Spectre de réponse élastique horizontal
    Equation 3.8
"""

import math
from dataclasses import dataclass, field
from typing import List, Tuple, Optional

from .parameters import (
    SeismicZone,
    SiteClass,
    ImportanceGroup,
    SpectrumShapeParams,
    ZONE_ACCELERATION,
    IMPORTANCE_FACTOR,
    get_spectrum_params,
    get_damping_factor,
    get_spectrum_type,
    SpectrumType,
)


# =============================================================================
# INPUT DATA CLASS
# =============================================================================

@dataclass
class SpectrumInput:
    """
    All parameters required to compute the RPA 2024 design spectrum.
    The engineer fills in these values in the application interface.

    Attributes:
        zone:             Seismic zone of the site (I to VI)
        site_class:       Soil classification (S1 to S4)
        importance_group: Building importance category (1A, 1B, 2, 3)
        xi_percent:       Viscous damping ratio ξ in percent (default = 5%)
        T_start:          Start of period range for computation (s)
        T_end:            End of period range for computation (s)
        T_step:           Period step for spectrum points (s)

    Code reference: RPA 2024 — Section 3.3.1
    """
    zone:             SeismicZone
    site_class:       SiteClass
    importance_group: ImportanceGroup
    xi_percent:       float = 5.0     # % — standard value per RPA 2024
    T_start:          float = 0.0     # seconds
    T_end:            float = 4.0     # seconds
    T_step:           float = 0.01    # seconds


# =============================================================================
# OUTPUT DATA CLASSES
# =============================================================================

@dataclass
class SpectrumPoint:
    """
    A single point on the response spectrum.

    Attributes:
        T:     Period (seconds)
        Sa_g:  Spectral acceleration normalised by g — Sae(T)/g
        Sa:    Spectral acceleration (m/s²) — Sae(T) = Sa_g × g
        branch: Which branch of Equation 3.8 was used (1, 2, 3, or 4)
    """
    T:      float    # seconds
    Sa_g:   float    # dimensionless — Sae/g
    Sa:     float    # m/s² — absolute spectral acceleration
    branch: int      # 1 = rising, 2 = plateau, 3 = velocity, 4 = displacement


@dataclass
class SpectrumResult:
    """
    Complete result of the spectrum computation.

    Attributes:
        input:          Echo of the input parameters
        A:              Zone acceleration coefficient
        I:              Importance factor
        S:              Site coefficient
        eta:            Damping correction factor η
        T1, T2, T3:     Control periods from the code tables
        spectrum_type:  Type 1 or Type 2
        points:         List of (T, Sae/g) spectrum points
        peak_Sa_g:      Maximum spectral acceleration / g (at plateau)
        T_plateau_start: Start of the constant acceleration plateau (T1)
        T_plateau_end:   End of the constant acceleration plateau (T2)

    Code reference: RPA 2024 — Equation 3.8 and surrounding parameters
    """
    input:            SpectrumInput
    A:                float    # zone acceleration coefficient
    I:                float    # importance factor
    S:                float    # site coefficient
    eta:              float    # damping factor η
    T1:               float    # s — lower period bound of plateau
    T2:               float    # s — upper period bound of plateau
    T3:               float    # s — start of displacement branch
    spectrum_type:    SpectrumType
    points:           List[SpectrumPoint] = field(default_factory=list)

    @property
    def peak_Sa_g(self) -> float:
        """Maximum spectral acceleration / g — the plateau value."""
        return self.A * self.I * self.S * 2.5 * self.eta

    @property
    def Sa_g_at(self) -> callable:
        """Quick lookup: returns Sae/g for a specific period T."""
        def lookup(T: float) -> float:
            closest = min(self.points, key=lambda p: abs(p.T - T))
            return closest.Sa_g
        return lookup

    def to_export_table(self) -> List[Tuple[float, float]]:
        """
        Returns spectrum as a list of (T, Sa/g) tuples.
        Used when exporting to Robot or ETABS.
        """
        return [(p.T, p.Sa_g) for p in self.points]

    def summary(self) -> str:
        """Human-readable summary of key spectrum parameters."""
        return (
            f"RPA 2024 — Elastic Response Spectrum\n"
            f"{'─' * 40}\n"
            f"  Spectrum type : {self.spectrum_type.value}\n"
            f"  Zone          : {self.input.zone.value}  →  A = {self.A}\n"
            f"  Site class    : {self.input.site_class.value}  →  S = {self.S}\n"
            f"  Importance    : Group {self.input.importance_group.value}  →  I = {self.I}\n"
            f"  Damping       : ξ = {self.input.xi_percent}%  →  η = {self.eta:.4f}\n"
            f"  T1 = {self.T1}s   T2 = {self.T2}s   T3 = {self.T3}s\n"
            f"{'─' * 40}\n"
            f"  Peak Sae/g    : {self.peak_Sa_g:.4f}  (at plateau T1 to T2)\n"
            f"  Peak Sae      : {self.peak_Sa_g * 9.81:.3f} m/s²\n"
        )


# =============================================================================
# CORE FORMULA — RPA 2024 Equation 3.8
# =============================================================================

def compute_Sae_g(
    T: float,
    A: float,
    I: float,
    S: float,
    eta: float,
    T1: float,
    T2: float,
    T3: float,
) -> Tuple[float, int]:
    """
    Computes Sae(T)/g for a single period T using RPA 2024 Equation 3.8.

    This is the core engineering formula — the heart of seismic analysis.

    The spectrum has four branches:

    Branch 1 — Rising (0 ≤ T < T1):
        Sae/g = A·I·S·[1 + η·(2.5η - 1)·(T/T1)]

    Branch 2 — Constant acceleration plateau (T1 ≤ T < T2):
        Sae/g = A·I·S·(2.5η)

    Branch 3 — Velocity branch (T2 ≤ T < T3):
        Sae/g = A·I·S·(2.5η)·(T2/T)

    Branch 4 — Displacement branch (T3 ≤ T ≤ 4s):
        Sae/g = A·I·S·(2.5η)·(T2·T3/T²)

    Args:
        T:    Period of vibration (seconds)
        A:    Zone acceleration coefficient
        I:    Importance factor
        S:    Site coefficient
        eta:  Damping correction factor η
        T1:   Lower corner period of plateau (s)
        T2:   Upper corner period of plateau (s)
        T3:   Start of displacement branch (s)

    Returns:
        (Sae/g, branch_number) — spectral ordinate and which branch was used

    Code reference: RPA 2024 — Section 3.3.1, Equation 3.8
    """
    base = A * I * S  # common factor to all branches

    if T < 0:
        raise ValueError(f"Period T must be non-negative. Got T = {T}")

    if T < T1:
        # Branch 1: Linear rise from T=0 to the plateau
        # At T=0: Sae/g = A·I·S (ground acceleration)
        # At T=T1: Sae/g = A·I·S·2.5·η (joins plateau)
        Sa_g = base * (1.0 + (T / T1) * (2.5 * eta - 1.0))
        branch = 1

    elif T < T2:
        # Branch 2: Constant acceleration plateau
        # Maximum spectral acceleration — most demanding zone
        Sa_g = base * 2.5 * eta
        branch = 2

    elif T < T3:
        # Branch 3: Velocity-controlled branch (1/T decay)
        # Proportional to 1/T — longer period = less force
        Sa_g = base * 2.5 * eta * (T2 / T)
        branch = 3

    else:
        # Branch 4: Displacement-controlled branch (1/T² decay)
        # Proportional to 1/T² — flexible structures
        # Valid up to T = 4.0 seconds
        T_clipped = min(T, 4.0)  # RPA 2024 defines spectrum up to 4s
        Sa_g = base * 2.5 * eta * (T2 * T3 / T_clipped**2)
        branch = 4

    return Sa_g, branch


# =============================================================================
# MAIN COMPUTATION FUNCTION
# =============================================================================

def compute_spectrum(inp: SpectrumInput) -> SpectrumResult:
    """
    Computes the full RPA 2024 elastic horizontal response spectrum.

    This is the main function called by the API layer.
    It takes the engineer's inputs, applies all code tables and formulas,
    and returns a complete SpectrumResult with all intermediate values
    for full traceability.

    Workflow:
        1. Look up acceleration coefficient A  (Table 3.3)
        2. Look up importance factor I          (Tables 3.11/I.1)
        3. Look up spectrum shape params S, T1, T2, T3 (Tables 3.4/3.5)
        4. Compute damping factor η             (Equation 3.9)
        5. Loop over periods T and apply Equation 3.8
        6. Return SpectrumResult with all values

    Args:
        inp: SpectrumInput with zone, site, importance, damping

    Returns:
        SpectrumResult with complete spectrum data and traceability

    Raises:
        ValueError: If invalid parameters are provided

    Code reference: RPA 2024 — Section 3.3.1
    """

    # ── Step 1: Zone acceleration coefficient A ───────────────────────────────
    # RPA 2024 — Table 3.3
    A = ZONE_ACCELERATION[inp.zone]

    # ── Step 2: Importance factor I ───────────────────────────────────────────
    # RPA 2024 — Tables 3.11 & I.1
    I = IMPORTANCE_FACTOR[inp.importance_group]

    # ── Step 3: Spectrum shape parameters ────────────────────────────────────
    # Automatically selects Type 1 or Type 2 based on zone
    # RPA 2024 — Tables 3.4 & 3.5
    params: SpectrumShapeParams = get_spectrum_params(inp.zone, inp.site_class)
    S  = params.S
    T1 = params.T1
    T2 = params.T2
    T3 = params.T3

    # ── Step 4: Damping correction factor η ───────────────────────────────────
    # RPA 2024 — Equation 3.9: η = sqrt(10 / (5 + ξ)) ≥ 0.55
    eta = get_damping_factor(inp.xi_percent)

    # ── Step 5: Determine spectrum type ──────────────────────────────────────
    spectrum_type = get_spectrum_type(inp.zone)

    # ── Step 6: Build the result container ───────────────────────────────────
    result = SpectrumResult(
        input=inp,
        A=A,
        I=I,
        S=S,
        eta=eta,
        T1=T1,
        T2=T2,
        T3=T3,
        spectrum_type=spectrum_type,
        points=[],
    )

    # ── Step 7: Compute spectrum points ──────────────────────────────────────
    # Loop through periods from T_start to T_end using step T_step
    g = 9.81  # m/s² — gravitational acceleration

    T = inp.T_start
    while T <= inp.T_end + 1e-9:   # small tolerance to include T_end
        T_rounded = round(T, 6)

        Sa_g, branch = compute_Sae_g(
            T=T_rounded,
            A=A, I=I, S=S, eta=eta,
            T1=T1, T2=T2, T3=T3,
        )

        result.points.append(SpectrumPoint(
            T=T_rounded,
            Sa_g=round(Sa_g, 6),
            Sa=round(Sa_g * g, 6),
            branch=branch,
        ))

        T += inp.T_step

    return result


# =============================================================================
# DESIGN SPECTRUM (for structural analysis) — Section 3.3.3
# =============================================================================

def compute_design_spectrum_value(
    T: float,
    inp: SpectrumInput,
    R: float,
    Q: float = 1.0,
) -> float:
    """
    Computes the design spectral acceleration Sad(T)/g used in the
    static equivalent method and modal spectral analysis.

    The design spectrum reduces the elastic spectrum by the
    behaviour coefficient R and quality factor Q:

        Sad(T)/g = Sae(T)/g × Q / R

    where:
        R = behaviour coefficient (ductility reduction)
        Q = quality factor (irregularity penalty)

    Args:
        T:    Period (seconds)
        inp:  SpectrumInput parameters
        R:    Behaviour coefficient (from BEHAVIOUR_COEFFICIENTS table)
        Q:    Quality factor (from compute_quality_factor)

    Returns:
        Sad(T)/g — design spectral acceleration / g

    Code reference: RPA 2024 — Section 3.3.3
    """
    A   = ZONE_ACCELERATION[inp.zone]
    I   = IMPORTANCE_FACTOR[inp.importance_group]
    params = get_spectrum_params(inp.zone, inp.site_class)
    eta = get_damping_factor(inp.xi_percent)

    Sae_g, _ = compute_Sae_g(
        T=T, A=A, I=I, S=params.S, eta=eta,
        T1=params.T1, T2=params.T2, T3=params.T3,
    )

    # Apply quality factor and behaviour coefficient
    Sad_g = Sae_g * Q / R

    return Sad_g
