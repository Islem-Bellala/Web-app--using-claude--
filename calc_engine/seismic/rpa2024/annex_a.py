"""
RPA 2024 — Annex A: Seismic Zone Classification by Wilaya and Commune
=======================================================================
Reference: RPA 2024 (DTR BC 2.48) — Annex A

This module is the SINGLE SOURCE OF TRUTH for Algerian wilaya-to-zone mapping.
The backend serves this data via API. The frontend fetches it — never hardcodes it.

Data verified against the official RPA 2024 Annex A PDF (clean scan, 9 pages).
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
    {"code": "04", "name": "Oum El Bouaghi",       "zone": "III", "has_split_zones": True},
    {"code": "05", "name": "Batna",                "zone": "III", "has_split_zones": True},
    {"code": "06", "name": "Béjaïa",              "zone": "VI",  "has_split_zones": True},
    {"code": "07", "name": "Biskra",               "zone": "II",  "has_split_zones": True},
    {"code": "08", "name": "Béchar",              "zone": "I",   "has_split_zones": False},
    {"code": "09", "name": "Blida",                "zone": "VI",  "has_split_zones": False},
    {"code": "10", "name": "Bouira",               "zone": "V",   "has_split_zones": True},
    {"code": "11", "name": "Tamanrasset",          "zone": "0",   "has_split_zones": False},
    {"code": "12", "name": "Tébessa",             "zone": "II",  "has_split_zones": True},
    {"code": "13", "name": "Tlemcen",              "zone": "IV",  "has_split_zones": True},
    {"code": "14", "name": "Tiaret",               "zone": "I",   "has_split_zones": True},
    {"code": "15", "name": "Tizi Ouzou",           "zone": "IV",  "has_split_zones": True},
    {"code": "16", "name": "Alger",                "zone": "VI",  "has_split_zones": False},
    {"code": "17", "name": "Djelfa",               "zone": "II",  "has_split_zones": True},
    {"code": "18", "name": "Jijel",                "zone": "V",   "has_split_zones": True},
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
    {"code": "34", "name": "Bordj Bou Arréridj",  "zone": "IV",  "has_split_zones": True},
    {"code": "35", "name": "Boumerdès",            "zone": "VI",  "has_split_zones": True},
    {"code": "36", "name": "El Tarf",              "zone": "IV",  "has_split_zones": True},
    {"code": "37", "name": "Tindouf",              "zone": "0",   "has_split_zones": False},
    {"code": "38", "name": "Tissemsilt",           "zone": "III", "has_split_zones": True},
    {"code": "39", "name": "El Oued",              "zone": "0",   "has_split_zones": True},
    {"code": "40", "name": "Khenchela",            "zone": "III", "has_split_zones": True},
    {"code": "41", "name": "Souk Ahras",           "zone": "IV",  "has_split_zones": True},
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
        {"name": "Beni Bouattab",        "zone": "V"},
        {"name": "Taougrite",            "zone": "V"},
        {"name": "El Marsa",             "zone": "V"},
        {"name": "Dahra",                "zone": "V"},
        {"name": "Ouled Ben Abdelkader", "zone": "V"},
        {"name": "Moussadek",            "zone": "V"},
        {"name": "Talassa",              "zone": "V"},
        {"name": "El Hadjadj",           "zone": "V"},
        {"name": "Sidi Abderrahmane",    "zone": "V"},
    ]},
    "03": {"default_zone": "II", "communes": [
        {"name": "Hassi Delaa", "zone": "I"},
    ]},
    "04": {"default_zone": "III", "communes": [
        {"name": "Sigus",        "zone": "IV"},
        {"name": "El Amiria",    "zone": "IV"},
        {"name": "Ouled Gacem",  "zone": "IV"},
        {"name": "Ain M'lila",   "zone": "IV"},
        {"name": "Bir Chouhada", "zone": "IV"},
        {"name": "Souk Naamane", "zone": "IV"},
        {"name": "Ouled Hamla",  "zone": "IV"},
        {"name": "Ksar Sbahi",   "zone": "IV"},
        {"name": "Ain Babouche", "zone": "IV"},
        {"name": "Ain Diss",     "zone": "IV"},
        {"name": "Oued Nini",    "zone": "II"},
        {"name": "Dhalaa",       "zone": "II"},
        {"name": "El Djazia",    "zone": "II"},
        {"name": "Meskiana",     "zone": "II"},
        {"name": "El Belala",    "zone": "II"},
    ]},
    "05": {"default_zone": "III", "communes": [
        {"name": "Abdelkader Azil", "zone": "II"},
        {"name": "M'Doukel",        "zone": "II"},
        {"name": "Bitam",           "zone": "II"},
        {"name": "Arris",           "zone": "II"},
        {"name": "Inoughissen",     "zone": "II"},
        {"name": "Ichemoul",        "zone": "II"},
        {"name": "Foum Toub",       "zone": "II"},
        {"name": "Ouled Fadel",     "zone": "II"},
    ]},
    "06": {"default_zone": "VI", "communes": [
        {"name": "Toudja",         "zone": "V"},
        {"name": "Adekar",         "zone": "V"},
        {"name": "Taourirt Ighil", "zone": "V"},
        {"name": "El Kseur",       "zone": "V"},
        {"name": "Fenaia Ilmaten", "zone": "V"},
        {"name": "Thinabdher",     "zone": "V"},
        {"name": "Tifra",          "zone": "V"},
        {"name": "Akfadou",        "zone": "V"},
        {"name": "Chemini",        "zone": "V"},
        {"name": "Tibane",         "zone": "V"},
        {"name": "Souk Oufella",   "zone": "V"},
        {"name": "Ouzellaguen",    "zone": "V"},
        {"name": "Boudjellil",     "zone": "V"},
        {"name": "Ighil Ali",      "zone": "V"},
        {"name": "Beni Ksila",     "zone": "V"},
    ]},
    "07": {"default_zone": "II", "communes": [
        {"name": "M'Ziraa",             "zone": "III"},
        {"name": "Zeribet El Oued",     "zone": "III"},
        {"name": "Khenguet Sidi Nadji", "zone": "III"},
        {"name": "Ain Zaatout",         "zone": "III"},
        {"name": "Branis",              "zone": "III"},
        {"name": "Chetma",              "zone": "III"},
        {"name": "Djemorah",            "zone": "III"},
        {"name": "El Kantara",          "zone": "III"},
        {"name": "El Outaya",           "zone": "III"},
        {"name": "M'Chouneche",         "zone": "III"},
    ]},
    "10": {"default_zone": "V", "communes": [
        {"name": "Taguedit",       "zone": "IV"},
        {"name": "Mezdour",        "zone": "IV"},
        {"name": "Hadjera Zergua", "zone": "IV"},
        {"name": "Dirah",          "zone": "IV"},
        {"name": "Mamora",         "zone": "IV"},
        {"name": "Ridane",         "zone": "IV"},
        {"name": "Bordj Oukhris",  "zone": "IV"},
        {"name": "El Hakimia",     "zone": "IV"},
    ]},
    "12": {"default_zone": "II", "communes": [
        {"name": "Bir El Ater",  "zone": "III"},
        {"name": "Ferkane",      "zone": "III"},
        {"name": "Negrine",      "zone": "III"},
        {"name": "Stah Guentis", "zone": "III"},
        {"name": "Tlidjene",     "zone": "III"},
        {"name": "El Meridj",    "zone": "III"},
        {"name": "Ouenza",       "zone": "III"},
        {"name": "El Aouinet",   "zone": "III"},
        {"name": "Boukhadra",    "zone": "III"},
    ]},
    "13": {"default_zone": "IV", "communes": [
        {"name": "Tlemcen",           "zone": "III"},
        {"name": "Mansourah",         "zone": "III"},
        {"name": "Ain Fezza",         "zone": "III"},
        {"name": "Ain Ghoraba",       "zone": "III"},
        {"name": "Terny Beni Hediel", "zone": "III"},
        {"name": "Sabra",             "zone": "III"},
        {"name": "Bouhlou",           "zone": "III"},
        {"name": "Beni Mester",       "zone": "III"},
        {"name": "Ain Nahala",        "zone": "III"},
        {"name": "Sidi Abdelli",      "zone": "III"},
        {"name": "Hennaya",           "zone": "III"},
        {"name": "Chetouane",         "zone": "III"},
        {"name": "Amieur",            "zone": "III"},
        {"name": "Sidi Medjahed",     "zone": "III"},
        {"name": "Beni Bahdel",       "zone": "III"},
        {"name": "Azails",            "zone": "III"},
        {"name": "Beni Boussaid",     "zone": "III"},
        {"name": "Beni Snous",        "zone": "III"},
        {"name": "Ain Tallout",       "zone": "II"},
        {"name": "Beni Semiel",       "zone": "II"},
        {"name": "Oued Lakhdar",      "zone": "II"},
        {"name": "Sebdou",            "zone": "II"},
        {"name": "Sidi Djillali",     "zone": "II"},
        {"name": "El Bouihi",         "zone": "II"},
        {"name": "El Gor",            "zone": "II"},
        {"name": "El Aricha",         "zone": "II"},
        {"name": "Ouled Mimoun",      "zone": "II"},
    ]},
    "14": {"default_zone": "I", "communes": [
        {"name": "Sebt",             "zone": "III"},
        {"name": "Tidda",            "zone": "III"},
        {"name": "Sidi Ali Mellal",  "zone": "III"},
        {"name": "Rahouia",          "zone": "III"},
        {"name": "Meghila",          "zone": "III"},
        {"name": "Ain Zarit",        "zone": "II"},
        {"name": "Ain Bouchekif",    "zone": "II"},
        {"name": "Ain El Hadid",     "zone": "II"},
        {"name": "Bougara",          "zone": "II"},
        {"name": "Dahmouni",         "zone": "II"},
        {"name": "Frenda",           "zone": "II"},
        {"name": "Hamadia",          "zone": "II"},
        {"name": "Mahdia",           "zone": "II"},
        {"name": "Mechraa Safa",     "zone": "II"},
        {"name": "Medroussa",        "zone": "II"},
        {"name": "Mellakou",         "zone": "II"},
        {"name": "Sebaine",          "zone": "II"},
        {"name": "Sidi Bakhti",      "zone": "II"},
        {"name": "Tagdemt",          "zone": "II"},
        {"name": "Takhemaret",       "zone": "II"},
        {"name": "Tiaret",           "zone": "II"},
        {"name": "Rechaiga",         "zone": "II"},
        {"name": "Si Abdelghani",    "zone": "II"},
        {"name": "Nadorah",          "zone": "II"},
        {"name": "Sidi Hosni",       "zone": "II"},
        {"name": "Djillali Ben Amar","zone": "II"},
        {"name": "Oued Lilli",       "zone": "II"},
        {"name": "Guertoufa",        "zone": "II"},
    ]},
    "15": {"default_zone": "IV", "communes": [
        {"name": "Illilten",         "zone": "V"},
        {"name": "Iloula Oumalou",   "zone": "V"},
        {"name": "Iferhounene",      "zone": "V"},
        {"name": "Imsouhal",         "zone": "V"},
        {"name": "Bouzguen",         "zone": "V"},
        {"name": "Beni Ziki",        "zone": "V"},
        {"name": "Idjer",            "zone": "V"},
        {"name": "Abi Youcef",       "zone": "V"},
        {"name": "Akbil",            "zone": "V"},
        {"name": "Yatafene",         "zone": "V"},
        {"name": "Iboudraren",       "zone": "V"},
        {"name": "Ouacif",           "zone": "V"},
        {"name": "Ait Boumahdi",     "zone": "V"},
        {"name": "Boghni",           "zone": "V"},
        {"name": "Bounouh",          "zone": "V"},
        {"name": "Frikat",           "zone": "V"},
        {"name": "Draa El Mizan",    "zone": "V"},
        {"name": "Tizi Ghenif",      "zone": "V"},
        {"name": "Mkira",            "zone": "V"},
        {"name": "Ait Yahia",        "zone": "V"},
        {"name": "Ifigha",           "zone": "V"},
        {"name": "Souamaa",          "zone": "V"},
        {"name": "Tadmait",          "zone": "V"},
        {"name": "Ain El Hammam",    "zone": "V"},
        {"name": "Beni Yenni",       "zone": "V"},
        {"name": "Ait Toudert",      "zone": "V"},
        {"name": "Agouni Gueghrane", "zone": "V"},
        {"name": "Ouadhia",          "zone": "V"},
        {"name": "Ait Bouadou",      "zone": "V"},
        {"name": "Tizi N'Tleta",     "zone": "V"},
        {"name": "Assi Youcef",      "zone": "V"},
        {"name": "Ait Yahia Moussa", "zone": "V"},
        {"name": "Ain Zaouia",       "zone": "V"},
        {"name": "Mechtras",         "zone": "V"},
    ]},
    "17": {"default_zone": "II", "communes": [
        {"name": "Birin",       "zone": "III"},
        {"name": "Ain Feka",    "zone": "III"},
        {"name": "Guettara",    "zone": "I"},
        {"name": "Oum Laadham", "zone": "I"},
        {"name": "Sed Rahal",   "zone": "I"},
    ]},
    "18": {"default_zone": "V", "communes": [
        # Zone VI
        {"name": "Erraguene",          "zone": "VI"},
        {"name": "El Aouana",          "zone": "VI"},
        {"name": "Ziama Mansouriah",   "zone": "VI"},
        {"name": "Selma Ben Ziada",    "zone": "VI"},
        {"name": "Jijel",              "zone": "VI"},
        {"name": "Kaous",              "zone": "VI"},
        # Zone IV
        {"name": "Djemaa Beni Habibi", "zone": "IV"},
        {"name": "El Ancer",           "zone": "IV"},
        {"name": "El Milia",           "zone": "IV"},
        {"name": "Kheiri Oued Adjoul", "zone": "IV"},
        {"name": "Sidi Abdelaziz",     "zone": "IV"},
        # Zone V = all other communes — handled by default_zone
    ]},
    "19": {"default_zone": "IV", "communes": [
        # Zone VI
        {"name": "Babor",            "zone": "VI"},
        {"name": "Oued El Bared",    "zone": "VI"},
        {"name": "Tizi N'Bechar",    "zone": "VI"},
        {"name": "Tala Ifacene",     "zone": "VI"},
        {"name": "Ait Tizi",         "zone": "VI"},
        {"name": "Ait Nawal M'zada", "zone": "VI"},
        {"name": "Bousselam",        "zone": "VI"},
        {"name": "Beni Mouhli",      "zone": "VI"},
        {"name": "Beni Chebana",     "zone": "VI"},
        {"name": "Beni Ouartilane",  "zone": "VI"},
        {"name": "Bouandas",         "zone": "VI"},
        # Zone V
        {"name": "Ain Sebt",         "zone": "V"},
        {"name": "Beni Aziz",        "zone": "V"},
        {"name": "Serdj El Ghoul",   "zone": "V"},
        {"name": "Ain Abessa",       "zone": "V"},
        {"name": "Ain El Kebira",    "zone": "V"},
        {"name": "Amoucha",          "zone": "V"},
        {"name": "Ain Roua",         "zone": "V"},
        {"name": "El Ouricia",       "zone": "V"},
        {"name": "Beni Fouda",       "zone": "V"},
        {"name": "Maaouia",          "zone": "V"},
        {"name": "Ouled Addouane",   "zone": "V"},
        {"name": "Dehamcha",         "zone": "V"},
        {"name": "Djemila",          "zone": "V"},
        {"name": "Maoklane",         "zone": "V"},
        {"name": "Ain Legradj",      "zone": "V"},
        {"name": "Guenzet",          "zone": "V"},
        {"name": "Harbil",           "zone": "V"},
        {"name": "Hammam Guergour",  "zone": "V"},
        {"name": "Bougaa",           "zone": "V"},
        {"name": "Draa Kebila",      "zone": "V"},
    ]},
    "20": {"default_zone": "I", "communes": [
        {"name": "Saida",          "zone": "II"},
        {"name": "Ain Soltane",    "zone": "II"},
        {"name": "Doui Thabet",    "zone": "II"},
        {"name": "Ouled Brahim",   "zone": "II"},
        {"name": "Ouled Khaled",   "zone": "II"},
        {"name": "Youb",           "zone": "II"},
        {"name": "Hounet",         "zone": "II"},
        {"name": "Sidi Boubekeur", "zone": "II"},
        {"name": "Sidi Amar",      "zone": "II"},
    ]},
    "21": {"default_zone": "IV", "communes": [
        {"name": "Ain Bouziane",      "zone": "V"},
        {"name": "Beni Oulbane",      "zone": "V"},
        {"name": "El Ghedir",         "zone": "V"},
        {"name": "El Harrouch",       "zone": "V"},
        {"name": "Emdjez Edchich",    "zone": "V"},
        {"name": "Es Sebt",           "zone": "V"},
        {"name": "Ouled Hbaba",       "zone": "V"},
        {"name": "Oum Toub",          "zone": "V"},
        {"name": "Salah Bouchaour",   "zone": "V"},
        {"name": "Sidi Mezghiche",    "zone": "V"},
        {"name": "Zerdaza",           "zone": "V"},
        {"name": "Ain Charchar",      "zone": "V"},
        {"name": "Bekkouche Lakhdar", "zone": "V"},
        {"name": "Azzaba",            "zone": "V"},
        {"name": "Ramdane Djamel",    "zone": "V"},
    ]},
    "22": {"default_zone": "I", "communes": [
        # Zone IV
        {"name": "Ain Adden",            "zone": "IV"},
        {"name": "Ain El Berd",          "zone": "IV"},
        {"name": "Ain Thrid",            "zone": "IV"},
        {"name": "Boudjebaa El Bordj",   "zone": "IV"},
        {"name": "Makedra",              "zone": "IV"},
        {"name": "Sehala Thaoura",       "zone": "IV"},
        {"name": "Sfisef",               "zone": "IV"},
        {"name": "Sidi Daho De Zairs",   "zone": "IV"},
        {"name": "Sidi Hamadouche",      "zone": "IV"},
        {"name": "Tessala",              "zone": "IV"},
        # Zone III
        {"name": "Sidi Bel Abbes",       "zone": "III"},
        {"name": "Ain Kada",             "zone": "III"},
        {"name": "Hassi Zahana",         "zone": "III"},
        {"name": "Lamtar",               "zone": "III"},
        {"name": "M'Cid",                "zone": "III"},
        {"name": "Mostefa Ben Brahim",   "zone": "III"},
        {"name": "Sidi Ali Boussidi",    "zone": "III"},
        {"name": "Sidi Brahim",          "zone": "III"},
        {"name": "Sidi Khaled",          "zone": "III"},
        {"name": "Sidi Lahcene",         "zone": "III"},
        {"name": "Sidi Yacoub",          "zone": "III"},
        {"name": "Tilmouni",             "zone": "III"},
        {"name": "Zerouala",             "zone": "III"},
        # Zone II
        {"name": "Ain Tindamine",        "zone": "II"},
        {"name": "Benachiba Chelia",     "zone": "II"},
        {"name": "Chettouane Belaila",   "zone": "II"},
        {"name": "El Hacaiba",           "zone": "II"},
        {"name": "Merine",               "zone": "II"},
        {"name": "Mezaourou",            "zone": "II"},
        {"name": "Moulay Slissen",       "zone": "II"},
        {"name": "Sidi Ali Benyoub",     "zone": "II"},
        {"name": "Teghalimet",           "zone": "II"},
        {"name": "Telagh",               "zone": "II"},
        {"name": "Tabia",                "zone": "II"},
        {"name": "Belarbi",              "zone": "II"},
        {"name": "Boukhanafis",          "zone": "II"},
        {"name": "Oued Sefioun",         "zone": "II"},
        {"name": "Amamas",               "zone": "II"},
        {"name": "Hassi Dahou",          "zone": "II"},
        {"name": "Tenira",               "zone": "II"},
        {"name": "Ben Badis",            "zone": "II"},
        {"name": "Badredine El Mokrani", "zone": "II"},
    ]},
    "26": {"default_zone": "V", "communes": [
        # Zone IV
        {"name": "Ouled Hellal",        "zone": "IV"},
        {"name": "Ouled Antar",         "zone": "IV"},
        {"name": "Boghar",              "zone": "IV"},
        {"name": "Moudjbar",            "zone": "IV"},
        {"name": "Seghouane",           "zone": "IV"},
        {"name": "Ain Ouksir",          "zone": "IV"},
        {"name": "Chelalat El Adhoura", "zone": "IV"},
        {"name": "Tafraout",            "zone": "IV"},
        {"name": "Sidi Ziane",          "zone": "IV"},
        {"name": "Rebaia",              "zone": "IV"},
        {"name": "Kef Lakhdar",         "zone": "IV"},
        {"name": "Tlalet Eddouair",     "zone": "IV"},
        {"name": "Cheniguel",           "zone": "IV"},
        # Zone III
        {"name": "Aziz",                "zone": "III"},
        {"name": "Derrag",              "zone": "III"},
        {"name": "Oum El Djalil",       "zone": "III"},
        {"name": "Ksar El Boukhari",    "zone": "III"},
        {"name": "Saneg",               "zone": "III"},
        {"name": "Mefatha",             "zone": "III"},
        {"name": "Ain Boucif",          "zone": "III"},
        {"name": "Sidi Damed",          "zone": "III"},
        {"name": "El Aouinet",          "zone": "III"},
        {"name": "Ouled Maaref",        "zone": "III"},
        # Zone II
        {"name": "Chahbounia",          "zone": "II"},
        {"name": "Bouaiche",            "zone": "II"},
        {"name": "Boughezoul",          "zone": "II"},
    ]},
    "27": {"default_zone": "V", "communes": [
        {"name": "Bouguirat",     "zone": "VI"},
        {"name": "Oued El Kheir", "zone": "VI"},
        {"name": "Ouled Maaleh",  "zone": "VI"},
        {"name": "Safsaf",        "zone": "VI"},
        {"name": "Sidi Ali",      "zone": "VI"},
        {"name": "Souaflia",      "zone": "VI"},
        {"name": "Sour",          "zone": "VI"},
    ]},
    "28": {"default_zone": "IV", "communes": [
        # Zone III
        {"name": "Ain Khadra",         "zone": "III"},
        {"name": "Benzouh",            "zone": "III"},
        {"name": "Berhoum",            "zone": "III"},
        {"name": "Chellal",            "zone": "III"},
        {"name": "Dehahna",            "zone": "III"},
        {"name": "Magra",              "zone": "III"},
        {"name": "Ouled Addi Guebala", "zone": "III"},
        {"name": "Ouled Derradj",      "zone": "III"},
        {"name": "Ouled Madhi",        "zone": "III"},
        {"name": "Souamaa",            "zone": "III"},
        {"name": "Belaiba",            "zone": "III"},
        {"name": "Khoubana",           "zone": "III"},
        {"name": "M'Cif",              "zone": "III"},
        {"name": "Maarif",             "zone": "III"},
        {"name": "Ouled Sidi Brahim",  "zone": "III"},
        {"name": "Sidi Ameur",         "zone": "III"},
        # Zone II
        {"name": "Bou Saada",          "zone": "II"},
        {"name": "El Houamed",         "zone": "II"},
        {"name": "Tamsa",              "zone": "II"},
        {"name": "Slim",               "zone": "II"},
        {"name": "Bir Fodda",          "zone": "II"},
        {"name": "Sidi M'hamed",       "zone": "II"},
        {"name": "Ain Fares",          "zone": "II"},
        {"name": "Mohamed Boudiaf",    "zone": "II"},
        {"name": "Ain El Melh",        "zone": "II"},
        {"name": "Ouled Slimane",      "zone": "II"},
        {"name": "Zerzour",            "zone": "II"},
        {"name": "Ben Srour",          "zone": "II"},
        {"name": "Djebel Messaad",     "zone": "II"},
        {"name": "El Hamel",           "zone": "II"},
        {"name": "Medjedel",           "zone": "II"},
        {"name": "Ouled Atia",         "zone": "II"},
        {"name": "Oultem",             "zone": "II"},
        {"name": "Ain Errich",         "zone": "II"},
    ]},
    "29": {"default_zone": "VI", "communes": [
        # Zone V
        {"name": "Sidi Kada",        "zone": "V"},
        {"name": "Sidi Boussaid",    "zone": "V"},
        {"name": "Sidi Abdeldjebar", "zone": "V"},
        {"name": "Bouhanifia",       "zone": "V"},
        {"name": "El Gaada",         "zone": "V"},
        {"name": "Zahana",           "zone": "V"},
        {"name": "Chorfa",           "zone": "V"},
        {"name": "Froha",            "zone": "V"},
        {"name": "Matemor",          "zone": "V"},
        {"name": "Tizi",             "zone": "V"},
        # Zone IV
        {"name": "Oued El Abtal",    "zone": "IV"},
        {"name": "Hachem",           "zone": "IV"},
        {"name": "Zelmata",          "zone": "IV"},
        {"name": "Guerdjoum",        "zone": "IV"},
        {"name": "Ain Fekan",        "zone": "IV"},
        {"name": "Ghriss",           "zone": "IV"},
        {"name": "Ain Fras",         "zone": "IV"},
        {"name": "Makdha",           "zone": "IV"},
        {"name": "Nesmoth",          "zone": "IV"},
        # Zone III
        {"name": "Ain Ferah",        "zone": "III"},
        {"name": "Gharrous",         "zone": "III"},
        {"name": "Aouf",             "zone": "III"},
        {"name": "Beniane",          "zone": "III"},
        {"name": "Oued Taria",       "zone": "III"},
    ]},
    "31": {"default_zone": "VI", "communes": [
        {"name": "Tafraoui", "zone": "V"},
    ]},
    "32": {"default_zone": "II", "communes": [
        {"name": "Bougtob",    "zone": "I"},
        {"name": "Cheguig",    "zone": "I"},
        {"name": "El Kheiter", "zone": "I"},
        {"name": "Rogassa",    "zone": "I"},
    ]},
    "34": {"default_zone": "IV", "communes": [
        {"name": "Tafreg",            "zone": "V"},
        {"name": "Djaafra",           "zone": "V"},
        {"name": "Tassamert",         "zone": "V"},
        {"name": "Ouled Sidi Brahim", "zone": "V"},
        {"name": "El Main",           "zone": "V"},
    ]},
    "35": {"default_zone": "VI", "communes": [
        # Zone V
        {"name": "Chaabet El Ameur", "zone": "V"},
        {"name": "Leghata",          "zone": "V"},
        {"name": "Timezrit",         "zone": "V"},
        {"name": "Isser",            "zone": "V"},
        {"name": "Bordj Menaiel",    "zone": "V"},
        {"name": "Djenet",           "zone": "V"},
        {"name": "Naciria",          "zone": "V"},
        {"name": "Ouled Aissa",      "zone": "V"},
        # Zone IV
        {"name": "Sidi Daoud",       "zone": "IV"},
        {"name": "Ben Choud",        "zone": "IV"},
        {"name": "Dellys",           "zone": "IV"},
        {"name": "Afir",             "zone": "IV"},
        {"name": "Baghlia",          "zone": "IV"},
        {"name": "Taourga",          "zone": "IV"},
    ]},
    "36": {"default_zone": "IV", "communes": [
        {"name": "Asfour",             "zone": "V"},
        {"name": "Chihani",            "zone": "V"},
        {"name": "Hammam Beni Salah",  "zone": "V"},
        {"name": "Drean",              "zone": "V"},
    ]},
    "38": {"default_zone": "III", "communes": [
        {"name": "Boucaid",    "zone": "IV"},
        {"name": "Larbaa",     "zone": "IV"},
        {"name": "Lazharia",   "zone": "IV"},
        {"name": "Melaab",     "zone": "IV"},
        {"name": "Khemisti",   "zone": "II"},
        {"name": "Laayoune",   "zone": "II"},
        {"name": "Tissemsilt", "zone": "II"},
        {"name": "Ammari",     "zone": "II"},
        {"name": "Maacem",     "zone": "II"},
    ]},
    "39": {"default_zone": "0", "communes": [
        # Zone II
        {"name": "Guemar",            "zone": "II"},
        {"name": "Sidi Aoun",         "zone": "II"},
        {"name": "Magrane",           "zone": "II"},
        {"name": "Hassi Khelifa",     "zone": "II"},
        {"name": "Beni Guecha",       "zone": "II"},
        {"name": "Hamraia",           "zone": "II"},
        # Zone I
        {"name": "El Oued",           "zone": "I"},
        {"name": "Kouinine",          "zone": "I"},
        {"name": "Ourmes",            "zone": "I"},
        {"name": "Taghzout",          "zone": "I"},
        {"name": "Bayadha",           "zone": "I"},
        {"name": "Hassani Abdelkrim", "zone": "I"},
        {"name": "Debila",            "zone": "I"},
        {"name": "Reguiba",           "zone": "I"},
        {"name": "Trifaoui",          "zone": "I"},
        {"name": "Taleb Larbi",       "zone": "I"},
        {"name": "Nekhla",            "zone": "I"},
        {"name": "Mih Ouensa",        "zone": "I"},
        {"name": "El Ogla",           "zone": "I"},
        {"name": "Robbah",            "zone": "I"},
        {"name": "Oued Allenda",      "zone": "I"},
    ]},
    "40": {"default_zone": "III", "communes": [
        {"name": "M'Sara",         "zone": "II"},
        {"name": "Ain Touila",     "zone": "II"},
        {"name": "Baghai",         "zone": "II"},
        {"name": "Bouhmama",       "zone": "II"},
        {"name": "Chelia",         "zone": "II"},
        {"name": "El Hamma",       "zone": "II"},
        {"name": "El Mahmal",      "zone": "II"},
        {"name": "Ensigha",        "zone": "II"},
        {"name": "Kais",           "zone": "II"},
        {"name": "Khenchela",      "zone": "II"},
        {"name": "M'Toussa",       "zone": "II"},
        {"name": "Ouled Rechache", "zone": "II"},
        {"name": "Tamza",          "zone": "II"},
        {"name": "Taouzient",      "zone": "II"},
        {"name": "Yabous",         "zone": "II"},
        {"name": "Remila",         "zone": "II"},
    ]},
    "41": {"default_zone": "IV", "communes": [
        {"name": "Hanancha",      "zone": "V"},
        {"name": "Mechroha",      "zone": "V"},
        {"name": "Bir Bouhouche", "zone": "III"},
        {"name": "Oum El Adhaim", "zone": "III"},
        {"name": "Oued Kebrit",   "zone": "III"},
        {"name": "Safel",         "zone": "III"},
        {"name": "El Ouiden",     "zone": "III"},
        {"name": "Terraguelt",    "zone": "III"},
    ]},
    "43": {"default_zone": "V", "communes": [
        {"name": "Tadjenanet",     "zone": "IV"},
        {"name": "Ouled Khellouf", "zone": "IV"},
        {"name": "M'Chira",        "zone": "IV"},
    ]},
    "44": {"default_zone": "VI", "communes": [
        # Zone V
        {"name": "Djelida",             "zone": "V"},
        {"name": "El Maine",            "zone": "V"},
        {"name": "Zeddine",             "zone": "V"},
        {"name": "Bourached",           "zone": "V"},
        {"name": "Oued Djemaa",         "zone": "V"},
        {"name": "Ain Lachiakh",        "zone": "V"},
        {"name": "Djemaa Ouled Cheikh", "zone": "V"},
        {"name": "Birbouche",           "zone": "V"},
        {"name": "Oued Chorfa",         "zone": "V"},
        {"name": "Bordj Emir Khaled",   "zone": "V"},
        {"name": "Ain Soltane",         "zone": "V"},
        {"name": "Bir Ouled Khelifa",   "zone": "V"},
        # Zone IV
        {"name": "Tarik Ibn Ziad",      "zone": "IV"},
        {"name": "El Hassania",         "zone": "IV"},
        {"name": "Bathia",              "zone": "IV"},
        {"name": "Belaas",              "zone": "IV"},
    ]},
    "45": {"default_zone": "II", "communes": [
        {"name": "El Biod",          "zone": "I"},
        {"name": "Kasdir",           "zone": "I"},
        {"name": "Makman Ben Ammar", "zone": "I"},
    ]},
    "46": {"default_zone": "V", "communes": [
        {"name": "Aghlal",        "zone": "IV"},
        {"name": "Aoubellil",     "zone": "IV"},
        {"name": "Hassasna",      "zone": "IV"},
        {"name": "Oued Berkeche", "zone": "IV"},
    ]},
    "48": {"default_zone": "VI", "communes": [
        # Zone V
        {"name": "Ouled Yaich",           "zone": "V"},
        {"name": "Zemmora",               "zone": "V"},
        {"name": "Sidi M'Hamed Benaouda", "zone": "V"},
        {"name": "Dar Ben Abdellah",      "zone": "V"},
        {"name": "Souk El Had",           "zone": "V"},
        {"name": "Ammi Moussa",           "zone": "V"},
        # Zone IV
        {"name": "Ain Tarek",    "zone": "IV"},
        {"name": "El Hassi",     "zone": "IV"},
        {"name": "Had Echkalla", "zone": "IV"},
        {"name": "Mendes",       "zone": "IV"},
        {"name": "Oued Essalem", "zone": "IV"},
        {"name": "Ramka",        "zone": "IV"},
        {"name": "Sidi Lazreg",  "zone": "IV"},
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
