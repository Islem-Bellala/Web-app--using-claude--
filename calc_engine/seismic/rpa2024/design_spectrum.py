"""
StructCalc — RPA 2024 Design Response Spectra
==============================================
Implements the design (reduced) response spectra:
    - Horizontal : Sad(T)/g  —  RPA 2024 Eq.3.15
    - Vertical   : Svd(T)/g  —  RPA 2024 Eq.3.16

These are the spectra used directly in structural analysis and exported to
Robot Structural Analysis / ETABS.  They differ from the elastic spectrum
(spectrum.py) in three important ways:

    1.  The quality factor QF (irregularity penalty) is applied — Eq.3.15
    2.  The behaviour coefficient R (ductility reduction) is applied — Eq.3.15
    3.  A minimum floor  0.2·A·I  is enforced (minimum seismic action)

For the vertical component (Eq.3.16), the code fixes R = 1.5 and QF = 1.0,
and uses a power exponent alpha that depends on the soil class and zone type.

Engineering Core Isolation Principle:
    This module contains ONLY engineering formulas.
    No FastAPI routes, no database calls, no UI code.

Code reference:
    RPA 2024 — DTR BC 2.48
    §3.3.3 — Spectre de calcul horizontal    (Equation 3.15)
    §3.3.3 — Spectre de calcul vertical      (Equation 3.16)
    Tables 3.4 & 3.5 — horizontal shape parameters (T1, T2, T3, S)
    Tables 3.6 & 3.7 — vertical shape parameters  (vRatio, T1, T2, T3, alpha)
"""

from dataclasses import dataclass, field
from typing import List

from .parameters import (
    SeismicZone,
    SiteClass,
    ImportanceGroup,
    ZONE_ACCELERATION,
    IMPORTANCE_FACTOR,
    get_spectrum_params,
    get_spectrum_type,
)


# =============================================================================
# VERTICAL SPECTRUM SHAPE PARAMETERS
# =============================================================================
# These tables extend parameters.py with the vertical spectrum data.
# Source: RPA 2024 — Tables 3.6 (Type 1) and 3.7 (Type 2)
#
# vRatio : Av = vRatio × A  (vertical acceleration coefficient)
# T1, T2 : corner periods of the plateau (seconds)
# T3     : start of the displacement branch (seconds)
# alpha  : power exponent used in velocity and displacement branches (Eq.3.16)
# =============================================================================

@dataclass(frozen=True)
class VerticalShapeParams:
    """Vertical spectrum shape parameters for one soil class."""
    vRatio: float   # Av = vRatio × A
    T1:     float   # s — lower corner of plateau
    T2:     float   # s — upper corner of plateau
    T3:     float   # s — start of displacement branch
    alpha:  float   # branch exponent for Eq.3.16 velocity/displacement branches


# Type 1 — high seismicity zones (IV, V, VI)
# RPA 2024 — Table 3.6
_VERT_TYPE1: dict[str, VerticalShapeParams] = {
    "S1": VerticalShapeParams(vRatio=0.90, T1=0.05, T2=0.20, T3=1.0, alpha=0.6),
    "S2": VerticalShapeParams(vRatio=0.90, T1=0.05, T2=0.30, T3=1.0, alpha=0.6),
    "S3": VerticalShapeParams(vRatio=0.90, T1=0.05, T2=0.40, T3=1.0, alpha=0.6),
    "S4": VerticalShapeParams(vRatio=0.90, T1=0.05, T2=0.50, T3=1.0, alpha=0.6),
}

# Type 2 — low to moderate seismicity zones (I, II, III)
# RPA 2024 — Table 3.7
_VERT_TYPE2: dict[str, VerticalShapeParams] = {
    "S1": VerticalShapeParams(vRatio=0.55, T1=0.05, T2=0.15, T3=1.0, alpha=0.8),
    "S2": VerticalShapeParams(vRatio=0.55, T1=0.05, T2=0.20, T3=1.0, alpha=0.8),
    "S3": VerticalShapeParams(vRatio=0.55, T1=0.05, T2=0.25, T3=1.0, alpha=0.8),
    "S4": VerticalShapeParams(vRatio=0.55, T1=0.05, T2=0.30, T3=1.0, alpha=0.8),
}

_TYPE1_ZONES = {"IV", "V", "VI"}


def get_vertical_params(zone: SeismicZone, site_class: SiteClass) -> VerticalShapeParams:
    """Returns the vertical spectrum shape parameters for the given zone and site."""
    table = _VERT_TYPE1 if zone.value in _TYPE1_ZONES else _VERT_TYPE2
    return table[site_class.value]


# =============================================================================
# HORIZONTAL DESIGN SPECTRUM — Equation 3.15
# =============================================================================

def compute_Sad_g(
    T:  float,
    A:  float,
    I:  float,
    S:  float,
    QF: float,
    R:  float,
    T1: float,
    T2: float,
    T3: float,
) -> float:
    """
    Computes Sad(T)/g for a single period T.

    This is the horizontal design spectral acceleration normalised by g.
    It incorporates the ductility reduction (R) and irregularity penalty (QF).

    The four branches of Equation 3.15:

        Branch 1 — Rising (0 ≤ T < T1):
            Sad/g = A·I·S · [2/3 + (T/T1)·(2.5·(QF/R) − 2/3)]
            At T = 0   → Sad/g = (2/3)·A·I·S          (PGA contribution)
            At T = T1  → Sad/g = 2.5·(QF/R)·A·I·S     (joins plateau)

        Branch 2 — Plateau (T1 ≤ T < T2):
            Sad/g = A·I·S · 2.5 · (QF/R)
            Maximum design acceleration — most demanding for stiff structures.

        Branch 3 — Velocity branch (T2 ≤ T < T3):
            Sad/g = A·I·S · 2.5 · (QF/R) · (T2/T)
            Proportional to 1/T — flexible structures attract less force.

        Branch 4 — Displacement branch (T3 ≤ T ≤ 4s):
            Sad/g = A·I·S · 2.5 · (QF/R) · (T2·T3 / T²)
            Proportional to 1/T² — very flexible structures.

    Floor: max(Sad, 0.2·A·I) — minimum seismic action per RPA 2024

    Args:
        T:   Period of vibration (seconds)
        A:   Zone acceleration coefficient
        I:   Importance factor
        S:   Site coefficient (horizontal)
        QF:  Quality factor  (≥ 1.0 — irregularity penalty)
        R:   Behaviour coefficient (ductility reduction)
        T1:  Lower corner period of the plateau (s)
        T2:  Upper corner period of the plateau (s)
        T3:  Start of the displacement branch (s)

    Returns:
        Sad(T)/g — horizontal design spectral acceleration / g

    Code reference: RPA 2024 — §3.3.3, Equation 3.15
    """
    base  = A * I * S
    g     = QF / R          # effective combined reduction factor
    floor = 0.2 * A * I     # minimum seismic action

    T_clip = min(T, 4.0)    # spectrum defined up to 4s per RPA 2024

    if T < T1:
        value = base * (2.0/3.0 + (T / T1) * (2.5 * g - 2.0/3.0))
    elif T < T2:
        value = base * 2.5 * g
    elif T < T3:
        value = base * 2.5 * g * (T2 / T)
    else:
        value = base * 2.5 * g * (T2 * T3 / T_clip ** 2)

    return max(value, floor)


# =============================================================================
# VERTICAL DESIGN SPECTRUM — Equation 3.16
# =============================================================================

def compute_Svd_g(
    T:     float,
    Av:    float,
    I:     float,
    T1:    float,
    T2:    float,
    T3:    float,
    alpha: float,
) -> float:
    """
    Computes Svd(T)/g for a single period T.

    This is the vertical design spectral acceleration normalised by g.
    Per RPA 2024, the vertical component uses FIXED parameters:
        R  = 1.5   (limited ductility in vertical direction)
        QF = 1.0   (no quality penalty for vertical)

    The four branches of Equation 3.16 (note the alpha exponent):

        Branch 1 — Rising (0 ≤ T < T1):
            Svd/g = Av·I · [2/3 + (T/T1)·(2.5/1.5 − 2/3)]

        Branch 2 — Plateau (T1 ≤ T < T2):
            Svd/g = Av·I · (2.5/1.5)

        Branch 3 — Velocity branch (T2 ≤ T < T3):
            Svd/g = Av·I · (2.5/1.5) · (T2/T)^alpha

        Branch 4 — Displacement branch (T3 ≤ T ≤ 4s):
            Svd/g = Av·I · (2.5/1.5) · (T2·T3/T²)^alpha

    Floor: max(Svd, 0.2·Av·I)

    Args:
        T:     Period (seconds)
        Av:    Vertical acceleration coefficient (= vRatio × A)
        I:     Importance factor
        T1:    Lower corner period (s)
        T2:    Upper corner period (s)
        T3:    Start of displacement branch (s)
        alpha: Power exponent (0.6 for Type 1, 0.8 for Type 2)

    Returns:
        Svd(T)/g — vertical design spectral acceleration / g

    Code reference: RPA 2024 — §3.3.3, Equation 3.16
    """
    g_v   = 1.0 / 1.5      # R=1.5, QF=1.0 — fixed for vertical component
    floor = 0.2 * Av * I

    T_clip = min(T, 4.0)

    if T < T1:
        value = Av * I * (2.0/3.0 + (T / T1) * (2.5 * g_v - 2.0/3.0))
    elif T < T2:
        value = Av * I * 2.5 * g_v
    elif T < T3:
        value = Av * I * 2.5 * g_v * (T2 / T) ** alpha
    else:
        value = Av * I * 2.5 * g_v * (T2 * T3 / T_clip ** 2) ** alpha

    return max(value, floor)


# =============================================================================
# DATA CLASSES
# =============================================================================

@dataclass
class DesignSpectrumInput:
    """
    All inputs needed to compute both the horizontal and vertical design spectra.

    Attributes:
        zone:             Seismic zone (I to VI)
        site_class:       Soil classification (S1 to S4)
        importance_group: Building importance group (1A, 1B, 2, 3)
        QF:               Quality factor — from compute_quality_factor()
        R:                Behaviour coefficient — from structural system table
        T_start:          Start of period range (s), default 0.0
        T_end:            End of period range (s), default 4.0
        T_step:           Period step (s), default 0.01
    """
    zone:             SeismicZone
    site_class:       SiteClass
    importance_group: ImportanceGroup
    QF:               float          # quality factor ≥ 1.0
    R:                float          # behaviour coefficient
    T_start:          float = 0.0
    T_end:            float = 4.0
    T_step:           float = 0.01


@dataclass
class SpectrumPoint:
    """One point on a design spectrum curve."""
    T:    float   # period (seconds)
    Sa_g: float   # spectral acceleration / g (dimensionless)


@dataclass
class SpectrumCurve:
    """A complete design spectrum curve — horizontal or vertical."""
    T1:     float                        # lower corner of plateau (s)
    T2:     float                        # upper corner of plateau (s)
    T3:     float                        # start of displacement branch (s)
    peak:   float                        # plateau value Sad or Svd at T1–T2
    floor:  float                        # minimum ordinate (0.2·A·I or 0.2·Av·I)
    points: List[SpectrumPoint] = field(default_factory=list)


@dataclass
class DesignSpectraResult:
    """
    Complete result: horizontal + vertical design spectra, with all
    intermediate values for full engineering traceability.

    Attributes:
        zone:          Zone string ("I" to "VI")
        spectrum_type: "Type 1" or "Type 2"
        A:             Zone acceleration coefficient
        I:             Importance factor
        S:             Horizontal site coefficient
        Av:            Vertical acceleration coefficient (= vRatio × A)
        QF:            Quality factor used
        R:             Behaviour coefficient used
        horizontal:    Sad(T)/g curve — Eq.3.15
        vertical:      Svd(T)/g curve — Eq.3.16
    """
    zone:          str
    spectrum_type: str
    A:             float
    I:             float
    S:             float
    Av:            float
    QF:            float
    R:             float
    horizontal:    SpectrumCurve
    vertical:      SpectrumCurve

    def summary(self) -> str:
        return (
            f"RPA 2024 — Design Response Spectra\n"
            f"{'─' * 42}\n"
            f"  Spectrum type : {self.spectrum_type}\n"
            f"  Zone          : {self.zone}  →  A = {self.A}\n"
            f"  Site          : {self.zone}  →  S = {self.S}\n"
            f"  Importance    : I = {self.I}\n"
            f"  QF = {self.QF}   R = {self.R}\n"
            f"{'─' * 42}\n"
            f"  Horizontal Sad(T1–T2)/g : {self.horizontal.peak:.5f}\n"
            f"  Vertical   Svd(T1–T2)/g : {self.vertical.peak:.5f}\n"
            f"  Floor Sad (0.2·A·I)     : {self.horizontal.floor:.5f}\n"
        )


# =============================================================================
# MAIN COMPUTATION FUNCTION
# =============================================================================

def compute_design_spectra(inp: DesignSpectrumInput) -> DesignSpectraResult:
    """
    Computes both horizontal (Eq.3.15) and vertical (Eq.3.16) design spectra
    for the full period range defined in inp.

    Workflow:
        1. Look up A from zone table
        2. Look up I from importance table
        3. Look up horizontal shape params (S, T1, T2, T3) from zone + site tables
        4. Look up vertical shape params (vRatio, T1, T2, T3, alpha) from zone + site tables
        5. Compute Av = vRatio × A
        6. Loop over periods and apply Eq.3.15 for horizontal
        7. Loop over periods and apply Eq.3.16 for vertical
        8. Return DesignSpectraResult with all values

    Args:
        inp: DesignSpectrumInput with all required parameters

    Returns:
        DesignSpectraResult with both spectra and all intermediate values

    Code reference: RPA 2024 — §3.3.3, Equations 3.15 and 3.16
    """

    # ── Step 1–2: Code coefficients ───────────────────────────────────────────
    A = ZONE_ACCELERATION[inp.zone]
    I = IMPORTANCE_FACTOR[inp.importance_group]

    # ── Step 3: Horizontal shape parameters ───────────────────────────────────
    h_params = get_spectrum_params(inp.zone, inp.site_class)

    # ── Step 4–5: Vertical shape parameters and Av ────────────────────────────
    v_params = get_vertical_params(inp.zone, inp.site_class)
    Av = round(v_params.vRatio * A, 6)

    # ── Spectrum type label ────────────────────────────────────────────────────
    spec_type = get_spectrum_type(inp.zone)
    type_label = spec_type.value    # "Type 1" or "Type 2"

    # ── Step 6: Horizontal spectrum ────────────────────────────────────────────
    h_peak  = round(A * I * h_params.S * 2.5 * (inp.QF / inp.R), 6)
    h_floor = round(0.2 * A * I, 6)

    h_points: List[SpectrumPoint] = []
    T = inp.T_start
    while T <= inp.T_end + 1e-9:
        T_r = round(T, 6)
        Sa_g = compute_Sad_g(
            T=T_r,
            A=A, I=I, S=h_params.S,
            QF=inp.QF, R=inp.R,
            T1=h_params.T1, T2=h_params.T2, T3=h_params.T3,
        )
        h_points.append(SpectrumPoint(T=T_r, Sa_g=round(Sa_g, 6)))
        T = round(T + inp.T_step, 9)

    horiz = SpectrumCurve(
        T1=h_params.T1, T2=h_params.T2, T3=h_params.T3,
        peak=h_peak, floor=h_floor,
        points=h_points,
    )

    # ── Step 7: Vertical spectrum ──────────────────────────────────────────────
    v_peak  = round(Av * I * 2.5 / 1.5, 6)
    v_floor = round(0.2 * Av * I, 6)

    v_points: List[SpectrumPoint] = []
    T = inp.T_start
    while T <= inp.T_end + 1e-9:
        T_r = round(T, 6)
        Sv_g = compute_Svd_g(
            T=T_r, Av=Av, I=I,
            T1=v_params.T1, T2=v_params.T2, T3=v_params.T3,
            alpha=v_params.alpha,
        )
        v_points.append(SpectrumPoint(T=T_r, Sa_g=round(Sv_g, 6)))
        T = round(T + inp.T_step, 9)

    vert = SpectrumCurve(
        T1=v_params.T1, T2=v_params.T2, T3=v_params.T3,
        peak=v_peak, floor=v_floor,
        points=v_points,
    )

    # ── Step 8: Return complete result ─────────────────────────────────────────
    return DesignSpectraResult(
        zone=inp.zone.value,
        spectrum_type=type_label,
        A=A, I=I,
        S=h_params.S,
        Av=Av,
        QF=inp.QF, R=inp.R,
        horizontal=horiz,
        vertical=vert,
    )
