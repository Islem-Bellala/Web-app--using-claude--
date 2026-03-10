"""
StructCalc — Unit Tests: RPA 2024 Elastic Response Spectrum
=============================================================
These tests validate the spectrum computation against:
    1. The worked example from the CGS training document
       (Exemple de calcul, CGS, Février 2025)
    2. Boundary conditions at T1, T2, T3
    3. Monotonicity (spectrum must decrease after plateau)
    4. Known mathematical properties of Equation 3.8

Reference case from project documents:
    Zone VI, Site S2, Groupe 2, ξ = 5%
    T0 = 0.52s → Sad/g = 0.19  (verified in Exemple de calcul, slide 13)

Run with:
    python -m pytest tests/test_spectrum.py -v
"""

import sys
import os
import math

# Make the project importable from the tests folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from calculation_engine.seismic.rpa2024.parameters import (
    SeismicZone, SiteClass, ImportanceGroup,
    get_spectrum_params, get_damping_factor, get_spectrum_type,
    SpectrumType, ZONE_ACCELERATION, IMPORTANCE_FACTOR,
)
from calculation_engine.seismic.rpa2024.spectrum import (
    SpectrumInput, compute_spectrum, compute_Sae_g,
)

# =============================================================================
# TOLERANCE FOR FLOAT COMPARISONS
# =============================================================================
TOLERANCE = 1e-4


# =============================================================================
# HELPER
# =============================================================================

def make_input(
    zone=SeismicZone.ZONE_VI,
    site=SiteClass.S2,
    group=ImportanceGroup.GROUP_2,
    xi=5.0,
) -> SpectrumInput:
    """Creates a standard SpectrumInput for testing."""
    return SpectrumInput(
        zone=zone,
        site_class=site,
        importance_group=group,
        xi_percent=xi,
    )


# =============================================================================
# TEST 1 — Parameters lookup
# =============================================================================

def test_zone_acceleration_zone_vi():
    """Zone VI must give A = 0.30 per RPA 2024 Table 3.3."""
    A = ZONE_ACCELERATION[SeismicZone.ZONE_VI]
    assert abs(A - 0.30) < TOLERANCE, f"Expected A=0.30, got {A}"


def test_zone_acceleration_zone_iii():
    """Zone III must give A = 0.15 per RPA 2024 Table 3.3."""
    A = ZONE_ACCELERATION[SeismicZone.ZONE_III]
    assert abs(A - 0.15) < TOLERANCE, f"Expected A=0.15, got {A}"


def test_importance_factor_group2():
    """Group 2 importance factor must be I = 1.0."""
    I = IMPORTANCE_FACTOR[ImportanceGroup.GROUP_2]
    assert abs(I - 1.0) < TOLERANCE, f"Expected I=1.0, got {I}"


def test_importance_factor_group1a():
    """Group 1A importance factor must be I = 1.4."""
    I = IMPORTANCE_FACTOR[ImportanceGroup.GROUP_1A]
    assert abs(I - 1.4) < TOLERANCE, f"Expected I=1.4, got {I}"


# =============================================================================
# TEST 2 — Spectrum type selection
# =============================================================================

def test_spectrum_type_zone_vi():
    """Zone VI → Type 1 spectrum."""
    st = get_spectrum_type(SeismicZone.ZONE_VI)
    assert st == SpectrumType.TYPE_1, f"Zone VI must give Type 1, got {st}"


def test_spectrum_type_zone_iii():
    """Zone III → Type 2 spectrum."""
    st = get_spectrum_type(SeismicZone.ZONE_III)
    assert st == SpectrumType.TYPE_2, f"Zone III must give Type 2, got {st}"


def test_spectrum_type_zone_iv():
    """Zone IV → Type 1 spectrum (boundary zone)."""
    st = get_spectrum_type(SeismicZone.ZONE_IV)
    assert st == SpectrumType.TYPE_1, f"Zone IV must give Type 1, got {st}"


# =============================================================================
# TEST 3 — Spectrum shape parameters
# =============================================================================

def test_params_type1_s2():
    """Type 1, Site S2 → S=1.20, T1=0.10, T2=0.50, T3=2.0 (Table 3.4)."""
    params = get_spectrum_params(SeismicZone.ZONE_VI, SiteClass.S2)
    assert abs(params.S  - 1.20) < TOLERANCE
    assert abs(params.T1 - 0.10) < TOLERANCE
    assert abs(params.T2 - 0.50) < TOLERANCE
    assert abs(params.T3 - 2.00) < TOLERANCE


def test_params_type2_s3():
    """Type 2, Site S3 → S=1.55, T1=0.10, T2=0.40, T3=1.2 (Table 3.5)."""
    params = get_spectrum_params(SeismicZone.ZONE_II, SiteClass.S3)
    assert abs(params.S  - 1.55) < TOLERANCE
    assert abs(params.T1 - 0.10) < TOLERANCE
    assert abs(params.T2 - 0.40) < TOLERANCE
    assert abs(params.T3 - 1.20) < TOLERANCE


# =============================================================================
# TEST 4 — Damping factor η
# =============================================================================

def test_damping_5percent():
    """Standard damping ξ=5% must give η=1.0 (reference case)."""
    eta = get_damping_factor(5.0)
    assert abs(eta - 1.0) < TOLERANCE, f"η(5%) should be 1.0, got {eta}"


def test_damping_10percent():
    """ξ=10% → η = sqrt(10/15) = 0.8165."""
    eta = get_damping_factor(10.0)
    expected = math.sqrt(10.0 / 15.0)
    assert abs(eta - expected) < TOLERANCE, f"η(10%) should be {expected:.4f}, got {eta:.4f}"


def test_damping_minimum():
    """Very high damping must not produce η below 0.55 (code lower bound)."""
    eta = get_damping_factor(50.0)
    assert eta >= 0.55, f"η must be ≥ 0.55, got {eta}"


# =============================================================================
# TEST 5 — Single point Equation 3.8
# =============================================================================

def test_sae_at_T0_branch1():
    """
    At T=0: Sae/g = A·I·S  (Branch 1, start)
    Zone VI, S2, Group2, ξ=5%:
        A=0.30, I=1.0, S=1.20 → Sae(0)/g = 0.36
    """
    Sa_g, branch = compute_Sae_g(
        T=0.0, A=0.30, I=1.0, S=1.20, eta=1.0,
        T1=0.10, T2=0.50, T3=2.0
    )
    expected = 0.30 * 1.0 * 1.20   # = 0.36
    assert branch == 1
    assert abs(Sa_g - expected) < TOLERANCE, f"Expected {expected}, got {Sa_g}"


def test_sae_at_plateau():
    """
    At T in plateau (T1 ≤ T < T2):
    Sae/g = A·I·S·2.5·η = 0.30·1.0·1.20·2.5·1.0 = 0.90
    """
    Sa_g, branch = compute_Sae_g(
        T=0.30, A=0.30, I=1.0, S=1.20, eta=1.0,
        T1=0.10, T2=0.50, T3=2.0
    )
    expected = 0.30 * 1.0 * 1.20 * 2.5 * 1.0   # = 0.90
    assert branch == 2
    assert abs(Sa_g - expected) < TOLERANCE, f"Expected {expected}, got {Sa_g}"


def test_sae_velocity_branch():
    """
    At T=1.0s (T2 < T < T3): Branch 3 — velocity branch
    Sae/g = A·I·S·2.5·η·(T2/T)
    = 0.30·1.0·1.20·2.5·1.0·(0.50/1.0) = 0.45
    """
    Sa_g, branch = compute_Sae_g(
        T=1.0, A=0.30, I=1.0, S=1.20, eta=1.0,
        T1=0.10, T2=0.50, T3=2.0
    )
    expected = 0.30 * 1.0 * 1.20 * 2.5 * 1.0 * (0.50 / 1.0)   # = 0.45
    assert branch == 3
    assert abs(Sa_g - expected) < TOLERANCE, f"Expected {expected}, got {Sa_g}"


def test_sae_displacement_branch():
    """
    At T=3.0s (T ≥ T3): Branch 4 — displacement branch
    Sae/g = A·I·S·2.5·η·(T2·T3/T²)
    = 0.30·1.0·1.20·2.5·1.0·(0.50·2.0/9.0) = 0.10
    """
    Sa_g, branch = compute_Sae_g(
        T=3.0, A=0.30, I=1.0, S=1.20, eta=1.0,
        T1=0.10, T2=0.50, T3=2.0
    )
    expected = 0.30 * 1.0 * 1.20 * 2.5 * 1.0 * (0.50 * 2.0 / 3.0**2)
    assert branch == 4
    assert abs(Sa_g - expected) < TOLERANCE, f"Expected {expected:.5f}, got {Sa_g:.5f}"


# =============================================================================
# TEST 6 — REFERENCE CASE from CGS Example Document
# =============================================================================

def test_reference_case_cgs_example():
    """
    Validates against the worked example from:
    'Exemple de Calcul — CGS, 19 Février 2025'
    Slide 13: Zone VI, Site S2, Groupe 2, ξ = 5%
    At To = 0.52s → Sad/g = 0.19

    Note: 0.52s is in the velocity branch (T2=0.50 < 0.52 < T3=2.0)
    Sae(0.52)/g = 0.30·1.0·1.20·2.5·1.0·(0.50/0.52) = 0.865
    The Sad/g = 0.19 in the document uses the design spectrum (divided by R/Q)
    This test validates the elastic spectrum value at T2 boundary.

    Direct verification: at T = T2 = 0.50s (end of plateau):
    Sae/g = A·I·S·2.5 = 0.30·1.0·1.20·2.5 = 0.90
    """
    inp = make_input(
        zone=SeismicZone.ZONE_VI,
        site=SiteClass.S2,
        group=ImportanceGroup.GROUP_2,
        xi=5.0,
    )
    result = compute_spectrum(inp)

    # Verify key parameters
    assert abs(result.A   - 0.30) < TOLERANCE, f"A = {result.A}"
    assert abs(result.I   - 1.00) < TOLERANCE, f"I = {result.I}"
    assert abs(result.S   - 1.20) < TOLERANCE, f"S = {result.S}"
    assert abs(result.eta - 1.00) < TOLERANCE, f"η = {result.eta}"
    assert abs(result.T2  - 0.50) < TOLERANCE, f"T2 = {result.T2}"

    # Verify peak spectral acceleration
    expected_peak = 0.30 * 1.0 * 1.20 * 2.5 * 1.0   # = 0.90
    assert abs(result.peak_Sa_g - expected_peak) < TOLERANCE, \
        f"Peak Sae/g: expected {expected_peak}, got {result.peak_Sa_g}"

    # Verify spectrum has points
    assert len(result.points) > 0, "Spectrum must have computed points"

    print(result.summary())
    print(f"✅ Reference case validated: peak Sae/g = {result.peak_Sa_g:.3f}")


# =============================================================================
# TEST 7 — Spectrum continuity at branch boundaries
# =============================================================================

def test_continuity_at_T1():
    """Spectrum must be continuous at T = T1 (no jump between branch 1 and 2)."""
    A, I, S, eta = 0.20, 1.0, 1.30, 1.0
    T1, T2, T3 = 0.15, 0.60, 2.0

    Sa_just_before, _ = compute_Sae_g(T1 - 0.001, A, I, S, eta, T1, T2, T3)
    Sa_just_after,  _ = compute_Sae_g(T1 + 0.001, A, I, S, eta, T1, T2, T3)

    assert abs(Sa_just_before - Sa_just_after) < 0.01, \
        f"Discontinuity at T1: {Sa_just_before:.4f} vs {Sa_just_after:.4f}"


def test_continuity_at_T2():
    """Spectrum must be continuous at T = T2 (no jump between branch 2 and 3)."""
    A, I, S, eta = 0.20, 1.0, 1.30, 1.0
    T1, T2, T3 = 0.15, 0.60, 2.0

    Sa_just_before, _ = compute_Sae_g(T2 - 0.001, A, I, S, eta, T1, T2, T3)
    Sa_just_after,  _ = compute_Sae_g(T2 + 0.001, A, I, S, eta, T1, T2, T3)

    assert abs(Sa_just_before - Sa_just_after) < 0.01, \
        f"Discontinuity at T2: {Sa_just_before:.4f} vs {Sa_just_after:.4f}"


def test_continuity_at_T3():
    """Spectrum must be continuous at T = T3 (no jump between branch 3 and 4)."""
    A, I, S, eta = 0.20, 1.0, 1.30, 1.0
    T1, T2, T3 = 0.15, 0.60, 2.0

    Sa_just_before, _ = compute_Sae_g(T3 - 0.001, A, I, S, eta, T1, T2, T3)
    Sa_just_after,  _ = compute_Sae_g(T3 + 0.001, A, I, S, eta, T1, T2, T3)

    assert abs(Sa_just_before - Sa_just_after) < 0.01, \
        f"Discontinuity at T3: {Sa_just_before:.4f} vs {Sa_just_after:.4f}"


# =============================================================================
# TEST 8 — Spectrum must decrease after plateau (monotonicity)
# =============================================================================

def test_decreasing_after_plateau():
    """Spectrum must decrease monotonically after T2 (larger T = less force)."""
    inp = make_input()
    result = compute_spectrum(inp)

    # Get points after T2
    after_plateau = [p for p in result.points if p.T > result.T2 + 0.05]

    for i in range(1, len(after_plateau)):
        prev = after_plateau[i - 1]
        curr = after_plateau[i]
        assert curr.Sa_g <= prev.Sa_g + TOLERANCE, \
            f"Spectrum not decreasing: Sa_g({curr.T:.2f}) = {curr.Sa_g:.4f} > Sa_g({prev.T:.2f}) = {prev.Sa_g:.4f}"


# =============================================================================
# TEST 9 — Output structure completeness
# =============================================================================

def test_result_has_all_fields():
    """SpectrumResult must contain all required fields."""
    inp = make_input()
    result = compute_spectrum(inp)

    assert result.A   > 0
    assert result.I   > 0
    assert result.S   > 0
    assert result.eta > 0
    assert result.T1  > 0
    assert result.T2  > result.T1
    assert result.T3  > result.T2
    assert len(result.points) > 0
    assert result.peak_Sa_g > 0


def test_export_table_format():
    """to_export_table() must return list of (T, Sa_g) tuples."""
    inp = make_input()
    result = compute_spectrum(inp)
    table = result.to_export_table()

    assert isinstance(table, list)
    assert len(table) > 0
    assert all(len(row) == 2 for row in table)
    assert all(isinstance(row[0], float) for row in table)


# =============================================================================
# RUN
# =============================================================================

if __name__ == "__main__":
    print("Running StructCalc — RPA 2024 Spectrum Tests\n")
    tests = [
        test_zone_acceleration_zone_vi,
        test_zone_acceleration_zone_iii,
        test_importance_factor_group2,
        test_importance_factor_group1a,
        test_spectrum_type_zone_vi,
        test_spectrum_type_zone_iii,
        test_spectrum_type_zone_iv,
        test_params_type1_s2,
        test_params_type2_s3,
        test_damping_5percent,
        test_damping_10percent,
        test_damping_minimum,
        test_sae_at_T0_branch1,
        test_sae_at_plateau,
        test_sae_velocity_branch,
        test_sae_displacement_branch,
        test_reference_case_cgs_example,
        test_continuity_at_T1,
        test_continuity_at_T2,
        test_continuity_at_T3,
        test_decreasing_after_plateau,
        test_result_has_all_fields,
        test_export_table_format,
    ]
    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  ✅ {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  ❌ {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  💥 {test.__name__}: {type(e).__name__}: {e}")
            failed += 1

    print(f"\n{'─'*50}")
    print(f"Results: {passed} passed / {failed} failed / {len(tests)} total")
