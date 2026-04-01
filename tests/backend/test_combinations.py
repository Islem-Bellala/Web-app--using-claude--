"""
Backend tests — POST /api/v1/combinations
RPA 2024 §5.2

Uses the session-scoped async client from conftest.py.
The combinations endpoint is pure computation (no auth/DB required).
"""

import pytest

BASE = "/api/v1/combinations"


# =============================================================================
# Horizontal-only cases (Av·I ≤ 0.25 → 8 combos)
# =============================================================================

async def test_zone3_group1a_returns_8_combos(client):
    """Zone III + Group 1A: Av·I = 0.116 → 8 combos"""
    res = await client.post(BASE, json={"zone": "III", "group": "1A", "psi": 0.30})
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 8
    assert data["include_vertical"] is False
    assert len(data["combinations"]) == 8


async def test_zone2_group2_returns_8_combos(client):
    """Zone II + Group 2: Av·I = 0.055 → 8 combos"""
    res = await client.post(BASE, json={"zone": "II", "group": "2", "psi": 0.30})
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 8
    assert data["include_vertical"] is False


async def test_zone_iv_group2_returns_8_combos(client):
    """Zone IV + Group 2: Av·I = 0.180 → 8 combos"""
    res = await client.post(BASE, json={"zone": "IV", "group": "2", "psi": 0.30})
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 8
    assert data["include_vertical"] is False


async def test_e1_e2_seismic_ids_present(client):
    res = await client.post(BASE, json={"zone": "I", "group": "2", "psi": 0.30})
    data = res.json()
    ids = {c["seismic_id"] for c in data["combinations"]}
    assert ids == {"E1", "E2"}


async def test_ez_zero_for_horizontal_combos(client):
    res = await client.post(BASE, json={"zone": "II", "group": "3", "psi": 0.40})
    data = res.json()
    assert all(c["ez_coeff"] == 0.0 for c in data["combinations"])


async def test_psi_reflected_in_label(client):
    res = await client.post(BASE, json={"zone": "I", "group": "2", "psi": 1.00})
    data = res.json()
    for combo in data["combinations"]:
        assert "1.00" in combo["label"]


async def test_response_contains_av_i(client):
    res = await client.post(BASE, json={"zone": "III", "group": "1A", "psi": 0.30})
    data = res.json()
    assert abs(data["av_i"] - 0.116) < 1e-4


async def test_response_contains_psi(client):
    res = await client.post(BASE, json={"zone": "I", "group": "2", "psi": 0.50})
    data = res.json()
    assert abs(data["psi"] - 0.50) < 1e-6


# =============================================================================
# Vertical component cases (Av·I > 0.25 → 24 combos)
# =============================================================================

async def test_zone5_group1a_returns_24_combos(client):
    """Zone V + Group 1A: Av·I = 0.315 → 24 combos"""
    res = await client.post(BASE, json={"zone": "V", "group": "1A", "psi": 0.30})
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 24
    assert data["include_vertical"] is True
    assert len(data["combinations"]) == 24


async def test_zone4_group1a_returns_24_combos(client):
    """Zone IV + Group 1A: Av·I = 0.252 → 24 combos"""
    res = await client.post(BASE, json={"zone": "IV", "group": "1A", "psi": 0.30})
    assert res.status_code == 200
    data = res.json()
    assert data["total_count"] == 24
    assert data["include_vertical"] is True


async def test_zone6_group1a_returns_24_combos(client):
    """Zone VI + Group 1A: Av·I = 0.378 → 24 combos"""
    res = await client.post(BASE, json={"zone": "VI", "group": "1A", "psi": 0.30})
    data = res.json()
    assert data["total_count"] == 24


async def test_e3_e4_e5_seismic_ids_present(client):
    res = await client.post(BASE, json={"zone": "V", "group": "1A", "psi": 0.30})
    data = res.json()
    ids = {c["seismic_id"] for c in data["combinations"]}
    assert ids == {"E3", "E4", "E5"}


async def test_ez_nonzero_for_vertical_combos(client):
    res = await client.post(BASE, json={"zone": "VI", "group": "1B", "psi": 0.30})
    data = res.json()
    assert all(abs(c["ez_coeff"]) > 0 for c in data["combinations"])


async def test_combo_ids_are_unique(client):
    res = await client.post(BASE, json={"zone": "V", "group": "1A", "psi": 0.30})
    data = res.json()
    ids = [c["id"] for c in data["combinations"]]
    assert len(ids) == len(set(ids))


# =============================================================================
# Validation errors
# =============================================================================

async def test_missing_zone_returns_422(client):
    res = await client.post(BASE, json={"group": "1A", "psi": 0.30})
    assert res.status_code == 422


async def test_missing_group_returns_422(client):
    res = await client.post(BASE, json={"zone": "IV", "psi": 0.30})
    assert res.status_code == 422


async def test_missing_psi_returns_422(client):
    res = await client.post(BASE, json={"zone": "IV", "group": "1A"})
    assert res.status_code == 422


async def test_invalid_zone_returns_422(client):
    res = await client.post(BASE, json={"zone": "VII", "group": "1A", "psi": 0.30})
    assert res.status_code == 422


async def test_invalid_group_returns_422(client):
    res = await client.post(BASE, json={"zone": "IV", "group": "5", "psi": 0.30})
    assert res.status_code == 422


async def test_zone0_returns_422(client):
    """Zone 0 is not in TABLE_5_1 → 422"""
    res = await client.post(BASE, json={"zone": "0", "group": "2", "psi": 0.30})
    assert res.status_code == 422
