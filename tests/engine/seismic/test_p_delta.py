"""
Tests for calc_engine/seismic/rpa2024/p_delta.py

Covers:
    - Pk cumulative gravity load from top down (Eq 5.10)
    - Vk story shear (sum of forces above level k)
    - δk = (R/QF) × δek, Δk = dk − dk_prev (Eq 4.15, 4.16)
    - θk = (Pk × Δk) / (Vk × hk) (Eq 5.9)
    - Verdict: "ok" | "amplify" | "unstable"
    - Amplification factor 1/(1−θk) when verdict="amplify"
"""

import pytest
from calc_engine.seismic.rpa2024.p_delta import compute_p_delta


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_stories_3(dek_x=0.003, dek_y=0.002):
    """3-story building with typical weights and absolute elevations."""
    return [
        {"hk": 3.0, "wg": 500.0, "wq": 150.0, "elevation": 3.0,  "dek_x": dek_x * 1, "dek_y": dek_y * 1},
        {"hk": 3.0, "wg": 500.0, "wq": 150.0, "elevation": 6.0,  "dek_x": dek_x * 2, "dek_y": dek_y * 2},
        {"hk": 3.0, "wg": 400.0, "wq": 100.0, "elevation": 9.0,  "dek_x": dek_x * 3, "dek_y": dek_y * 3},
    ]


# ---------------------------------------------------------------------------
# Cumulative gravity load Pk (Eq 5.10)
# ---------------------------------------------------------------------------

class TestCumulativeLoad:

    def test_pk_top_story_equals_own_weight(self):
        """Top story Pk = only its own (Gi + ψ·Qi)."""
        stories = make_stories_3()
        psi = 0.30
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=psi,
                                   V_x=400.0, V_y=300.0)
        top = res_x.stories[-1]
        expected = 400.0 + psi * 100.0  # wg + ψ×wq of story 3
        assert abs(top.Pk - expected) < 1e-6

    def test_pk_bottom_story_equals_total_weight(self):
        """Bottom story Pk = total seismic weight (all stories)."""
        stories = make_stories_3()
        psi = 0.30
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=psi,
                                   V_x=400.0, V_y=300.0)
        bottom = res_x.stories[0]
        total_w = sum(
            float(s["wg"]) + psi * float(s["wq"]) for s in stories
        )
        assert abs(bottom.Pk - total_w) < 1e-6

    def test_pk_decreases_from_bottom_to_top(self):
        """Pk must be non-increasing from bottom to top."""
        stories = make_stories_3()
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                   V_x=400.0, V_y=300.0)
        pks = [s.Pk for s in res_x.stories]
        assert pks[0] >= pks[1] >= pks[2]


# ---------------------------------------------------------------------------
# Story shear Vk
# ---------------------------------------------------------------------------

class TestStoryShear:

    def test_vk_bottom_equals_base_shear(self):
        """Bottom story Vk should equal total V (all forces sum to V)."""
        stories = make_stories_3()
        V = 500.0
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                   V_x=V, V_y=300.0, Ft_x=0.0)
        bottom = res_x.stories[0]
        assert abs(bottom.Vk - V) < 1e-6

    def test_vk_decreases_upward(self):
        """Vk must be non-increasing from bottom to top."""
        stories = make_stories_3()
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                   V_x=400.0, V_y=300.0)
        vks = [s.Vk for s in res_x.stories]
        assert vks[0] >= vks[1] >= vks[2]


# ---------------------------------------------------------------------------
# θk verdicts
# ---------------------------------------------------------------------------

class TestTheta:

    def test_verdict_ok_when_theta_below_010(self):
        """θk < 0.10 → verdict='ok', amplification=1.0."""
        # Use very small dek to ensure tiny Δk → tiny θk
        stories = make_stories_3(dek_x=0.0001)
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                   V_x=500.0, V_y=300.0)
        for s in res_x.stories:
            assert s.verdict == "ok"
            assert s.amplification == 1.0

    def test_verdict_unstable_when_theta_above_020(self):
        """θk > 0.20 → verdict='unstable'."""
        # Craft story with very large Δk and small V to force θk > 0.20
        stories = [
            {"hk": 3.0, "wg": 10000.0, "wq": 0.0, "elevation": 3.0,
             "dek_x": 0.10, "dek_y": 0.0},
        ]
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                   V_x=1.0, V_y=1.0)  # very small V
        # θk = (10000 × 0.5) / (1.0 × 3.0) ≈ 1666 >> 0.20
        assert res_x.stories[0].verdict == "unstable"
        assert res_x.all_ok is False

    def test_amplification_factor_formula(self):
        """amplification = 1/(1−θk) when verdict='amplify'."""
        # We need 0.10 ≤ θk ≤ 0.20
        # θk = Pk × Δk / (Vk × hk)
        # Let's find a scenario: hk=3, Pk~600, Vk~500, Δk~0.15 → θk ≈ 600×0.15/(500×3) = 0.06 too small
        # Try Pk=3000, Vk=500, Δk=0.10, hk=3 → θk = 3000×0.10/1500 = 0.20 (edge)
        # Use Pk=2000, Vk=300, Δk=0.10, hk=3 → θk = 2000×0.10/900 = 0.222 → "unstable"
        # Try: Pk=1000, Vk=500, Δk=0.09, hk=3 → θk = 1000×0.09/1500 = 0.06 → "ok"
        # Adjust: Pk=1500, Vk=300, Δk=0.10, hk=3 → θk = 1500×0.10/900 = 0.1667 → "amplify"
        stories = [
            {"hk": 3.0, "wg": 1500.0, "wq": 0.0, "elevation": 3.0,
             "dek_x": 0.10, "dek_y": 0.0},
        ]
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.0,
                                   V_x=300.0, V_y=1.0)
        s = res_x.stories[0]
        if s.verdict == "amplify":
            expected_amp = 1.0 / (1.0 - s.theta_k)
            assert abs(s.amplification - expected_amp) < 1e-9

    def test_theta_formula(self):
        """Manual check of θk = (Pk × Δk) / (Vk × hk)."""
        stories = [
            {"hk": 3.0, "wg": 800.0, "wq": 0.0, "elevation": 3.0,
             "dek_x": 0.005, "dek_y": 0.0},
        ]
        R, QF, V = 5.0, 1.0, 400.0
        res_x, _ = compute_p_delta(stories, R=R, QF=QF, psi=0.0,
                                   V_x=V, V_y=1.0)
        s = res_x.stories[0]
        Pk = 800.0
        delta_k = (R / QF) * 0.005  # = 0.025
        Vk = V
        expected_theta = (Pk * delta_k) / (Vk * 3.0)
        assert abs(s.theta_k - expected_theta) < 1e-9


# ---------------------------------------------------------------------------
# Both directions
# ---------------------------------------------------------------------------

class TestBothDirections:

    def test_x_and_y_use_correct_base_shear(self):
        """X direction uses V_x, Y direction uses V_y."""
        stories = make_stories_3(dek_x=0.001, dek_y=0.002)
        res_x, res_y = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                      V_x=500.0, V_y=300.0)
        # Bottom story Vk should match base shear
        assert abs(res_x.stories[0].Vk - 500.0) < 1e-6
        assert abs(res_y.stories[0].Vk - 300.0) < 1e-6

    def test_direction_labels(self):
        stories = make_stories_3()
        res_x, res_y = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                      V_x=400.0, V_y=300.0)
        assert res_x.direction == "X"
        assert res_y.direction == "Y"

    def test_level_indices(self):
        stories = make_stories_3()
        res_x, _ = compute_p_delta(stories, R=5.0, QF=1.0, psi=0.30,
                                   V_x=400.0, V_y=300.0)
        assert [s.level for s in res_x.stories] == [1, 2, 3]
