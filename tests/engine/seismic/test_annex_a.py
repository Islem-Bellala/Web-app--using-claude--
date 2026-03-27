"""
Tests — RPA 2024 Annex A: Wilaya / Commune / Zone mapping
==========================================================
Verifies the single source of truth for Algerian seismic zone data.

Run with:
    pytest tests/engine/seismic/test_annex_a.py -v
"""

import pytest
from calc_engine.seismic.rpa2024.annex_a import (
    get_all_wilayas,
    get_communes,
    get_zone,
    is_split_zone_wilaya,
)


# =============================================================================
# TEST — get_all_wilayas
# =============================================================================

def test_total_wilaya_count():
    """There are exactly 58 wilayas in Algeria."""
    wilayas = get_all_wilayas()
    assert len(wilayas) == 58, f"Expected 58 wilayas, got {len(wilayas)}"


def test_wilaya_has_required_keys():
    """Each wilaya entry must have code, name, zone, has_split_zones."""
    for w in get_all_wilayas():
        assert "code"           in w
        assert "name"           in w
        assert "zone"           in w
        assert "has_split_zones" in w


def test_wilaya_codes_are_unique():
    """All wilaya codes must be unique."""
    codes = [w["code"] for w in get_all_wilayas()]
    assert len(codes) == len(set(codes)), "Duplicate wilaya codes found"


def test_wilaya_codes_range():
    """Wilaya codes must be 01 through 58."""
    codes = {w["code"] for w in get_all_wilayas()}
    for i in range(1, 59):
        assert f"{i:02d}" in codes, f"Missing wilaya code {i:02d}"


# =============================================================================
# TEST — Known zone spot checks (verified against official source)
# =============================================================================

@pytest.mark.parametrize("code,expected_zone", [
    ("01", "0"),    # Adrar — Zone 0
    ("09", "VI"),   # Blida — Zone VI
    ("16", "VI"),   # Alger — Zone VI
    ("25", "V"),    # Constantine — Zone V
    ("47", "I"),    # Ghardaia — Zone I
    ("30", "0"),    # Ouargla — Zone 0
    ("42", "VI"),   # Tipaza — Zone VI
    ("35", "VI"),   # Boumerdes — Zone VI (default)
])
def test_known_wilaya_zones(code, expected_zone):
    """Spot-check known zone values from official RPA 2024 Annex A."""
    wilayas = {w["code"]: w for w in get_all_wilayas()}
    assert wilayas[code]["zone"] == expected_zone, \
        f"Wilaya {code}: expected zone {expected_zone}, got {wilayas[code]['zone']}"


# =============================================================================
# TEST — get_zone
# =============================================================================

def test_get_zone_simple_wilaya():
    """Non-split wilaya returns its default zone regardless of commune."""
    assert get_zone("09") == "VI"    # Blida
    assert get_zone("16") == "VI"    # Alger
    assert get_zone("25") == "V"     # Constantine
    assert get_zone("01") == "0"     # Adrar


def test_get_zone_split_wilaya_default():
    """Split-zone wilaya without commune returns default zone."""
    # Boumerdes default is VI (most communes)
    assert get_zone("35") == "VI"


def test_get_zone_split_wilaya_commune_override():
    """Split-zone wilaya with listed commune returns that commune's zone."""
    # Boumerdes: Sidi Daoud is Zone IV (lower than default VI)
    assert get_zone("35", "Sidi Daoud") == "IV"
    # Boumerdes: Chaabet El Ameur is Zone V
    assert get_zone("35", "Chaabet El Ameur") == "V"


def test_get_zone_split_wilaya_unlisted_commune():
    """Commune not in the list → returns wilaya default zone."""
    # Any unlisted commune in Boumerdes → default VI
    assert get_zone("35", "Unknown Commune XYZ") == "VI"


def test_get_zone_jijel_split():
    """Jijel (18): default V; listed zone VI communes; unlisted commune → V; zone IV exceptions."""
    assert get_zone("18") == "V"                            # wilaya-level default (no commune)
    assert get_zone("18", "Jijel") == "VI"                  # Groupe A
    assert get_zone("18", "Ziama Mansouriah") == "VI"       # Groupe A
    assert get_zone("18", "El Milia") == "IV"               # Groupe C
    assert get_zone("18", "Kheiri Oued Adjoul") == "IV"     # Groupe C
    assert get_zone("18", "any unlisted commune") == "V"    # Groupe B (default)


def test_get_zone_setif_split():
    """Sétif (19): default IV, Babor is VI."""
    assert get_zone("19") == "IV"
    assert get_zone("19", "Babor") == "VI"


def test_get_zone_invalid_wilaya_raises():
    """Unknown wilaya code must raise ValueError."""
    with pytest.raises(ValueError, match="Unknown wilaya code"):
        get_zone("99")


def test_get_zone_invalid_code_zero():
    """Code '00' does not exist — must raise ValueError."""
    with pytest.raises(ValueError):
        get_zone("00")


# =============================================================================
# TEST — is_split_zone_wilaya
# =============================================================================

def test_split_zone_wilayas():
    """Known split-zone wilayas return True."""
    assert is_split_zone_wilaya("35") is True   # Boumerdes
    assert is_split_zone_wilaya("18") is True   # Jijel
    assert is_split_zone_wilaya("19") is True   # Setif


def test_non_split_zone_wilayas():
    """Known non-split wilayas return False."""
    assert is_split_zone_wilaya("09") is False  # Blida
    assert is_split_zone_wilaya("16") is False  # Alger
    assert is_split_zone_wilaya("42") is False  # Tipaza
    assert is_split_zone_wilaya("01") is False  # Adrar


def test_split_zone_unknown_code_returns_false():
    """Unknown code returns False (no exception)."""
    assert is_split_zone_wilaya("99") is False


# =============================================================================
# TEST — get_communes
# =============================================================================

def test_get_communes_split_wilaya():
    """Split-zone wilaya returns a list of commune dicts."""
    communes = get_communes("35")  # Boumerdes
    assert isinstance(communes, list)
    assert len(communes) > 0


def test_get_communes_has_required_keys():
    """Each commune dict must have name and zone."""
    for c in get_communes("35"):
        assert "name" in c
        assert "zone" in c


def test_get_communes_non_split_wilaya():
    """Non-split wilaya returns empty list."""
    assert get_communes("01") == []  # Adrar
    assert get_communes("25") == []  # Constantine


def test_get_communes_empty_split_wilaya():
    """Split wilaya with no listed communes returns empty list (Blida, Alger, Tipaza)."""
    # These wilayas have has_split_zones=False in WILAYAS but no entry in _COMMUNES
    # Blida (09) is listed as non-split
    assert get_communes("09") == []


def test_get_communes_boumerdes_count():
    """Boumerdes has 14 listed special communes (8 Zone V, 6 Zone IV)."""
    communes = get_communes("35")
    assert len(communes) == 14


def test_get_communes_jijel():
    """Jijel has 11 explicitly listed communes (6 in Zone VI, 5 in Zone IV)."""
    communes = get_communes("18")
    assert len(communes) == 11
    names = {c["name"] for c in communes}
    # Groupe A — Zone VI
    assert "Jijel" in names
    assert "Ziama Mansouriah" in names
    assert "Kaous" in names
    assert "Erraguene" in names          # verified spelling from clean Annex A PDF
    # Groupe C — Zone IV
    assert "El Milia" in names
    assert "Sidi Abdelaziz" in names


# =============================================================================
# TEST — Annex A completeness (hotfix assertions)
# =============================================================================

def test_split_wilaya_count():
    """Exactly 35 wilayas must have has_split_zones=True (RPA 2024 Annex A)."""
    split = [w for w in get_all_wilayas() if w["has_split_zones"]]
    assert len(split) == 35, (
        f"Expected 35 split wilayas, got {len(split)}: "
        + str([w["code"] for w in split])
    )


def test_all_split_wilayas_have_communes():
    """Every wilaya flagged has_split_zones=True must have at least one listed commune."""
    missing = [
        w for w in get_all_wilayas()
        if w["has_split_zones"] and len(get_communes(w["code"])) == 0
    ]
    assert missing == [], (
        "Split wilayas with empty commune list: "
        + str([(w["code"], w["name"]) for w in missing])
    )
