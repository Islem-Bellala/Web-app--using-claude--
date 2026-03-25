"""
RPA 2024 — Annex A: Seismic Zone Classification by Wilaya and Commune
=======================================================================
Reference: RPA 2024 (DTR BC 2.48) — Annex A

This module is the SINGLE SOURCE OF TRUTH for Algerian wilaya-to-zone mapping.
The backend serves this data via API. The frontend fetches it — never hardcodes it.

Data verified against the official RPA 2024 Annex A Excel source.
"""

from __future__ import annotations

# =============================================================================
# DATA — RPA 2024 Annex A
# =============================================================================

# Full list of 58 wilayas with their default seismic zone.
# has_split_zones=True means this wilaya has communes in different zones.
_WILAYAS: list[dict] = [
    {"code": "01", "name": "Adrar",               "zone": "0",   "has_split_zones": False},
    {"code": "02", "name": "Chlef",                "zone": "VI",  "has_split_zones": True},
    {"code": "03", "name": "Laghouat",             "zone": "II",  "has_split_zones": True},
    {"code": "04", "name": "Oum El Bouaghi",       "zone": "IV",  "has_split_zones": True},
    {"code": "05", "name": "Batna",                "zone": "III", "has_split_zones": True},
    {"code": "06", "name": "Béjaïa",              "zone": "VI",  "has_split_zones": True},
    {"code": "07", "name": "Biskra",               "zone": "III", "has_split_zones": True},
    {"code": "08", "name": "Béchar",              "zone": "I",   "has_split_zones": False},
    {"code": "09", "name": "Blida",                "zone": "VI",  "has_split_zones": False},
    {"code": "10", "name": "Bouira",               "zone": "V",   "has_split_zones": True},
    {"code": "11", "name": "Tamanrasset",          "zone": "0",   "has_split_zones": False},
    {"code": "12", "name": "Tébessa",             "zone": "III", "has_split_zones": True},
    {"code": "13", "name": "Tlemcen",              "zone": "IV",  "has_split_zones": True},
    {"code": "14", "name": "Tiaret",               "zone": "III", "has_split_zones": True},
    {"code": "15", "name": "Tizi Ouzou",           "zone": "IV",  "has_split_zones": True},
    {"code": "16", "name": "Alger",                "zone": "VI",  "has_split_zones": False},
    {"code": "17", "name": "Djelfa",               "zone": "III", "has_split_zones": True},
    {"code": "18", "name": "Jijel",                "zone": "VI",  "has_split_zones": True},
    {"code": "19", "name": "Sétif",               "zone": "IV",  "has_split_zones": True},
    {"code": "20", "name": "Saïda",               "zone": "I",   "has_split_zones": True},
    {"code": "21", "name": "Skikda",               "zone": "IV",  "has_split_zones": True},
    {"code": "22", "name": "Sidi Bel Abbès",      "zone": "I",   "has_split_zones": True},
    {"code": "23", "name": "Annaba",               "zone": "IV",  "has_split_zones": False},
    {"code": "24", "name": "Guelma",               "zone": "V",   "has_split_zones": False},
    {"code": "25", "name": "Constantine",          "zone": "V",   "has_split_zones": False},
    {"code": "26", "name": "Médéa",               "zone": "V",   "has_split_zones": True},
    {"code": "27", "name": "Mostaganem",           "zone": "V",   "has_split_zones": True},
    {"code": "28", "name": "M'Sila",              "zone": "IV",  "has_split_zones": True},
    {"code": "29", "name": "Mascara",              "zone": "VI",  "has_split_zones": True},
    {"code": "30", "name": "Ouargla",              "zone": "0",   "has_split_zones": False},
    {"code": "31", "name": "Oran",                 "zone": "VI",  "has_split_zones": True},
    {"code": "32", "name": "El Bayadh",            "zone": "II",  "has_split_zones": True},
    {"code": "33", "name": "Illizi",               "zone": "0",   "has_split_zones": False},
    {"code": "34", "name": "Bordj Bou Arréridj",  "zone": "V",   "has_split_zones": True},
    {"code": "35", "name": "Boumerdès",            "zone": "VI",  "has_split_zones": True},
    {"code": "36", "name": "El Tarf",              "zone": "V",   "has_split_zones": True},
    {"code": "37", "name": "Tindouf",              "zone": "0",   "has_split_zones": False},
    {"code": "38", "name": "Tissemsilt",           "zone": "IV",  "has_split_zones": True},
    {"code": "39", "name": "El Oued",              "zone": "II",  "has_split_zones": True},
    {"code": "40", "name": "Khenchela",            "zone": "III", "has_split_zones": True},
    {"code": "41", "name": "Souk Ahras",           "zone": "V",   "has_split_zones": True},
    {"code": "42", "name": "Tipaza",               "zone": "VI",  "has_split_zones": False},
    {"code": "43", "name": "Mila",                 "zone": "V",   "has_split_zones": True},
    {"code": "44", "name": "Aïn Defla",           "zone": "VI",  "has_split_zones": True},
    {"code": "45", "name": "Naâma",               "zone": "II",  "has_split_zones": True},
    {"code": "46", "name": "Aïn Témouchent",      "zone": "V",   "has_split_zones": True},
    {"code": "47", "name": "Ghardaïa",            "zone": "I",   "has_split_zones": False},
    {"code": "48", "name": "Relizane",             "zone": "VI",  "has_split_zones": True},
    {"code": "49", "name": "Timimoun",             "zone": "0",   "has_split_zones": False},
    {"code": "50", "name": "Bordj Badji Mokhtar",  "zone": "0",   "has_split_zones": False},
    {"code": "51", "name": "Ouled Djellal",        "zone": "II",  "has_split_zones": False},
    {"code": "52", "name": "Béni Abbès",          "zone": "0",   "has_split_zones": False},
    {"code": "53", "name": "In Salah",             "zone": "0",   "has_split_zones": False},
    {"code": "54", "name": "In Guezzam",           "zone": "0",   "has_split_zones": False},
    {"code": "55", "name": "Touggourt",            "zone": "I",   "has_split_zones": False},
    {"code": "56", "name": "Djanet",               "zone": "0",   "has_split_zones": False},
    {"code": "57", "name": "El M'Ghair",          "zone": "I",   "has_split_zones": False},
    {"code": "58", "name": "El Meniaa",            "zone": "0",   "has_split_zones": False},
]

# Commune-level zone overrides for split-zone wilayas.
# Structure: { wilaya_code: { "default_zone": str, "communes": [ {"name": str, "zone": str} ] } }
# Communes listed here have a zone different from the wilaya default.
# Communes NOT listed belong to the wilaya's default zone.
_COMMUNES: dict[str, dict] = {
    "02": {"default_zone": "VI", "communes": [
        {"name": "Beni Bouattab", "zone": "V"},
        {"name": "Taougrite",     "zone": "V"},
        {"name": "El Marsa",      "zone": "V"},
        {"name": "Dahra",         "zone": "V"},
    ]},
    "06": {"default_zone": "VI", "communes": [
        {"name": "Toudja",  "zone": "V"},
        {"name": "Adekar",  "zone": "V"},
        {"name": "El Kseur","zone": "V"},
        {"name": "Akfadou", "zone": "V"},
    ]},
    "09": {"default_zone": "VI", "communes": []},
    "10": {"default_zone": "V", "communes": [
        {"name": "Taguedit", "zone": "IV"},
        {"name": "Mezdour",  "zone": "IV"},
        {"name": "Dirah",    "zone": "IV"},
    ]},
    "15": {"default_zone": "IV", "communes": [
        {"name": "Illilten",      "zone": "V"},
        {"name": "Bouzguen",      "zone": "V"},
        {"name": "Boghni",        "zone": "V"},
        {"name": "Draa El Mizan", "zone": "V"},
        {"name": "Tizi Ghenif",   "zone": "V"},
    ]},
    "16": {"default_zone": "VI", "communes": []},
    "18": {"default_zone": "V", "communes": [
        # Groupe A — Zone VI
        {"name": "El Taguene",       "zone": "VI"},
        {"name": "El Aouana",        "zone": "VI"},
        {"name": "Ziama Mansouriah", "zone": "VI"},
        {"name": "Selma Ben Ziada",  "zone": "VI"},
        {"name": "Jijel",            "zone": "VI"},
        {"name": "Kaous",            "zone": "VI"},
        # Groupe C — Zone IV
        {"name": "Djemaa Beni Habibi", "zone": "IV"},
        {"name": "El Ancer",           "zone": "IV"},
        {"name": "El Milia",           "zone": "IV"},
        {"name": "Kheiri Oued Adjoul", "zone": "IV"},
        {"name": "Sidi Abdelaziz",     "zone": "IV"},
        # Groupe B (Zone V) = all other communes — handled by default_zone
    ]},
    "19": {"default_zone": "IV", "communes": [
        {"name": "Babor",          "zone": "VI"},
        {"name": "Bousselam",      "zone": "VI"},
        {"name": "Ain Sebt",       "zone": "V"},
        {"name": "Ain El Kebira",  "zone": "V"},
        {"name": "Bougaa",         "zone": "V"},
    ]},
    "29": {"default_zone": "VI", "communes": [
        {"name": "Ain Fares",           "zone": "V"},
        {"name": "Sidi Abdelmoumen",    "zone": "V"},
    ]},
    "34": {"default_zone": "IV", "communes": [
        {"name": "Tafreg",  "zone": "V"},
        {"name": "Djaafra", "zone": "V"},
        {"name": "El Main", "zone": "V"},
    ]},
    "35": {"default_zone": "VI", "communes": [
        {"name": "Chaabet El Ameur", "zone": "V"},
        {"name": "Leghata",          "zone": "V"},
        {"name": "Timezrit",         "zone": "V"},
        {"name": "Isser",            "zone": "V"},
        {"name": "Bordj Menaiel",    "zone": "V"},
        {"name": "Naciria",          "zone": "V"},
        {"name": "Sidi Daoud",       "zone": "IV"},
        {"name": "Dellys",           "zone": "IV"},
        {"name": "Afir",             "zone": "IV"},
        {"name": "Baghlia",          "zone": "IV"},
    ]},
    "42": {"default_zone": "VI", "communes": []},
    "44": {"default_zone": "VI", "communes": [
        {"name": "Djelida",           "zone": "V"},
        {"name": "El Maine",          "zone": "V"},
        {"name": "Zeddine",           "zone": "V"},
        {"name": "Tarik Ibn Ziad",    "zone": "IV"},
        {"name": "El Hassania",       "zone": "IV"},
    ]},
    "48": {"default_zone": "VI", "communes": [
        {"name": "Ouled Yaich", "zone": "V"},
        {"name": "Zemmora",     "zone": "V"},
        {"name": "Ain Tarek",   "zone": "IV"},
        {"name": "El Hassi",    "zone": "IV"},
    ]},
}

# Build fast lookup dict: code -> wilaya record
_WILAYA_BY_CODE: dict[str, dict] = {w["code"]: w for w in _WILAYAS}


# =============================================================================
# PUBLIC API
# =============================================================================

def get_all_wilayas() -> list[dict]:
    """
    Return list of all 58 wilayas.

    Each item: {"code": str, "name": str, "zone": str, "has_split_zones": bool}
    """
    return list(_WILAYAS)


def get_communes(wilaya_code: str) -> list[dict]:
    """
    Return communes for a split-zone wilaya: [{"name": str, "zone": str}].

    Returns empty list for wilayas that have no commune-level splits.
    The returned communes are only those with a zone different from the default.
    """
    entry = _COMMUNES.get(wilaya_code)
    if entry is None:
        return []
    return list(entry["communes"])


def get_zone(wilaya_code: str, commune: str | None = None) -> str:
    """
    Return the seismic zone string for a wilaya (and optionally commune).

    For split-zone wilayas where the engineer has selected a specific commune:
        - If the commune is listed in _COMMUNES, returns its zone.
        - Otherwise returns the wilaya's default zone.

    For non-split wilayas: commune argument is ignored.

    Args:
        wilaya_code: Two-digit string, e.g. "09"
        commune:     Commune name (required only for split-zone wilayas
                     when a specific commune has been selected)

    Returns:
        Zone string: "0", "I", "II", "III", "IV", "V", or "VI"

    Raises:
        ValueError: If wilaya_code is not found
    """
    wilaya = _WILAYA_BY_CODE.get(wilaya_code)
    if wilaya is None:
        raise ValueError(f"Unknown wilaya code: {wilaya_code!r}")

    default_zone = wilaya["zone"]

    if commune and wilaya_code in _COMMUNES:
        commune_data = _COMMUNES[wilaya_code]
        for c in commune_data["communes"]:
            if c["name"] == commune:
                return c["zone"]
        # Commune not in the explicit list → use commune-level default
        # (e.g. Jijel "Groupe B" = Zone V for any unlisted commune)
        return commune_data["default_zone"]

    return default_zone


def is_split_zone_wilaya(wilaya_code: str) -> bool:
    """
    Return True if this wilaya has communes in different seismic zones.

    Args:
        wilaya_code: Two-digit string, e.g. "35"
    """
    wilaya = _WILAYA_BY_CODE.get(wilaya_code)
    if wilaya is None:
        return False
    return wilaya["has_split_zones"]
