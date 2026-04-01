"""
Tests — calc_engine/seismic/rpa2024/combinations.py
RPA 2024 §5.2, Table 4.2, Table 5.1
"""

import pytest
from calc_engine.seismic.rpa2024.combinations import (
    TABLE_5_1,
    PSI_TABLE,
    requires_vertical_component,
    generate_combinations,
)


# =============================================================================
# TABLE_5_1 — Av·I values
# =============================================================================

class TestTable51:
    def test_zone_iv_group_1a(self):
        assert TABLE_5_1[("IV", "1A")] == pytest.approx(0.252)

    def test_zone_iv_group_2(self):
        assert TABLE_5_1[("IV", "2")] == pytest.approx(0.180)

    def test_zone_i_group_1a(self):
        assert TABLE_5_1[("I", "1A")] == pytest.approx(0.054)

    def test_zone_vi_group_1a(self):
        assert TABLE_5_1[("VI", "1A")] == pytest.approx(0.378)

    def test_zone_v_group_3(self):
        assert TABLE_5_1[("V", "3")] == pytest.approx(0.180)


# =============================================================================
# PSI_TABLE — ψ values per usage case
# =============================================================================

class TestPsiTable:
    def test_case_1_habitation(self):
        assert PSI_TABLE[1] == pytest.approx(0.30)

    def test_case_2_public(self):
        assert PSI_TABLE[2] == pytest.approx(0.40)

    def test_case_3_entrepots(self):
        assert PSI_TABLE[3] == pytest.approx(0.50)

    def test_case_4_archives(self):
        assert PSI_TABLE[4] == pytest.approx(1.00)

    def test_case_5_autres(self):
        assert PSI_TABLE[5] == pytest.approx(0.60)

    def test_all_five_cases_present(self):
        assert set(PSI_TABLE.keys()) == {1, 2, 3, 4, 5}


# =============================================================================
# requires_vertical_component
# =============================================================================

class TestRequiresVertical:
    def test_zone_iv_group_1a_is_true(self):
        """0.252 > 0.25 → True"""
        assert requires_vertical_component("IV", "1A") is True

    def test_zone_iv_group_2_is_false(self):
        """0.180 ≤ 0.25 → False"""
        assert requires_vertical_component("IV", "2") is False

    def test_zone_v_group_1a_is_true(self):
        """0.315 > 0.25 → True"""
        assert requires_vertical_component("V", "1A") is True

    def test_zone_vi_group_1a_is_true(self):
        """0.378 > 0.25 → True"""
        assert requires_vertical_component("VI", "1A") is True

    def test_zone_iii_group_1a_is_false(self):
        """0.116 ≤ 0.25 → False"""
        assert requires_vertical_component("III", "1A") is False

    def test_unknown_zone_returns_false(self):
        """Missing entry defaults to 0.0 → False"""
        assert requires_vertical_component("VII", "1A") is False

    def test_threshold_boundary_iv_1b(self):
        """0.216 ≤ 0.25 → False"""
        assert requires_vertical_component("IV", "1B") is False

    def test_threshold_v_group_2(self):
        """0.225 ≤ 0.25 → False"""
        assert requires_vertical_component("V", "2") is False

    def test_threshold_v_group_1b(self):
        """0.270 > 0.25 → True"""
        assert requires_vertical_component("V", "1B") is True


# =============================================================================
# generate_combinations — horizontal only (8 combos)
# =============================================================================

class TestGenerateCombinationsHorizontal:
    @pytest.fixture
    def combos(self):
        return generate_combinations(psi=0.30, include_vertical=False)

    def test_returns_8_combinations(self, combos):
        assert len(combos) == 8

    def test_e1_has_4_combos(self, combos):
        e1 = [c for c in combos if c.seismic_id == "E1"]
        assert len(e1) == 4

    def test_e2_has_4_combos(self, combos):
        e2 = [c for c in combos if c.seismic_id == "E2"]
        assert len(e2) == 4

    def test_no_e3_e4_e5(self, combos):
        ids = {c.seismic_id for c in combos}
        assert ids == {"E1", "E2"}

    def test_ez_is_zero_for_all(self, combos):
        assert all(c.ez_coeff == 0.0 for c in combos)

    def test_e1_ex_is_1_or_minus1(self, combos):
        e1 = [c for c in combos if c.seismic_id == "E1"]
        ex_vals = {abs(c.ex_coeff) for c in e1}
        assert ex_vals == {1.0}

    def test_e1_ey_is_03(self, combos):
        e1 = [c for c in combos if c.seismic_id == "E1"]
        ey_vals = {abs(c.ey_coeff) for c in e1}
        assert ey_vals == {0.3}

    def test_e2_ey_is_1_or_minus1(self, combos):
        e2 = [c for c in combos if c.seismic_id == "E2"]
        ey_vals = {abs(c.ey_coeff) for c in e2}
        assert ey_vals == {1.0}

    def test_e2_ex_is_03(self, combos):
        e2 = [c for c in combos if c.seismic_id == "E2"]
        ex_vals = {abs(c.ex_coeff) for c in e2}
        assert ex_vals == {0.3}

    def test_all_ids_unique(self, combos):
        ids = [c.id for c in combos]
        assert len(ids) == len(set(ids))

    def test_gravity_includes_psi(self, combos):
        for c in combos:
            assert "0.30" in c.gravity
            assert "G" in c.gravity
            assert "Q" in c.gravity

    def test_label_includes_gravity(self, combos):
        for c in combos:
            assert c.gravity in c.label

    def test_all_sign_permutations_unique(self, combos):
        e1 = [c for c in combos if c.seismic_id == "E1"]
        signs = [(c.ex_coeff, c.ey_coeff) for c in e1]
        assert len(signs) == len(set(signs))

    def test_e1_ids_sequential(self, combos):
        e1 = [c for c in combos if c.seismic_id == "E1"]
        ids = [c.id for c in e1]
        assert ids == ["E1_1", "E1_2", "E1_3", "E1_4"]

    def test_e2_ids_sequential(self, combos):
        e2 = [c for c in combos if c.seismic_id == "E2"]
        ids = [c.id for c in e2]
        assert ids == ["E2_1", "E2_2", "E2_3", "E2_4"]


# =============================================================================
# generate_combinations — with vertical (24 combos)
# =============================================================================

class TestGenerateCombinationsVertical:
    @pytest.fixture
    def combos(self):
        return generate_combinations(psi=0.30, include_vertical=True)

    def test_returns_24_combinations(self, combos):
        assert len(combos) == 24

    def test_e3_has_8_combos(self, combos):
        assert len([c for c in combos if c.seismic_id == "E3"]) == 8

    def test_e4_has_8_combos(self, combos):
        assert len([c for c in combos if c.seismic_id == "E4"]) == 8

    def test_e5_has_8_combos(self, combos):
        assert len([c for c in combos if c.seismic_id == "E5"]) == 8

    def test_no_e1_e2(self, combos):
        ids = {c.seismic_id for c in combos}
        assert ids == {"E3", "E4", "E5"}

    def test_e3_ex_is_1(self, combos):
        e3 = [c for c in combos if c.seismic_id == "E3"]
        assert all(abs(c.ex_coeff) == pytest.approx(1.0) for c in e3)

    def test_e3_ey_is_03(self, combos):
        e3 = [c for c in combos if c.seismic_id == "E3"]
        assert all(abs(c.ey_coeff) == pytest.approx(0.3) for c in e3)

    def test_e3_ez_is_03(self, combos):
        e3 = [c for c in combos if c.seismic_id == "E3"]
        assert all(abs(c.ez_coeff) == pytest.approx(0.3) for c in e3)

    def test_e5_ez_is_1(self, combos):
        e5 = [c for c in combos if c.seismic_id == "E5"]
        assert all(abs(c.ez_coeff) == pytest.approx(1.0) for c in e5)

    def test_all_ids_unique(self, combos):
        ids = [c.id for c in combos]
        assert len(ids) == len(set(ids))

    def test_all_sign_permutations_unique(self, combos):
        e3 = [c for c in combos if c.seismic_id == "E3"]
        signs = [(c.ex_coeff, c.ey_coeff, c.ez_coeff) for c in e3]
        assert len(signs) == len(set(signs))

    def test_e3_covers_all_8_sign_permutations(self, combos):
        e3 = [c for c in combos if c.seismic_id == "E3"]
        sign_tuples = {
            (int(c.ex_coeff / abs(c.ex_coeff)), int(c.ey_coeff / abs(c.ey_coeff)), int(c.ez_coeff / abs(c.ez_coeff)))
            for c in e3
        }
        from itertools import product as iproduct
        expected = set(iproduct([1, -1], [1, -1], [1, -1]))
        assert sign_tuples == expected


# =============================================================================
# psi=1.00 (archives) — check label
# =============================================================================

class TestPsi100:
    def test_gravity_label_archives(self):
        combos = generate_combinations(psi=1.00, include_vertical=False)
        for c in combos:
            assert "1.00" in c.gravity

    def test_combo_count_still_8(self):
        combos = generate_combinations(psi=1.00, include_vertical=False)
        assert len(combos) == 8
