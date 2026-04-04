"""
Backend tests — Seismic verification endpoints
RPA 2024 §4.5.2 (displacements), §5.9 (P-Δ), §5.5 (overturning)

Endpoints:
    POST /api/v1/verifications/displacements
    POST /api/v1/verifications/p-delta
    POST /api/v1/verifications/overturning

All endpoints are pure computation — no auth or DB required.
"""

import pytest

DISP_URL  = "/api/v1/verifications/displacements"
PDELTA_URL = "/api/v1/verifications/p-delta"
OVT_URL   = "/api/v1/verifications/overturning"


# ---------------------------------------------------------------------------
# Shared payloads
# ---------------------------------------------------------------------------

STORIES_2 = [
    {"hk": 3.0, "wg": 500.0, "wq": 100.0, "elevation": 3.0, "dek_x": 0.004, "dek_y": 0.003},
    {"hk": 3.0, "wg": 450.0, "wq":  80.0, "elevation": 6.0, "dek_x": 0.009, "dek_y": 0.007},
]

STORIES_3 = [
    {"hk": 3.0, "wg": 600.0, "wq": 150.0, "elevation": 3.0, "dek_x": 0.003, "dek_y": 0.002},
    {"hk": 3.0, "wg": 600.0, "wq": 150.0, "elevation": 6.0, "dek_x": 0.007, "dek_y": 0.005},
    {"hk": 3.0, "wg": 500.0, "wq": 100.0, "elevation": 9.0, "dek_x": 0.010, "dek_y": 0.008},
]


# ===========================================================================
# POST /verifications/displacements
# ===========================================================================

class TestDisplacementsEndpoint:

    async def test_valid_request_returns_200(self, client):
        res = await client.post(DISP_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.25,
            "structure_type": "beton_arme",
            "non_structural_type": "fragile",
        })
        assert res.status_code == 200

    async def test_response_has_x_and_y_directions(self, client):
        res = await client.post(DISP_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.25,
        })
        data = res.json()
        assert "x" in data
        assert "y" in data
        assert data["x"]["direction"] == "X"
        assert data["y"]["direction"] == "Y"

    async def test_story_count_matches_input(self, client):
        res = await client.post(DISP_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.25,
        })
        data = res.json()
        assert len(data["x"]["stories"]) == 3
        assert len(data["y"]["stories"]) == 3

    async def test_dk_formula_R_over_QF(self, client):
        """Verify δk = (R/QF) × δek in the response."""
        R, QF, dek_x = 5.0, 1.25, 0.004
        res = await client.post(DISP_URL, json={
            "stories": [{"hk": 3.0, "dek_x": dek_x, "dek_y": 0.0}],
            "R": R, "QF": QF,
        })
        data = res.json()
        expected_dk = (R / QF) * dek_x
        actual_dk   = data["x"]["stories"][0]["dk"]
        assert abs(actual_dk - expected_dk) < 1e-6

    async def test_all_ok_fields_present(self, client):
        res = await client.post(DISP_URL, json={
            "stories": STORIES_2,
            "R": 5.0, "QF": 1.25,
        })
        data = res.json()
        assert "all_ok_ne" in data["x"]
        assert "all_ok_ld" in data["x"]

    async def test_structure_type_bois(self, client):
        """Bois structure type accepted and stored in response."""
        res = await client.post(DISP_URL, json={
            "stories": STORIES_2,
            "R": 4.0, "QF": 1.0,
            "structure_type": "bois",
        })
        assert res.status_code == 200
        assert res.json()["x"]["structure_type"] == "bois"

    async def test_missing_stories_returns_422(self, client):
        res = await client.post(DISP_URL, json={
            "R": 5.0, "QF": 1.25,
        })
        assert res.status_code == 422

    async def test_empty_stories_returns_422(self, client):
        res = await client.post(DISP_URL, json={
            "stories": [], "R": 5.0, "QF": 1.25,
        })
        assert res.status_code == 422

    async def test_invalid_structure_type_returns_422(self, client):
        res = await client.post(DISP_URL, json={
            "stories": STORIES_2,
            "R": 5.0, "QF": 1.25,
            "structure_type": "invalid_type",
        })
        assert res.status_code == 422


# ===========================================================================
# POST /verifications/p-delta
# ===========================================================================

class TestPDeltaEndpoint:

    async def test_valid_request_returns_200(self, client):
        res = await client.post(PDELTA_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.25, "psi": 0.30,
            "V_x": 400.0, "V_y": 300.0,
        })
        assert res.status_code == 200

    async def test_response_has_x_and_y(self, client):
        res = await client.post(PDELTA_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.25, "psi": 0.30,
            "V_x": 400.0, "V_y": 300.0,
        })
        data = res.json()
        assert "x" in data and "y" in data

    async def test_theta_k_present_per_story(self, client):
        res = await client.post(PDELTA_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.0, "psi": 0.30,
            "V_x": 500.0, "V_y": 400.0,
        })
        data = res.json()
        for story in data["x"]["stories"]:
            assert "theta_k" in story
            assert "verdict"  in story

    async def test_verdict_ok_for_small_displacement(self, client):
        """Very small dek → very small θk → all 'ok'."""
        stories = [
            {"hk": 3.0, "wg": 500.0, "wq": 100.0, "elevation": 3.0,
             "dek_x": 0.0001, "dek_y": 0.0001},
        ]
        res = await client.post(PDELTA_URL, json={
            "stories": stories,
            "R": 5.0, "QF": 1.0, "psi": 0.30,
            "V_x": 400.0, "V_y": 300.0,
        })
        assert res.status_code == 200
        data = res.json()
        assert data["x"]["stories"][0]["verdict"] == "ok"

    async def test_amplification_present_in_response(self, client):
        res = await client.post(PDELTA_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.0, "psi": 0.30,
            "V_x": 400.0, "V_y": 300.0,
        })
        data = res.json()
        for story in data["x"]["stories"]:
            assert "amplification" in story

    async def test_max_theta_in_response(self, client):
        res = await client.post(PDELTA_URL, json={
            "stories": STORIES_3,
            "R": 5.0, "QF": 1.0, "psi": 0.30,
            "V_x": 400.0, "V_y": 300.0,
        })
        data = res.json()
        assert "max_theta" in data["x"]
        assert "max_theta" in data["y"]

    async def test_missing_stories_returns_422(self, client):
        res = await client.post(PDELTA_URL, json={
            "R": 5.0, "QF": 1.25, "psi": 0.30,
            "V_x": 400.0, "V_y": 300.0,
        })
        assert res.status_code == 422

    async def test_missing_V_x_returns_422(self, client):
        res = await client.post(PDELTA_URL, json={
            "stories": STORIES_2,
            "R": 5.0, "QF": 1.25, "psi": 0.30,
            "V_y": 300.0,
        })
        assert res.status_code == 422


# ===========================================================================
# POST /verifications/overturning
# ===========================================================================

class TestOverturningEndpoint:

    async def test_valid_request_returns_200(self, client):
        res = await client.post(OVT_URL, json={
            "stories": STORIES_3,
            "V_x": 400.0, "V_y": 300.0,
            "psi": 0.30, "lx": 12.0, "ly": 10.0, "mu": 0.40,
            "W_total": 1850.0,
        })
        assert res.status_code == 200

    async def test_response_has_coefficients(self, client):
        res = await client.post(OVT_URL, json={
            "stories": STORIES_3,
            "V_x": 400.0, "V_y": 300.0,
            "psi": 0.30, "lx": 12.0, "ly": 10.0, "mu": 0.40,
            "W_total": 1850.0,
        })
        data = res.json()
        assert "coeff_renvers"    in data["x"]
        assert "coeff_glissement" in data["x"]
        assert "ok_renvers"       in data["x"]
        assert "ok_glissement"    in data["x"]

    async def test_m_stab_formula(self, client):
        """M_stab_x = W_total × Lx / 2."""
        W_total, lx = 2000.0, 14.0
        res = await client.post(OVT_URL, json={
            "stories": STORIES_2,
            "V_x": 300.0, "V_y": 250.0,
            "psi": 0.30, "lx": lx, "ly": 10.0, "mu": 0.40,
            "W_total": W_total,
        })
        data = res.json()
        expected_m_stab = W_total * lx / 2.0
        assert abs(data["x"]["M_stab"] - expected_m_stab) < 1e-4

    async def test_f_resistance_formula(self, client):
        """F_resistance = μ × W_total."""
        mu, W_total = 0.35, 1800.0
        res = await client.post(OVT_URL, json={
            "stories": STORIES_2,
            "V_x": 300.0, "V_y": 250.0,
            "psi": 0.30, "lx": 12.0, "ly": 10.0, "mu": mu,
            "W_total": W_total,
        })
        data = res.json()
        assert abs(data["x"]["F_resistance"] - mu * W_total) < 1e-4

    async def test_ok_glissement_true_when_sufficient_mu(self, client):
        """μ × W / V ≥ 1.25 → ok_glissement=True."""
        # μ=0.40, W=2000, V=600 → coeff=1.333 ≥ 1.25
        stories = [{"hk": 3.0, "wg": 2000.0, "wq": 0.0, "elevation": 3.0}]
        res = await client.post(OVT_URL, json={
            "stories": stories,
            "V_x": 600.0, "V_y": 600.0,
            "psi": 0.0, "lx": 10.0, "ly": 10.0, "mu": 0.40,
            "W_total": 2000.0,
        })
        assert res.status_code == 200
        assert res.json()["x"]["ok_glissement"] is True

    async def test_x_and_y_directions_present(self, client):
        res = await client.post(OVT_URL, json={
            "stories": STORIES_2,
            "V_x": 400.0, "V_y": 300.0,
            "psi": 0.30, "lx": 12.0, "ly": 8.0, "mu": 0.40,
            "W_total": 950.0,
        })
        data = res.json()
        assert data["x"]["direction"] == "X"
        assert data["y"]["direction"] == "Y"

    async def test_missing_stories_returns_422(self, client):
        res = await client.post(OVT_URL, json={
            "V_x": 400.0, "V_y": 300.0,
            "psi": 0.30, "lx": 12.0, "ly": 10.0,
            "W_total": 1850.0,
        })
        assert res.status_code == 422

    async def test_missing_lx_returns_422(self, client):
        res = await client.post(OVT_URL, json={
            "stories": STORIES_2,
            "V_x": 400.0, "V_y": 300.0,
            "psi": 0.30, "ly": 10.0,
            "W_total": 1850.0,
        })
        assert res.status_code == 422
