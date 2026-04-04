"""
Tests for calc_engine/seismic/rpa2024/overturning.py

Covers:
    - Overturning moment M_renvers = Σ(Fk × Hk)
    - Stabilizing moment M_stab = W_total × L / 2
    - coeff_renvers = M_stab / M_renvers  ≥ 1.3
    - Sliding check: μ × W_total / V  ≥ 1.25
    - Both X and Y directions
"""

import pytest
from calc_engine.seismic.rpa2024.overturning import compute_overturning


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def simple_2_story():
    """Simple 2-story building for hand-calculation checks."""
    return [
        {"wg": 500.0, "wq": 100.0, "elevation": 3.0},
        {"wg": 400.0, "wq": 80.0,  "elevation": 6.0},
    ]


def simple_3_story():
    return [
        {"wg": 600.0, "wq": 150.0, "elevation": 3.0},
        {"wg": 600.0, "wq": 150.0, "elevation": 6.0},
        {"wg": 500.0, "wq": 100.0, "elevation": 9.0},
    ]


# ---------------------------------------------------------------------------
# Overturning moment
# ---------------------------------------------------------------------------

class TestOverturningMoment:

    def test_m_renvers_2story_manual(self):
        """
        Manual check for 2-story building, single direction, no Ft.
        psi=0.30, V=300, Ft=0
        W1 = 500+0.30×100=530, H1=3
        W2 = 400+0.30×80 =424, H2=6
        Σ WH = 530×3 + 424×6 = 1590 + 2544 = 4134
        F1 = (300/4134)×530×3 = 300 × 1590/4134 = 115.43
        F2 = (300/4134)×424×6 = 300 × 2544/4134 = 184.57
        M = F1×3 + F2×6 = 346.29 + 1107.4 = 1453.7 kN·m
        """
        stories = simple_2_story()
        psi, V, W_total = 0.30, 300.0, 930.0
        lx, ly, mu = 10.0, 8.0, 0.40

        res = compute_overturning(stories, V_x=V, V_y=V, Ft_x=0, Ft_y=0,
                                  psi=psi, lx=lx, ly=ly, mu=mu, W_total=W_total)

        # Recompute manually
        w1, w2 = 530.0, 424.0
        total_wh = w1 * 3 + w2 * 6
        f1 = (w1 * 3 / total_wh) * V
        f2 = (w2 * 6 / total_wh) * V
        expected_m = f1 * 3 + f2 * 6

        assert abs(res.x.M_renvers - expected_m) < 1e-4

    def test_m_stab_x(self):
        """M_stab_x = W_total × Lx / 2."""
        stories = simple_2_story()
        W_total = 1000.0
        lx = 12.0
        res = compute_overturning(stories, V_x=200.0, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=lx, ly=8.0, mu=0.40, W_total=W_total)
        assert abs(res.x.M_stab - W_total * lx / 2.0) < 1e-9

    def test_m_stab_y(self):
        """M_stab_y = W_total × Ly / 2."""
        stories = simple_2_story()
        W_total = 1000.0
        ly = 8.0
        res = compute_overturning(stories, V_x=200.0, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=12.0, ly=ly, mu=0.40, W_total=W_total)
        assert abs(res.y.M_stab - W_total * ly / 2.0) < 1e-9

    def test_coeff_renvers_formula(self):
        """coeff_renvers = M_stab / M_renvers."""
        stories = simple_3_story()
        res = compute_overturning(stories, V_x=300.0, V_y=250.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=10.0, ly=8.0, mu=0.40, W_total=1850.0)
        assert abs(res.x.coeff_renvers - res.x.M_stab / res.x.M_renvers) < 1e-9

    def test_ok_renvers_true_when_coeff_ge_13(self):
        """ok_renvers=True when M_stab / M_renvers ≥ 1.3."""
        # Large building → large M_stab, small V → small M_renvers
        stories = [{"wg": 2000.0, "wq": 0.0, "elevation": 3.0}]
        W_total = 2000.0
        res = compute_overturning(stories, V_x=50.0, V_y=50.0, Ft_x=0, Ft_y=0,
                                  psi=0.0, lx=20.0, ly=15.0, mu=0.40, W_total=W_total)
        assert res.x.ok_renvers is True

    def test_ok_renvers_false_when_coeff_lt_13(self):
        """ok_renvers=False when M_stab / M_renvers < 1.3."""
        # Small building, large V → large M_renvers, small M_stab
        stories = [{"wg": 100.0, "wq": 0.0, "elevation": 3.0}]
        W_total = 100.0
        res = compute_overturning(stories, V_x=5000.0, V_y=5000.0, Ft_x=0, Ft_y=0,
                                  psi=0.0, lx=3.0, ly=3.0, mu=0.40, W_total=W_total)
        assert res.x.ok_renvers is False

    def test_x_and_y_use_different_lx_ly(self):
        """X direction uses Lx, Y direction uses Ly for M_stab."""
        stories = simple_2_story()
        W_total = 930.0
        res = compute_overturning(stories, V_x=200.0, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=15.0, ly=10.0, mu=0.40, W_total=W_total)
        assert abs(res.x.M_stab - W_total * 15.0 / 2) < 1e-9
        assert abs(res.y.M_stab - W_total * 10.0 / 2) < 1e-9


# ---------------------------------------------------------------------------
# Sliding check
# ---------------------------------------------------------------------------

class TestSlidingCheck:

    def test_f_glissement_equals_V(self):
        """F_glissement = V (base shear)."""
        stories = simple_2_story()
        V = 350.0
        res = compute_overturning(stories, V_x=V, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=10.0, ly=8.0, mu=0.40, W_total=930.0)
        assert abs(res.x.F_glissement - V) < 1e-9

    def test_f_resistance_equals_mu_times_W(self):
        """F_resistance = μ × W_total."""
        stories = simple_2_story()
        mu, W_total = 0.40, 930.0
        res = compute_overturning(stories, V_x=200.0, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=10.0, ly=8.0, mu=mu, W_total=W_total)
        assert abs(res.x.F_resistance - mu * W_total) < 1e-9

    def test_coeff_glissement_formula(self):
        """coeff_glissement = F_resistance / F_glissement."""
        stories = simple_2_story()
        res = compute_overturning(stories, V_x=200.0, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=10.0, ly=8.0, mu=0.40, W_total=930.0)
        expected = (0.40 * 930.0) / 200.0
        assert abs(res.x.coeff_glissement - expected) < 1e-9

    def test_ok_glissement_true_when_ge_125(self):
        """ok_glissement=True when μ×W/V ≥ 1.25."""
        # μ×W = 0.40 × 2000 = 800, V = 600 → coeff = 1.333 ≥ 1.25
        stories = [{"wg": 2000.0, "wq": 0.0, "elevation": 3.0}]
        res = compute_overturning(stories, V_x=600.0, V_y=600.0, Ft_x=0, Ft_y=0,
                                  psi=0.0, lx=10.0, ly=10.0, mu=0.40, W_total=2000.0)
        assert res.x.ok_glissement is True

    def test_ok_glissement_false_when_lt_125(self):
        """ok_glissement=False when μ×W/V < 1.25."""
        # μ×W = 0.40 × 500 = 200, V = 300 → coeff = 0.667 < 1.25
        stories = [{"wg": 500.0, "wq": 0.0, "elevation": 3.0}]
        res = compute_overturning(stories, V_x=300.0, V_y=300.0, Ft_x=0, Ft_y=0,
                                  psi=0.0, lx=10.0, ly=10.0, mu=0.40, W_total=500.0)
        assert res.x.ok_glissement is False


# ---------------------------------------------------------------------------
# Ft (additional top force)
# ---------------------------------------------------------------------------

class TestAdditionalTopForce:

    def test_ft_added_to_top_story(self):
        """Ft is added to the top story force, increases M_renvers."""
        stories = simple_2_story()
        psi = 0.30
        W_total = 930.0

        res_no_ft  = compute_overturning(stories, V_x=300.0, V_y=300.0, Ft_x=0.0, Ft_y=0.0,
                                         psi=psi, lx=10.0, ly=8.0, mu=0.40, W_total=W_total)
        res_with_ft = compute_overturning(stories, V_x=300.0, V_y=300.0, Ft_x=30.0, Ft_y=0.0,
                                          psi=psi, lx=10.0, ly=8.0, mu=0.40, W_total=W_total)

        # With Ft, the top force is larger → larger M_renvers
        assert res_with_ft.x.M_renvers > res_no_ft.x.M_renvers


# ---------------------------------------------------------------------------
# Direction labels
# ---------------------------------------------------------------------------

class TestDirectionLabels:

    def test_direction_labels(self):
        stories = simple_2_story()
        res = compute_overturning(stories, V_x=200.0, V_y=200.0, Ft_x=0, Ft_y=0,
                                  psi=0.30, lx=10.0, ly=8.0, mu=0.40, W_total=930.0)
        assert res.x.direction == "X"
        assert res.y.direction == "Y"
