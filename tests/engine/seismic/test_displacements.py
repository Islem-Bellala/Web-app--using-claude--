"""
Tests for calc_engine/seismic/rpa2024/displacements.py

Covers:
    - δk = (R / QF) × δek  (Eq 4.15)
    - Δk = δk − δk−1        (Eq 4.16)
    - Non-effondrement drift check (Table 5.2)
    - Damage limitation check §5.10.2 (νA × Δk ≤ limit × hk)
    - All structure types
    - Edge cases: dek=0, single story
"""

import pytest
from calc_engine.seismic.rpa2024.displacements import (
    compute_displacements,
    TABLE_5_2,
    DAMAGE_LIMITS,
    NU_A,
)


# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

def make_stories(n: int, hk: float = 3.0, dek_x: float = 0.0, dek_y: float = 0.0):
    """Create n identical stories."""
    return [
        {"hk": hk, "dek_x": dek_x, "dek_y": dek_y}
        for _ in range(n)
    ]


# ---------------------------------------------------------------------------
# Basic displacement formula  δk = (R / QF) × δek
# ---------------------------------------------------------------------------

class TestDisplacementFormula:

    def test_dk_equals_R_over_QF_times_dek(self):
        """δk = (R / QF) × δek — fundamental formula check."""
        R, QF = 4.5, 1.25
        stories = make_stories(1, hk=3.0, dek_x=0.010)
        res_x, _ = compute_displacements(stories, R, QF, "beton_arme", "fragile")

        expected_dk = (R / QF) * 0.010
        assert abs(res_x.stories[0].dk - expected_dk) < 1e-9

    def test_NOT_R_times_QF(self):
        """Confirm we use R/QF not R×QF (the corrected formula)."""
        R, QF = 4.5, 1.25
        stories = make_stories(1, hk=3.0, dek_x=0.010)
        res_x, _ = compute_displacements(stories, R, QF, "beton_arme", "fragile")

        wrong_dk = R * QF * 0.010
        assert abs(res_x.stories[0].dk - wrong_dk) > 1e-6  # must differ

    def test_delta_k_first_story_equals_dk(self):
        """First story: Δk = dk − 0 = dk."""
        R, QF = 5.0, 1.0
        stories = make_stories(1, hk=3.0, dek_x=0.005)
        res_x, _ = compute_displacements(stories, R, QF, "beton_arme", "fragile")
        s = res_x.stories[0]
        assert abs(s.delta_k - s.dk) < 1e-9

    def test_delta_k_relative_drift(self):
        """For 3 stories with increasing dek, Δk = dk − dk_prev."""
        R, QF = 5.0, 1.0
        stories = [
            {"hk": 3.0, "dek_x": 0.005, "dek_y": 0.0},
            {"hk": 3.0, "dek_x": 0.012, "dek_y": 0.0},
            {"hk": 3.0, "dek_x": 0.018, "dek_y": 0.0},
        ]
        res_x, _ = compute_displacements(stories, R, QF, "beton_arme", "fragile")

        amp = R / QF
        dk0 = amp * 0.005
        dk1 = amp * 0.012
        dk2 = amp * 0.018

        assert abs(res_x.stories[0].delta_k - dk0) < 1e-9
        assert abs(res_x.stories[1].delta_k - (dk1 - dk0)) < 1e-9
        assert abs(res_x.stories[2].delta_k - (dk2 - dk1)) < 1e-9


# ---------------------------------------------------------------------------
# 3-story building — combined verification
# ---------------------------------------------------------------------------

class TestThreeStoryBuilding:

    @pytest.fixture
    def three_story_result(self):
        R, QF = 5.0, 1.25
        stories = [
            {"hk": 3.0, "dek_x": 0.003, "dek_y": 0.002},
            {"hk": 3.0, "dek_x": 0.007, "dek_y": 0.005},
            {"hk": 3.0, "dek_x": 0.010, "dek_y": 0.008},
        ]
        return compute_displacements(stories, R, QF, "beton_arme", "fragile")

    def test_story_count(self, three_story_result):
        res_x, res_y = three_story_result
        assert len(res_x.stories) == 3
        assert len(res_y.stories) == 3

    def test_level_indices(self, three_story_result):
        res_x, _ = three_story_result
        assert [s.level for s in res_x.stories] == [1, 2, 3]

    def test_dk_values_x(self, three_story_result):
        res_x, _ = three_story_result
        amp = 5.0 / 1.25
        expected = [amp * d for d in [0.003, 0.007, 0.010]]
        for s, exp in zip(res_x.stories, expected):
            assert abs(s.dk - exp) < 1e-9

    def test_drift_ratio(self, three_story_result):
        res_x, _ = three_story_result
        for s in res_x.stories:
            assert abs(s.drift - s.delta_k / s.hk) < 1e-12


# ---------------------------------------------------------------------------
# Drift limit checks — Table 5.2
# ---------------------------------------------------------------------------

class TestDriftLimits:

    @pytest.mark.parametrize("struct_type,limit", list(TABLE_5_2.items()))
    def test_drift_limit_ne_value(self, struct_type, limit):
        """drift_limit_ne = TABLE_5_2[type] × hk."""
        stories = make_stories(1, hk=4.0, dek_x=0.001)
        res_x, _ = compute_displacements(stories, 5.0, 1.0, struct_type, "fragile")
        assert abs(res_x.stories[0].drift_limit_ne - limit * 4.0) < 1e-9

    def test_ok_ne_passes_when_within_limit(self):
        """Story passes non-effondrement check when Δk ≤ limit × hk."""
        # beton_arme limit = 0.015, hk=3.0 → limit = 0.045 m
        # R/QF=5.0, dek_x=0.008 → dk=0.040 → Δk=0.040 (first story)
        stories = make_stories(1, hk=3.0, dek_x=0.008)
        res_x, _ = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        assert res_x.stories[0].ok_ne is True

    def test_ok_ne_fails_when_exceeded(self):
        """Story fails non-effondrement check when Δk > limit × hk."""
        # beton_arme limit = 0.015, hk=3.0 → limit = 0.045 m
        # R/QF=5.0, dek_x=0.010 → dk=0.050 → Δk=0.050 > 0.045
        stories = make_stories(1, hk=3.0, dek_x=0.010)
        res_x, _ = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        assert res_x.stories[0].ok_ne is False
        assert res_x.all_ok_ne is False

    def test_maconnerie_strictest_limit(self):
        """Maçonnerie has 0.010 limit — stricter than beton_arme."""
        assert TABLE_5_2["maconnerie"] == 0.010
        assert TABLE_5_2["beton_arme"] == 0.015


# ---------------------------------------------------------------------------
# Damage limitation check — §5.10.2
# ---------------------------------------------------------------------------

class TestDamageLimitation:

    def test_damage_value_is_nu_a_times_delta_k(self):
        """damage_value = νA × Δk."""
        stories = make_stories(1, hk=3.0, dek_x=0.005)
        res_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "fragile")
        s = res_x.stories[0]
        assert abs(s.damage_value - NU_A * s.delta_k) < 1e-12

    def test_damage_limit_fragile(self):
        """damage_limit = 0.005 × hk for fragile elements."""
        stories = make_stories(1, hk=3.0, dek_x=0.001)
        res_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "fragile")
        assert abs(res_x.stories[0].damage_limit - 0.005 * 3.0) < 1e-9

    def test_damage_limit_ductile(self):
        """damage_limit = 0.0075 × hk for ductile elements."""
        stories = make_stories(1, hk=3.0, dek_x=0.001)
        res_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "ductile")
        assert abs(res_x.stories[0].damage_limit - 0.0075 * 3.0) < 1e-9

    def test_ok_ld_passes_fragile(self):
        """νA × Δk ≤ 0.005 × hk → ok_ld=True (fragile)."""
        # hk=3.0, limit=0.015 m; need νA × Δk ≤ 0.015
        # R/QF=4.0, dek_x=0.003 → dk=0.012, Δk=0.012 → νA×Δk=0.006 < 0.015 ✓
        stories = make_stories(1, hk=3.0, dek_x=0.003)
        res_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "fragile")
        assert res_x.stories[0].ok_ld is True

    def test_ok_ld_fails_fragile(self):
        """νA × Δk > 0.005 × hk → ok_ld=False (fragile)."""
        # hk=3.0, limit=0.015 m; need νA × Δk > 0.015
        # R/QF=4.0, dek_x=0.010 → dk=0.040, Δk=0.040 → νA×Δk=0.020 > 0.015 ✗
        stories = make_stories(1, hk=3.0, dek_x=0.010)
        res_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "fragile")
        assert res_x.stories[0].ok_ld is False

    def test_ductile_more_permissive_than_fragile(self):
        """Same displacement: ductile passes where fragile may fail."""
        stories = make_stories(1, hk=3.0, dek_x=0.005)
        res_frag_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "fragile")
        res_duct_x, _ = compute_displacements(stories, 4.0, 1.0, "beton_arme", "ductile")
        # ductile limit is higher so it's at least as permissive
        assert res_duct_x.stories[0].damage_limit >= res_frag_x.stories[0].damage_limit


# ---------------------------------------------------------------------------
# Both directions independently
# ---------------------------------------------------------------------------

class TestBothDirections:

    def test_x_and_y_independent(self):
        """dek_x and dek_y are computed independently."""
        stories = [{"hk": 3.0, "dek_x": 0.010, "dek_y": 0.005}]
        res_x, res_y = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        assert abs(res_x.stories[0].dk - 5.0 * 0.010) < 1e-9
        assert abs(res_y.stories[0].dk - 5.0 * 0.005) < 1e-9

    def test_direction_labels(self):
        stories = make_stories(1, hk=3.0, dek_x=0.001, dek_y=0.001)
        res_x, res_y = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        assert res_x.direction == "X"
        assert res_y.direction == "Y"


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

class TestEdgeCases:

    def test_zero_dek_all_zero(self):
        """dek=0 → all displacements and drifts are 0."""
        stories = make_stories(3, hk=3.0, dek_x=0.0, dek_y=0.0)
        res_x, res_y = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        for s in res_x.stories + res_y.stories:
            assert s.dk == 0.0
            assert s.delta_k == 0.0
            assert s.drift == 0.0
            assert s.ok_ne is True
            assert s.ok_ld is True

    def test_single_story(self):
        """Single story: no previous story, Δk = dk."""
        stories = make_stories(1, hk=4.0, dek_x=0.006)
        res_x, _ = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        assert len(res_x.stories) == 1
        s = res_x.stories[0]
        assert abs(s.delta_k - s.dk) < 1e-9

    def test_global_verdict_all_ok(self):
        """all_ok_ne and all_ok_ld reflect worst story."""
        stories = make_stories(3, hk=3.0, dek_x=0.001)
        res_x, _ = compute_displacements(stories, 5.0, 1.0, "beton_arme", "fragile")
        assert res_x.all_ok_ne is True
        assert res_x.all_ok_ld is True

    def test_qf_zero_raises(self):
        """QF=0 must raise ValueError."""
        stories = make_stories(1, hk=3.0, dek_x=0.001)
        with pytest.raises((ValueError, ZeroDivisionError)):
            compute_displacements(stories, 5.0, 0.0, "beton_arme", "fragile")
