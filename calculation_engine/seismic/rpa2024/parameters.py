"""
StructCalc — RPA 2024 Seismic Parameters
==========================================
This module encodes all classification tables from RPA 2024 (DTR BC 2.48)
that are required to define the seismic action.

All data is taken directly from the published code:
    - Table 3.3  → Seismic zone acceleration coefficients A
    - Table 3.4  → Spectrum Type 1 parameters (Zones IV, V, VI)
    - Table 3.5  → Spectrum Type 2 parameters (Zones I, II, III)
    - Table 3.6  → Damping ratios ξ by structure type
    - Section 3.4 → Importance coefficients I
    - Section 3.6 → Behaviour coefficients R

Engineering Core Isolation Principle:
    This module contains ONLY code data (constants and lookup functions).
    No API code, no database, no UI logic.

Code references:
    RPA 2024 — DTR BC 2.48
    Chapter 3: Critères de Classification
    Sections 3.1, 3.2, 3.3, 3.4, 3.6, 3.8
"""

from dataclasses import dataclass
from enum import Enum
from typing import Dict


# =============================================================================
# SEISMIC ZONES — Table 3.3
# =============================================================================

class SeismicZone(Enum):
    """
    Seven seismic zones defined for the Algerian territory.
    RPA 2024 — Table 3.3
    """
    ZONE_0  = "0"    # Très faible — A not defined (wind governs)
    ZONE_I  = "I"    # Faible
    ZONE_II = "II"   # Faible à moyenne
    ZONE_III = "III" # Moyenne
    ZONE_IV = "IV"   # Moyenne à élevée
    ZONE_V  = "V"    # Élevée
    ZONE_VI = "VI"   # Élevée


# Acceleration coefficient A at rock (S1) for Tr = 475 years
# RPA 2024 — Table 3.3
ZONE_ACCELERATION: Dict[SeismicZone, float] = {
    SeismicZone.ZONE_0:   0.00,   # governed by wind
    SeismicZone.ZONE_I:   0.07,
    SeismicZone.ZONE_II:  0.10,
    SeismicZone.ZONE_III: 0.15,
    SeismicZone.ZONE_IV:  0.20,
    SeismicZone.ZONE_V:   0.25,
    SeismicZone.ZONE_VI:  0.30,
}


# =============================================================================
# SITE CLASSES — Section 3.2
# =============================================================================

class SiteClass(Enum):
    """
    Five site classes defined by soil mechanical properties.
    Classification based on Vs,30 (average shear wave velocity over 30m).
    RPA 2024 — Section 3.2 and Table 3.2
    """
    S1 = "S1"   # Rocher / Rock                (Vs,30 > 800 m/s)
    S2 = "S2"   # Site ferme / Firm soil        (360 < Vs,30 ≤ 800 m/s)
    S3 = "S3"   # Site meuble / Medium soil     (180 < Vs,30 ≤ 360 m/s)
    S4 = "S4"   # Site très meuble / Soft soil  (Vs,30 ≤ 180 m/s)
    S5 = "S5"   # Site spécial (requires site-specific study)


# =============================================================================
# SPECTRUM TYPE — Section 3.3.1
# =============================================================================

class SpectrumType(Enum):
    """
    Two spectrum shapes defined based on dominant earthquake magnitude.
    RPA 2024 — Section 3.3.1

    Type 1: Applied to zones IV, V, VI (Mw ≥ 5.5)
    Type 2: Applied to zones I, II, III (Mw ≤ 5.5)
    """
    TYPE_1 = "Type1"   # Zones IV, V, VI — séismes de forte magnitude
    TYPE_2 = "Type2"   # Zones I, II, III — séismes de faible magnitude


def get_spectrum_type(zone: SeismicZone) -> SpectrumType:
    """
    Returns the spectrum type for a given seismic zone.
    RPA 2024 — Section 3.3.1

    Args:
        zone: Seismic zone of the site

    Returns:
        SpectrumType.TYPE_1 for zones IV, V, VI
        SpectrumType.TYPE_2 for zones I, II, III
    """
    type1_zones = {SeismicZone.ZONE_IV, SeismicZone.ZONE_V, SeismicZone.ZONE_VI}
    if zone in type1_zones:
        return SpectrumType.TYPE_1
    return SpectrumType.TYPE_2


# =============================================================================
# SPECTRUM SHAPE PARAMETERS — Tables 3.4 and 3.5
# =============================================================================

@dataclass(frozen=True)
class SpectrumShapeParams:
    """
    Shape parameters that define the spectrum branches.
    RPA 2024 — Equation 3.8

    Attributes:
        S:  Site coefficient (amplification factor)
        T1: Start of constant acceleration plateau (s)
        T2: End of constant acceleration plateau (s)
        T3: Start of constant displacement branch (s)
    """
    S:  float   # Site coefficient
    T1: float   # seconds
    T2: float   # seconds
    T3: float   # seconds


# Type 1 spectrum — Zones IV, V, VI
# RPA 2024 — Table 3.4
SPECTRUM_TYPE1_PARAMS: Dict[SiteClass, SpectrumShapeParams] = {
    SiteClass.S1: SpectrumShapeParams(S=1.00, T1=0.10, T2=0.40, T3=2.0),
    SiteClass.S2: SpectrumShapeParams(S=1.20, T1=0.10, T2=0.50, T3=2.0),
    SiteClass.S3: SpectrumShapeParams(S=1.30, T1=0.15, T2=0.60, T3=2.0),
    SiteClass.S4: SpectrumShapeParams(S=1.35, T1=0.15, T2=0.70, T3=2.0),
}

# Type 2 spectrum — Zones I, II, III
# RPA 2024 — Table 3.5
SPECTRUM_TYPE2_PARAMS: Dict[SiteClass, SpectrumShapeParams] = {
    SiteClass.S1: SpectrumShapeParams(S=1.00, T1=0.05, T2=0.25, T3=1.2),
    SiteClass.S2: SpectrumShapeParams(S=1.30, T1=0.05, T2=0.30, T3=1.2),
    SiteClass.S3: SpectrumShapeParams(S=1.55, T1=0.10, T2=0.40, T3=1.2),
    SiteClass.S4: SpectrumShapeParams(S=1.80, T1=0.10, T2=0.50, T3=1.2),
}


def get_spectrum_params(zone: SeismicZone, site: SiteClass) -> SpectrumShapeParams:
    """
    Returns the spectrum shape parameters for a given zone and site class.
    Automatically selects Type 1 or Type 2 based on the zone.

    Args:
        zone: Seismic zone (I to VI)
        site: Soil class (S1 to S4)

    Returns:
        SpectrumShapeParams with S, T1, T2, T3 values

    Raises:
        ValueError: If site class S5 is provided (requires specific study)

    Code reference: RPA 2024 — Tables 3.4 & 3.5
    """
    if site == SiteClass.S5:
        raise ValueError(
            "Site class S5 requires a site-specific geotechnical study. "
            "Standard spectrum parameters cannot be applied. (RPA 2024 §3.2)"
        )

    spectrum_type = get_spectrum_type(zone)

    if spectrum_type == SpectrumType.TYPE_1:
        return SPECTRUM_TYPE1_PARAMS[site]
    else:
        return SPECTRUM_TYPE2_PARAMS[site]


# =============================================================================
# DAMPING CORRECTION FACTOR — Equation 3.9
# =============================================================================

def get_damping_factor(xi_percent: float) -> float:
    """
    Calculates the viscous damping correction factor η (eta).

    Formula: η = sqrt(10 / (5 + ξ))   [Equation 3.9, RPA 2024]
    Constraint: η ≥ 0.55

    Args:
        xi_percent: Viscous damping ratio ξ in PERCENT (e.g. 5.0 for 5%)

    Returns:
        η — damping correction factor (dimensionless)

    Example:
        ξ = 5%  → η = sqrt(10/10) = 1.00  (reference case)
        ξ = 10% → η = sqrt(10/15) = 0.816

    Code reference: RPA 2024 — Equation 3.9
    """
    eta = (10.0 / (5.0 + xi_percent)) ** 0.5
    return max(eta, 0.55)   # lower bound per RPA 2024


# Typical damping values by structure type — Table 3.6
# RPA 2024 — Table 3.6
DAMPING_VALUES = {
    "portique_ba_leger":   6,    # Ossature BA, remplissage léger
    "portique_ba_dense":   7,    # Ossature BA, remplissage dense
    "portique_acier_leger": 4,   # Ossature acier, remplissage léger
    "portique_acier_dense": 5,   # Ossature acier, remplissage dense
    "voiles_ba":           10,   # Voiles / noyaux béton armé
}


# =============================================================================
# IMPORTANCE CATEGORIES — Section 3.4
# =============================================================================

class ImportanceGroup(Enum):
    """
    Building importance classification.
    RPA 2024 — Section 3.4

    Group 1A: Critical infrastructure (hospitals, power plants, etc.)
    Group 1B: High importance (schools, admin buildings > 200 persons)
    Group 2:  Normal importance (standard residential, commercial)
    Group 3:  Low importance (agricultural, temporary)
    """
    GROUP_1A = "1A"
    GROUP_1B = "1B"
    GROUP_2  = "2"
    GROUP_3  = "3"


# Importance coefficients I
# RPA 2024 — Tables 3.11 and I.1
IMPORTANCE_FACTOR: Dict[ImportanceGroup, float] = {
    ImportanceGroup.GROUP_1A: 1.4,
    ImportanceGroup.GROUP_1B: 1.2,
    ImportanceGroup.GROUP_2:  1.0,
    ImportanceGroup.GROUP_3:  0.8,
}


# =============================================================================
# BEHAVIOUR COEFFICIENT R — Section 3.6
# =============================================================================

# Behaviour coefficients R by structural system
# RPA 2024 — Section 3.5 and 3.6
# Higher R = more ductile system = lower design forces
BEHAVIOUR_COEFFICIENTS = {
    # Système 1: Ossatures en portiques
    "portiques_ba":                  5.0,   # Béton armé
    "portiques_acier":               6.0,   # Acier

    # Système 2: Ossatures avec remplissage en maçonnerie
    "portiques_remplissage_ba":      3.5,
    "portiques_remplissage_acier":   4.0,

    # Système 3: Contreventement mixte équivalent à ossature
    "mixte_ossature_ba":             5.0,
    "mixte_ossature_acier":          6.0,

    # Système 4: Contreventement mixte équivalent à voiles
    "mixte_voiles_ba":               4.0,

    # Système 5: Contreventement par voiles BA
    "voiles_ba":                     3.5,

    # Système 6: Maçonnerie porteuse chainée
    "maconnerie_chainee":            2.0,

    # Isolation sismique
    "isolation_sismique":            1.5,
}


# =============================================================================
# QUALITY FACTOR Q — Section 3.8
# =============================================================================

class QualityPenalty(Enum):
    """
    The six quality criteria evaluated per RPA 2024 §3.8.
    Each criterion that is NOT satisfied adds a penalty ΔQi to Q.
    """
    REDUNDANCY           = "q1"   # Redondance du système de contreventement
    GEOMETRY             = "q2"   # Régularité géométrique en plan et en élévation
    DIAPHRAGM            = "q3"   # Planchers en tant que diaphragmes
    SHORT_COLUMNS        = "q4"   # Absence de colonnes courtes
    MASONRY_INFILL       = "q5"   # Remplissage en maçonnerie
    CONSTRUCTION_CONTROL = "q6"   # Contrôle de la qualité des matériaux et de l'exécution


# Penalty values ΔQi for each unsatisfied criterion
# RPA 2024 — Table 3.16
QUALITY_PENALTIES: Dict[QualityPenalty, float] = {
    QualityPenalty.REDUNDANCY:           0.05,
    QualityPenalty.GEOMETRY:             0.05,
    QualityPenalty.DIAPHRAGM:            0.05,
    QualityPenalty.SHORT_COLUMNS:        0.05,
    QualityPenalty.MASONRY_INFILL:       0.05,
    QualityPenalty.CONSTRUCTION_CONTROL: 0.10,
}

Q_MIN = 1.00
Q_MAX = 1.40


def compute_quality_factor(unsatisfied: list) -> float:
    """
    Computes the quality factor Q based on unsatisfied criteria.

    Q = 1 + Σ(ΔQi for each unsatisfied criterion)
    Bounded: 1.00 ≤ Q ≤ 1.40

    Args:
        unsatisfied: List of QualityPenalty items that are NOT satisfied

    Returns:
        Q — quality factor (dimensionless)

    Code reference: RPA 2024 — Section 3.8, Table 3.16
    """
    q = 1.0 + sum(QUALITY_PENALTIES[criterion] for criterion in unsatisfied)
    return min(max(q, Q_MIN), Q_MAX)
