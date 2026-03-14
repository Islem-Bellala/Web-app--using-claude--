/**
 * StructCalc — RPA 2024 Spectrum Visualizer (Session 5 — Update)
 *
 * Changes:
 *   - Wilaya selector -> auto-fills zone (RPA 2024 Annex A)
 *   - Dark mode contrast fixed (textMuted, textSec brighter)
 *   - Font sizes increased, labels more readable
 *   - "V base" renamed to "V total à la base" in R modal
 *
 * Code references:
 *   RPA 2024 §3.3.3 Eq.3.15 — horizontal design spectrum
 *   RPA 2024 §3.3.3 Eq.3.16 — vertical design spectrum
 *   RPA 2024 §3.5  Table 3.18 — structural systems + R values
 *   RPA 2024 §3.8  Table 3.19 — quality factor QF
 *   RPA 2024 Annex A — wilaya seismic zone classification
 */

import { useState, useEffect, useMemo } from "react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts"

// ─────────────────────────────────────────────────────────────────────────────
// RPA 2024 — ANNEX A — WILAYA -> ZONE MAPPING
// zone: dominant zone for the wilaya
// split: true = wilaya is divided between multiple zones (note shown to user)
// Source: RPA 2024 DTR BC 2.48, Annex A, Tables A.1–A.9
// ─────────────────────────────────────────────────────────────────────────────

const WILAYAS = [
  {code:"01", name:"Adrar",              zone:"0",   split:false},
  {code:"02", name:"Chlef",              zone:"VI",  split:true },
  {code:"03", name:"Laghouat",           zone:"II",  split:true },
  {code:"04", name:"Oum El Bouaghi",     zone:"IV",  split:true },
  {code:"05", name:"Batna",              zone:"III", split:true },
  {code:"06", name:"Béjaïa",            zone:"VI",  split:true },
  {code:"07", name:"Biskra",             zone:"III", split:true },
  {code:"08", name:"Béchar",            zone:"I",   split:false},
  {code:"09", name:"Blida",              zone:"VI",  split:false},
  {code:"10", name:"Bouira",             zone:"V",   split:true },
  {code:"11", name:"Tamanrasset",        zone:"0",   split:false},
  {code:"12", name:"Tébessa",           zone:"III", split:true },
  {code:"13", name:"Tlemcen",            zone:"IV",  split:true },
  {code:"14", name:"Tiaret",             zone:"III", split:true },
  {code:"15", name:"Tizi Ouzou",         zone:"V",   split:true },
  {code:"16", name:"Alger",              zone:"VI",  split:false},
  {code:"17", name:"Djelfa",             zone:"III", split:true },
  {code:"18", name:"Jijel",              zone:"VI",  split:true },
  {code:"19", name:"Sétif",             zone:"IV",  split:true },
  {code:"20", name:"Saïda",            zone:"I",   split:true },   // default I, group A->II
  {code:"21", name:"Skikda",             zone:"IV",  split:true },
  {code:"22", name:"Sidi Bel Abbès",   zone:"I",   split:true },   // default I (Group D)
  {code:"23", name:"Annaba",             zone:"IV",  split:false},
  {code:"24", name:"Guelma",             zone:"V",   split:false},
  {code:"25", name:"Constantine",        zone:"V",   split:false},
  {code:"26", name:"Médéa",            zone:"V",   split:true },
  {code:"27", name:"Mostaganem",         zone:"V",   split:true },
  {code:"28", name:"M'Sila",           zone:"IV",  split:true },   // default IV (Group A = all other)
  {code:"29", name:"Mascara",            zone:"VI",  split:true },  // default VI (Group A = all other)
  {code:"30", name:"Ouargla",            zone:"0",   split:false},
  {code:"31", name:"Oran",              zone:"VI",  split:true },   // default VI, only Tafraoui->V
  {code:"32", name:"El Bayadh",          zone:"II",  split:true },
  {code:"33", name:"Illizi",             zone:"0",   split:false},
  {code:"34", name:"Bordj Bou Arréridj",zone:"V",   split:true },
  {code:"35", name:"Boumerdès",        zone:"VI",  split:true },
  {code:"36", name:"El Tarf",            zone:"V",   split:true },
  {code:"37", name:"Tindouf",            zone:"0",   split:false},
  {code:"38", name:"Tissemsilt",         zone:"IV",  split:true },
  {code:"39", name:"El Oued",            zone:"II",  split:true },
  {code:"40", name:"Khenchela",          zone:"III", split:true },
  {code:"41", name:"Souk Ahras",         zone:"V",   split:true },
  {code:"42", name:"Tipaza",             zone:"VI",  split:false},
  {code:"43", name:"Mila",              zone:"V",   split:true },
  {code:"44", name:"Aïn Defla",        zone:"VI",  split:true },
  {code:"45", name:"Naâma",            zone:"II",  split:true },
  {code:"46", name:"Aïn Témouchent",  zone:"V",   split:true },
  {code:"47", name:"Ghardaïa",         zone:"I",   split:false},
  {code:"48", name:"Relizane",           zone:"VI",  split:true },
  {code:"49", name:"Timimoun",           zone:"0",   split:false},
  {code:"50", name:"Bordj Badji Mokhtar",zone:"0",  split:false},
  {code:"51", name:"Ouled Djellal",      zone:"II",  split:false},
  {code:"52", name:"Béni Abbès",       zone:"0",   split:false},
  {code:"53", name:"In Salah",           zone:"0",   split:false},
  {code:"54", name:"In Guezzam",         zone:"0",   split:false},
  {code:"55", name:"Touggourt",          zone:"I",   split:false},
  {code:"56", name:"Djanet",             zone:"0",   split:false},
  {code:"57", name:"El M'Ghair",       zone:"I",   split:false},
  {code:"58", name:"El Meniaa",          zone:"0",   split:false},
]

// Zone 0 — no seismic design required per RPA 2024 §3.1
const ZONE_DISPLAY_LABELS = {
  "0":"Zone 0 — Très faible (0.00g)",
  "I":"Zone I — Faible (0.07g)",
  "II":"Zone II — Faible/Moy. (0.10g)",
  "III":"Zone III — Moyenne (0.15g)",
  "IV":"Zone IV — Moy./Élevée (0.20g)",
  "V":"Zone V — Élevée (0.25g)",
  "VI":"Zone VI — Élevée (0.30g)",
}

// ─────────────────────────────────────────────────────────────────────────────
// RPA 2024 — ANNEX A — COMMUNE -> ZONE (for split wilayas)
//
// defaultZone : zone for all communes NOT specifically listed (= largest group)
// communes    : named communes with their specific zone
//
// Source: RPA 2024 DTR BC 2.48, Annex A — verified against official Excel table
// ─────────────────────────────────────────────────────────────────────────────

const WILAYA_COMMUNES = {
  "02": { // Chlef — default VI, group B -> V
    defaultZone:"VI",
    communes:[
      {name:"Beni Bouattab",zone:"V"},{name:"Taougrite",zone:"V"},
      {name:"El Marsa",zone:"V"},{name:"Dahra",zone:"V"},
      {name:"Ouled Ben Abdelkader",zone:"V"},{name:"Moussadek",zone:"V"},
      {name:"Talassa",zone:"V"},{name:"El Hadjadj",zone:"V"},
      {name:"Sidi Abderrahmane",zone:"V"},
    ]
  },
  "03": { // Laghouat — default II, group B -> I
    defaultZone:"II",
    communes:[
      {name:"Hassi Delaa",zone:"I"},
    ]
  },
  "04": { // Oum El Bouaghi — A->IV, B->III (default), C->II
    defaultZone:"III",
    communes:[
      {name:"Sigus",zone:"IV"},{name:"El Amiria",zone:"IV"},
      {name:"Ouled Gacem",zone:"IV"},{name:"Ain M'lila",zone:"IV"},
      {name:"Bir Chouhada",zone:"IV"},{name:"Souk Naamane",zone:"IV"},
      {name:"Ouled Hamla",zone:"IV"},{name:"Ksar Sbahi",zone:"IV"},
      {name:"Ain Babouche",zone:"IV"},{name:"Ain Diss",zone:"IV"},
      {name:"Oued Nini",zone:"II"},{name:"Dhalaa",zone:"II"},
      {name:"El Djazia",zone:"II"},{name:"Meskiana",zone:"II"},
      {name:"El Belala",zone:"II"},
    ]
  },
  "05": { // Batna — default III, group B -> II
    defaultZone:"III",
    communes:[
      {name:"Abdelkader Azil",zone:"II"},{name:"M'Doukel",zone:"II"},
      {name:"Bitam",zone:"II"},{name:"Arris",zone:"II"},
      {name:"Inoughissen",zone:"II"},{name:"Ichemoul",zone:"II"},
      {name:"Foum Toub",zone:"II"},{name:"Ouled Fadel",zone:"II"},
    ]
  },
  "06": { // Béjaïa — default VI, group B -> V
    defaultZone:"VI",
    communes:[
      {name:"Toudja",zone:"V"},{name:"Adekar",zone:"V"},
      {name:"Taourirt Ighil",zone:"V"},{name:"El Kseur",zone:"V"},
      {name:"Fenaia Ilmaten",zone:"V"},{name:"Thinabdher",zone:"V"},
      {name:"Tifra",zone:"V"},{name:"Akfadou",zone:"V"},
      {name:"Chemini",zone:"V"},{name:"Tibane",zone:"V"},
      {name:"Souk Oufella",zone:"V"},{name:"Ouzellaguen",zone:"V"},
      {name:"Boudjellil",zone:"V"},{name:"Ighil Ali",zone:"V"},
      {name:"Beni Ksila",zone:"V"},
    ]
  },
  "07": { // Biskra — A->III (named), default II
    defaultZone:"II",
    communes:[
      {name:"M'Ziraa",zone:"III"},{name:"Zeribet El Oued",zone:"III"},
      {name:"Khenguet Sidi Nadji",zone:"III"},{name:"Ain Zaatout",zone:"III"},
      {name:"Branis",zone:"III"},{name:"Chetma",zone:"III"},
      {name:"Djemorah",zone:"III"},{name:"El Kantara",zone:"III"},
      {name:"El Outaya",zone:"III"},{name:"M'Chouneche",zone:"III"},
    ]
  },
  "10": { // Bouira — default V, group B -> IV
    defaultZone:"V",
    communes:[
      {name:"Taguedit",zone:"IV"},{name:"Mezdour",zone:"IV"},
      {name:"Hadjera Zergua",zone:"IV"},{name:"Dirah",zone:"IV"},
      {name:"Mamora",zone:"IV"},{name:"Ridane",zone:"IV"},
      {name:"Bordj Oukhris",zone:"IV"},{name:"El Hakimia",zone:"IV"},
    ]
  },
  "12": { // Tébessa — A->III (named), default II
    defaultZone:"II",
    communes:[
      {name:"Bir El Ater",zone:"III"},{name:"Ferkane",zone:"III"},
      {name:"Negrine",zone:"III"},{name:"Stah Guentis",zone:"III"},
      {name:"Tlidjene",zone:"III"},{name:"El Meridj",zone:"III"},
      {name:"Ouenza",zone:"III"},{name:"El Aouinet",zone:"III"},
      {name:"Boukhadra",zone:"III"},
    ]
  },
  "13": { // Tlemcen — A->IV (default), B->III, C->II
    defaultZone:"IV",
    communes:[
      {name:"Tlemcen",zone:"III"},{name:"Mansourah",zone:"III"},
      {name:"Ain Fezza",zone:"III"},{name:"Ain Ghoraba",zone:"III"},
      {name:"Terny Beni Hediel",zone:"III"},{name:"Sabra",zone:"III"},
      {name:"Bouhlou",zone:"III"},{name:"Beni Mester",zone:"III"},
      {name:"Ain Nahala",zone:"III"},{name:"Sidi Abdelli",zone:"III"},
      {name:"Hennaya",zone:"III"},{name:"Chetouane",zone:"III"},
      {name:"Amieur",zone:"III"},{name:"Sidi Medjahed",zone:"III"},
      {name:"Beni Bahdel",zone:"III"},{name:"Azails",zone:"III"},
      {name:"Beni Boussaid",zone:"III"},{name:"Beni Snous",zone:"III"},
      {name:"Ain Tallout",zone:"II"},{name:"Beni Semiel",zone:"II"},
      {name:"Oued Lakhdar",zone:"II"},{name:"Sebdou",zone:"II"},
      {name:"Sidi Djillali",zone:"II"},{name:"El Bouihi",zone:"II"},
      {name:"El Gor",zone:"II"},{name:"El Aricha",zone:"II"},
      {name:"Ouled Mimoun",zone:"II"},
    ]
  },
  "14": { // Tiaret — A->III (named), B->II (named), C->I (default all other)
    defaultZone:"I",
    communes:[
      {name:"Sebt",zone:"III"},{name:"Tidda",zone:"III"},
      {name:"Sidi Ali Mellal",zone:"III"},{name:"Rahouia",zone:"III"},
      {name:"Meghila",zone:"III"},
      {name:"Ain Zarit",zone:"II"},{name:"Ain Bouchekif",zone:"II"},
      {name:"Ain El Hadid",zone:"II"},{name:"Bougara",zone:"II"},
      {name:"Dahmouni",zone:"II"},{name:"Frenda",zone:"II"},
      {name:"Hamadia",zone:"II"},{name:"Mahdia",zone:"II"},
      {name:"Mechraa Safa",zone:"II"},{name:"Medroussa",zone:"II"},
      {name:"Mellakou",zone:"II"},{name:"Sebaine",zone:"II"},
      {name:"Sidi Bakhti",zone:"II"},{name:"Tagdemt",zone:"II"},
      {name:"Takhemaret",zone:"II"},{name:"Tiaret",zone:"II"},
      {name:"Rechaiga",zone:"II"},{name:"Si Abdelghani",zone:"II"},
      {name:"Nadourah",zone:"II"},{name:"Sidi Hosni",zone:"II"},
      {name:"Djillali Ben Amar",zone:"II"},{name:"Oued Lilli",zone:"II"},
      {name:"Guertoufa",zone:"II"},
    ]
  },
  "15": { // Tizi Ouzou — A->V (named), default IV
    defaultZone:"IV",
    communes:[
      {name:"Illilten",zone:"V"},{name:"Iloula Oumalou",zone:"V"},
      {name:"Iferhounene",zone:"V"},{name:"Imsouhal",zone:"V"},
      {name:"Bouzguen",zone:"V"},{name:"Beni Ziki",zone:"V"},
      {name:"Idjer",zone:"V"},{name:"Abi Youcef",zone:"V"},
      {name:"Akbil",zone:"V"},{name:"Yatafene",zone:"V"},
      {name:"Iboudraren",zone:"V"},{name:"Ouacif",zone:"V"},
      {name:"Ait Boumahdi",zone:"V"},{name:"Boghni",zone:"V"},
      {name:"Bounouh",zone:"V"},{name:"Frikat",zone:"V"},
      {name:"Draa El Mizan",zone:"V"},{name:"Tizi Ghenif",zone:"V"},
      {name:"Mkira",zone:"V"},{name:"Ait Yahia",zone:"V"},
      {name:"Ifigha",zone:"V"},{name:"Souamaa",zone:"V"},
      {name:"Tadmait",zone:"V"},{name:"Ain El Hammam",zone:"V"},
      {name:"Beni Yenni",zone:"V"},{name:"Ait Toudert",zone:"V"},
      {name:"Agouni Gueghrane",zone:"V"},{name:"Ouadhia",zone:"V"},
      {name:"Ait Bouadou",zone:"V"},{name:"Tizi N'Tleta",zone:"V"},
      {name:"Assi Youcef",zone:"V"},{name:"Ait Yahia Moussa",zone:"V"},
      {name:"Ain Zaouia",zone:"V"},{name:"Mechtras",zone:"V"},
    ]
  },
  "17": { // Djelfa — A->III (named), B->II (default), C->I
    defaultZone:"II",
    communes:[
      {name:"Birin",zone:"III"},{name:"Ain Feka",zone:"III"},
      {name:"Guettara",zone:"I"},{name:"Oum Laadham",zone:"I"},
      {name:"Seid Rahal",zone:"I"},
    ]
  },
  "18": { // Jijel — A->VI (named), B->V (default), C->IV
    defaultZone:"V",
    communes:[
      {name:"El Taguene",zone:"VI"},{name:"El Aouana",zone:"VI"},
      {name:"Ziama Mansouriah",zone:"VI"},{name:"Selma Ben Ziada",zone:"VI"},
      {name:"Jijel",zone:"VI"},{name:"Kaous",zone:"VI"},
      {name:"Djemaa Beni Habibi",zone:"IV"},{name:"El Ancer",zone:"IV"},
      {name:"El Milia",zone:"IV"},{name:"Kheiri Oued Adjoul",zone:"IV"},
      {name:"Sidi Abdelaziz",zone:"IV"},
    ]
  },
  "19": { // Sétif — A->VI (named), B->V (named), C->IV (default)
    defaultZone:"IV",
    communes:[
      {name:"Babor",zone:"VI"},{name:"Oued El Bared",zone:"VI"},
      {name:"Tizi N'Bechar",zone:"VI"},{name:"Tala Ifacene",zone:"VI"},
      {name:"Ait Tizi",zone:"VI"},{name:"Ait Nawal M'zada",zone:"VI"},
      {name:"Bousselam",zone:"VI"},{name:"Beni Mouhli",zone:"VI"},
      {name:"Beni Chebana",zone:"VI"},{name:"Beni Ouartilane",zone:"VI"},
      {name:"Bouandas",zone:"VI"},
      {name:"Ain Sebt",zone:"V"},{name:"Beni Aziz",zone:"V"},
      {name:"Serdj El Ghoul",zone:"V"},{name:"Ain Abessa",zone:"V"},
      {name:"Ain El Kebira",zone:"V"},{name:"Amoucha",zone:"V"},
      {name:"Ain Roua",zone:"V"},{name:"El Ouricia",zone:"V"},
      {name:"Beni Fouda",zone:"V"},{name:"Maaouia",zone:"V"},
      {name:"Ouled Addouane",zone:"V"},{name:"Dehamcha",zone:"V"},
      {name:"Djemila",zone:"V"},{name:"Maoklane",zone:"V"},
      {name:"Ain Legradj",zone:"V"},{name:"Guenzet",zone:"V"},
      {name:"Harbil",zone:"V"},{name:"Hammam Guergour",zone:"V"},
      {name:"Bougaa",zone:"V"},{name:"Draa Kebila",zone:"V"},
    ]
  },
  "20": { // Saïda — A->II (named), B->I (default)
    defaultZone:"I",
    communes:[
      {name:"Saida",zone:"II"},{name:"Ain Soltane",zone:"II"},
      {name:"Doui Thabet",zone:"II"},{name:"Ouled Brahim",zone:"II"},
      {name:"Ouled Khaled",zone:"II"},{name:"Youb",zone:"II"},
      {name:"Hounet",zone:"II"},{name:"Sidi Boubekeur",zone:"II"},
      {name:"Sidi Amar",zone:"II"},
    ]
  },
  "21": { // Skikda — A->V (named), B->IV (default)
    defaultZone:"IV",
    communes:[
      {name:"Ain Bouziane",zone:"V"},{name:"Beni Oulbane",zone:"V"},
      {name:"El Ghedir",zone:"V"},{name:"El Harrouch",zone:"V"},
      {name:"Emdjez Edchich",zone:"V"},{name:"Es Sebt",zone:"V"},
      {name:"Ouled Hbaba",zone:"V"},{name:"Oum Toub",zone:"V"},
      {name:"Salah Bouchaour",zone:"V"},{name:"Sidi Mezghiche",zone:"V"},
      {name:"Zerdaza",zone:"V"},{name:"Ain Charchar",zone:"V"},
      {name:"Bekkouche Lakhdar",zone:"V"},{name:"Azzaba",zone:"V"},
      {name:"Ramdane Djamel",zone:"V"},
    ]
  },
  "22": { // Sidi Bel Abbès — A->IV, B->III, C->II, D->I (default)
    defaultZone:"I",
    communes:[
      {name:"Ain Adden",zone:"IV"},{name:"Ain El Berd",zone:"IV"},
      {name:"Ain Thrid",zone:"IV"},{name:"Boudjebaa El Bordj",zone:"IV"},
      {name:"Makedra",zone:"IV"},{name:"Sehala Thaoura",zone:"IV"},
      {name:"Sfisef",zone:"IV"},{name:"Sidi Daho De Zairs",zone:"IV"},
      {name:"Sidi Hamadouche",zone:"IV"},{name:"Tessala",zone:"IV"},
      {name:"Sidi Bel Abbes",zone:"III"},{name:"Ain Kada",zone:"III"},
      {name:"Hassi Zahana",zone:"III"},{name:"Lamtar",zone:"III"},
      {name:"M'Cid",zone:"III"},{name:"Mostefa Ben Brahim",zone:"III"},
      {name:"Sidi Ali Boussidi",zone:"III"},{name:"Sidi Brahim",zone:"III"},
      {name:"Sidi Khaled",zone:"III"},{name:"Sidi Lahcene",zone:"III"},
      {name:"Sidi Yacoub",zone:"III"},{name:"Tilmouni",zone:"III"},
      {name:"Zerouala",zone:"III"},
      {name:"Ain Tindamine",zone:"II"},{name:"Benachiba Chelia",zone:"II"},
      {name:"Chettouane Belaila",zone:"II"},{name:"El Hacaiba",zone:"II"},
      {name:"Merine",zone:"II"},{name:"Mezaourou",zone:"II"},
      {name:"Moulay Slissen",zone:"II"},{name:"Sidi Ali Benyoub",zone:"II"},
      {name:"Teghalimet",zone:"II"},{name:"Telagh",zone:"II"},
      {name:"Tabia",zone:"II"},{name:"Belarbi",zone:"II"},
      {name:"Boukhanafis",zone:"II"},{name:"Oued Sefioun",zone:"II"},
      {name:"Amarnas",zone:"II"},{name:"Hassi Dahou",zone:"II"},
      {name:"Tenira",zone:"II"},{name:"Ben Badis",zone:"II"},
      {name:"Badredine El Mokrani",zone:"II"},
    ]
  },
  "26": { // Médéa — A->V (default), B->IV, C->III, D->II
    defaultZone:"V",
    communes:[
      {name:"Ouled Hellal",zone:"IV"},{name:"Ouled Antar",zone:"IV"},
      {name:"Boghar",zone:"IV"},{name:"Moudjbar",zone:"IV"},
      {name:"Seghouane",zone:"IV"},{name:"Ain Ouksir",zone:"IV"},
      {name:"Chelalat El Adhoura",zone:"IV"},{name:"Tafraout",zone:"IV"},
      {name:"Sidi Ziane",zone:"IV"},{name:"Rebaia",zone:"IV"},
      {name:"Kef Lakhdar",zone:"IV"},{name:"Tlatet Eddouair",zone:"IV"},
      {name:"Cheniguel",zone:"IV"},
      {name:"Aziz",zone:"III"},{name:"Derrag",zone:"III"},
      {name:"Oum El Djalil",zone:"III"},{name:"Ksar El Boukhari",zone:"III"},
      {name:"Saneg",zone:"III"},{name:"Mefatha",zone:"III"},
      {name:"Ain Boucif",zone:"III"},{name:"Sidi Damed",zone:"III"},
      {name:"El Aouinet",zone:"III"},{name:"Ouled Maaref",zone:"III"},
      {name:"Chahbounia",zone:"II"},{name:"Bouaiche",zone:"II"},
      {name:"Boughezoul",zone:"II"},
    ]
  },
  "27": { // Mostaganem — A->VI (named), B->V (default)
    defaultZone:"V",
    communes:[
      {name:"Bouguirat",zone:"VI"},{name:"Oued El Kheir",zone:"VI"},
      {name:"Ouled Maaleh",zone:"VI"},{name:"Safsaf",zone:"VI"},
      {name:"Sidi Ali",zone:"VI"},{name:"Souaflia",zone:"VI"},
      {name:"Sour",zone:"VI"},
    ]
  },
  "28": { // M'Sila — A->IV (default all other), B->III, C->II
    defaultZone:"IV",
    communes:[
      {name:"Ain Khadra",zone:"III"},{name:"Benzouh",zone:"III"},
      {name:"Berhoum",zone:"III"},{name:"Chellal",zone:"III"},
      {name:"Dehahna",zone:"III"},{name:"Magra",zone:"III"},
      {name:"Ouled Addi Guebala",zone:"III"},{name:"Ouled Derradj",zone:"III"},
      {name:"Ouled Madhi",zone:"III"},{name:"Souamaa",zone:"III"},
      {name:"Belaiba",zone:"III"},{name:"Khoubana",zone:"III"},
      {name:"M'Cif",zone:"III"},{name:"Maarif",zone:"III"},
      {name:"Ouled Sidi Brahim",zone:"III"},{name:"Sidi Ameur",zone:"III"},
      {name:"Bou Saada",zone:"II"},{name:"El Houamed",zone:"II"},
      {name:"Tamsa",zone:"II"},{name:"Slim",zone:"II"},
      {name:"Bir Fodda",zone:"II"},{name:"Sidi M'hamed",zone:"II"},
      {name:"Ain Fares",zone:"II"},{name:"Mohamed Boudiaf",zone:"II"},
      {name:"Ain El Melh",zone:"II"},{name:"Ouled Slimane",zone:"II"},
      {name:"Zerzour",zone:"II"},{name:"Ben Srour",zone:"II"},
      {name:"Djebel Messaad",zone:"II"},{name:"El Hamel",zone:"II"},
      {name:"Medjedel",zone:"II"},{name:"Ouled Atia",zone:"II"},
      {name:"Oultem",zone:"II"},{name:"Ain Errich",zone:"II"},
    ]
  },
  "29": { // Mascara — A->VI (default), B->V, C->IV, D->III
    defaultZone:"VI",
    communes:[
      {name:"Sidi Kada",zone:"V"},{name:"Sidi Boussaid",zone:"V"},
      {name:"Sidi Abdeldjebar",zone:"V"},{name:"Bouhanifia",zone:"V"},
      {name:"El Gaada",zone:"V"},{name:"Zahana",zone:"V"},
      {name:"Chorfa",zone:"V"},{name:"Froha",zone:"V"},
      {name:"Matemor",zone:"V"},{name:"Tizi",zone:"V"},
      {name:"Oued El Abtal",zone:"IV"},{name:"Hachem",zone:"IV"},
      {name:"Zelmata",zone:"IV"},{name:"Guerdjoum",zone:"IV"},
      {name:"Ain Fekan",zone:"IV"},{name:"Ghriss",zone:"IV"},
      {name:"Ain Fras",zone:"IV"},{name:"Makdha",zone:"IV"},
      {name:"Nesmoth",zone:"IV"},
      {name:"Ain Ferah",zone:"III"},{name:"Gharrous",zone:"III"},
      {name:"Aouf",zone:"III"},{name:"Beniane",zone:"III"},
      {name:"Oued Taria",zone:"III"},
    ]
  },
  "31": { // Oran — default VI, only Tafraoui -> V
    defaultZone:"VI",
    communes:[
      {name:"Tafraoui",zone:"V"},
    ]
  },
  "32": { // El Bayadh — default II, group B -> I
    defaultZone:"II",
    communes:[
      {name:"Bougtob",zone:"I"},{name:"Cheguig",zone:"I"},
      {name:"El Kheiter",zone:"I"},{name:"Rogassa",zone:"I"},
    ]
  },
  "34": { // Bordj Bou Arréridj — A->V (named), default IV
    defaultZone:"IV",
    communes:[
      {name:"Tafreg",zone:"V"},{name:"Djaafra",zone:"V"},
      {name:"Tassamert",zone:"V"},{name:"Ouled Sidi Brahim",zone:"V"},
      {name:"El Main",zone:"V"},
    ]
  },
  "35": { // Boumerdès — A->VI (default), B->V, C->IV
    defaultZone:"VI",
    communes:[
      {name:"Chaabet El Ameur",zone:"V"},{name:"Leghata",zone:"V"},
      {name:"Timezrit",zone:"V"},{name:"Isser",zone:"V"},
      {name:"Bordj Menaiel",zone:"V"},{name:"Djenet",zone:"V"},
      {name:"Naciria",zone:"V"},{name:"Ouled Aissa",zone:"V"},
      {name:"Sidi Daoud",zone:"IV"},{name:"Ben Choud",zone:"IV"},
      {name:"Dellys",zone:"IV"},{name:"Afir",zone:"IV"},
      {name:"Baghlia",zone:"IV"},{name:"Taourga",zone:"IV"},
    ]
  },
  "36": { // El Tarf — A->V (named), default IV
    defaultZone:"IV",
    communes:[
      {name:"Asfour",zone:"V"},{name:"Chihani",zone:"V"},
      {name:"Hammam Beni Salah",zone:"V"},{name:"Drean",zone:"V"},
    ]
  },
  "38": { // Tissemsilt — A->IV (named), B->III (default), C->II
    defaultZone:"III",
    communes:[
      {name:"Boucard",zone:"IV"},{name:"Larbaa",zone:"IV"},
      {name:"Lazharia",zone:"IV"},{name:"Melaab",zone:"IV"},
      {name:"Khemisti",zone:"II"},{name:"Laayoune",zone:"II"},
      {name:"Tissemsilt",zone:"II"},{name:"Ammari",zone:"II"},
      {name:"Maacem",zone:"II"},
    ]
  },
  "39": { // El Oued — A->II, B->I, C->0 (default)
    defaultZone:"0",
    communes:[
      {name:"Guemar",zone:"II"},{name:"Sidi Aoun",zone:"II"},
      {name:"Magrane",zone:"II"},{name:"Hassi Khelifa",zone:"II"},
      {name:"Beni Guecha",zone:"II"},{name:"Hamraia",zone:"II"},
      {name:"El Oued",zone:"I"},{name:"Kouinine",zone:"I"},
      {name:"Ourmes",zone:"I"},{name:"Taghzout",zone:"I"},
      {name:"Bayadha",zone:"I"},{name:"Hassani Abdelkrim",zone:"I"},
      {name:"Debila",zone:"I"},{name:"Reguiba",zone:"I"},
      {name:"Trifaoui",zone:"I"},{name:"Taleb Larbi",zone:"I"},
      {name:"Nekhla",zone:"I"},{name:"Mih Ouensa",zone:"I"},
      {name:"El Ogla",zone:"I"},{name:"Robbah",zone:"I"},
      {name:"Oued Allenda",zone:"I"},
    ]
  },
  "40": { // Khenchela — default III, group B -> II
    defaultZone:"III",
    communes:[
      {name:"M'Sara",zone:"II"},{name:"Ain Touila",zone:"II"},
      {name:"Baghai",zone:"II"},{name:"Bouhmama",zone:"II"},
      {name:"Chelia",zone:"II"},{name:"El Hamma",zone:"II"},
      {name:"El Mahmal",zone:"II"},{name:"Ensigha",zone:"II"},
      {name:"Kais",zone:"II"},{name:"Khenchela",zone:"II"},
      {name:"M'Toussa",zone:"II"},{name:"Ouled Rechache",zone:"II"},
      {name:"Tamza",zone:"II"},{name:"Taouzient",zone:"II"},
      {name:"Yabous",zone:"II"},{name:"Remila",zone:"II"},
    ]
  },
  "41": { // Souk Ahras — A->V, B->IV (default), C->III
    defaultZone:"IV",
    communes:[
      {name:"Hanancha",zone:"V"},{name:"Mechroha",zone:"V"},
      {name:"Bir Bouhouche",zone:"III"},{name:"Oum El Adhaim",zone:"III"},
      {name:"Oued Kebrit",zone:"III"},{name:"Safel El Ouiden",zone:"III"},
      {name:"Terraguelt",zone:"III"},
    ]
  },
  "43": { // Mila — default V, group B -> IV
    defaultZone:"V",
    communes:[
      {name:"Tadjenanet",zone:"IV"},{name:"Ouled Khellouf",zone:"IV"},
      {name:"M'Chira",zone:"IV"},
    ]
  },
  "44": { // Ain Defla — A->VI (default), B->V, C->IV
    defaultZone:"VI",
    communes:[
      {name:"Djelida",zone:"V"},{name:"El Maine",zone:"V"},
      {name:"Zeddine",zone:"V"},{name:"Bourached",zone:"V"},
      {name:"Oued Djemaa",zone:"V"},{name:"Ain Lachiakh",zone:"V"},
      {name:"Djemaa Ouled Cheikh",zone:"V"},{name:"Birbouche",zone:"V"},
      {name:"Oued Chorfa",zone:"V"},{name:"Bordj Emir Khaled",zone:"V"},
      {name:"Ain Soltane",zone:"V"},{name:"Bir Ouled Khelifa",zone:"V"},
      {name:"Tarik Ibn Ziad",zone:"IV"},{name:"El Hassania",zone:"IV"},
      {name:"Bathia",zone:"IV"},{name:"Belaas",zone:"IV"},
    ]
  },
  "45": { // Naâma — default II, group B -> I
    defaultZone:"II",
    communes:[
      {name:"El Biod",zone:"I"},{name:"Kasdir",zone:"I"},
      {name:"Makman Ben Ammar",zone:"I"},
    ]
  },
  "46": { // Ain Témouchent — default V, group B -> IV
    defaultZone:"V",
    communes:[
      {name:"Aghlal",zone:"IV"},{name:"Aoubellil",zone:"IV"},
      {name:"Hassasna",zone:"IV"},{name:"Oued Berkeche",zone:"IV"},
    ]
  },
  "48": { // Relizane — A->VI (default), B->V, C->IV
    defaultZone:"VI",
    communes:[
      {name:"Ouled Yaich",zone:"V"},{name:"Zemmora",zone:"V"},
      {name:"Sidi M'Hamed Benaouda",zone:"V"},{name:"Dar Ben Abdellah",zone:"V"},
      {name:"Souk El Had",zone:"V"},{name:"Ammi Moussa",zone:"V"},
      {name:"Ain Tarek",zone:"IV"},{name:"El Hassi",zone:"IV"},
      {name:"Had Echkalla",zone:"IV"},{name:"Mendes",zone:"IV"},
      {name:"Oued Essalem",zone:"IV"},{name:"Ramka",zone:"IV"},
      {name:"Sidi Lazreg",zone:"IV"},
    ]
  },
}
const ZONE_A = { "I":0.07,"II":0.10,"III":0.15,"IV":0.20,"V":0.25,"VI":0.30 }
const IMPORTANCE_I = { "1A":1.4,"1B":1.2,"2":1.0,"3":0.8 }

const HORIZ_TYPE1 = {
  S1:{S:1.00,T1:0.10,T2:0.40,T3:2.0}, S2:{S:1.20,T1:0.10,T2:0.50,T3:2.0},
  S3:{S:1.30,T1:0.15,T2:0.60,T3:2.0}, S4:{S:1.35,T1:0.15,T2:0.70,T3:2.0},
}
const HORIZ_TYPE2 = {
  S1:{S:1.00,T1:0.05,T2:0.25,T3:1.2}, S2:{S:1.30,T1:0.05,T2:0.30,T3:1.2},
  S3:{S:1.55,T1:0.10,T2:0.40,T3:1.2}, S4:{S:1.80,T1:0.10,T2:0.50,T3:1.2},
}
const VERT_TYPE1 = {
  S1:{vR:0.90,T1:0.05,T2:0.20,T3:1.0,a:0.6}, S2:{vR:0.90,T1:0.05,T2:0.30,T3:1.0,a:0.6},
  S3:{vR:0.90,T1:0.05,T2:0.40,T3:1.0,a:0.6}, S4:{vR:0.90,T1:0.05,T2:0.50,T3:1.0,a:0.6},
}
const VERT_TYPE2 = {
  S1:{vR:0.55,T1:0.05,T2:0.15,T3:1.0,a:0.8}, S2:{vR:0.55,T1:0.05,T2:0.20,T3:1.0,a:0.8},
  S3:{vR:0.55,T1:0.05,T2:0.25,T3:1.0,a:0.8}, S4:{vR:0.55,T1:0.05,T2:0.30,T3:1.0,a:0.8},
}
const TYPE1_ZONES = new Set(["IV","V","VI"])

// RPA 2024 — Table 3.18 — Structural systems
// auto: function(ratio) that detects system from force ratio
const SYSTEMS = [
  {
    id:1, label:"Système 1 — Ossature",
    desc:"Ossature (portiques). Résistance à l'effort tranchant à la base : Vossature > 65% Vbase",
    R:5.5, qfCat:"a",
    detect: r => r.ossature > 0.65,
  },
  {
    id:2, label:"Système 2 — Mixte équivalent ossature",
    desc:"Mixte. L'ossature reprend 50% à 65% de l'effort tranchant à la base.",
    R:5.5, qfCat:"a",
    detect: r => r.ossature >= 0.50 && r.ossature <= 0.65,
  },
  {
    id:3, label:"Système 3 — Ossature avec remplissage rigide",
    desc:"Ossature ou mixte avec remplissage en maçonnerie rigide (≤ 10 cm).",
    R:3.5, qfCat:"a",
    detect: null, // must be selected manually — requires field inspection
  },
  {
    id:4, label:"Système 4 — Mixte équivalent voiles",
    desc:"Les voiles reprennent 50% à 65% de l'effort tranchant à la base.",
    R:4.5, qfCat:"b",
    detect: r => r.voiles >= 0.50 && r.voiles <= 0.65,
  },
  {
    id:5, label:"Système 5 — Voiles",
    desc:"Contreventement constitué par des voiles. Vvoiles > 65% Vbase.",
    R:4.5, qfCat:"b",
    detect: r => r.voiles > 0.65,
  },
  {
    id:6, label:"Système 6 — Noyau / Effet noyau",
    desc:"Système à noyau ou à effet noyau. Rayons de torsion rx, ry ≤ rayon de giration ls.",
    R:3.0, qfCat:"b",
    detect: null, // torsion check — manual
  },
]

// QF — Table 3.19
const QF_CRITERIA = {
  a:[
    {id:"a1",label:"Régularité en plan",              pq:0.05},
    {id:"a2",label:"Régularité en élévation",         pq:0.20},
    {id:"a3",label:"Conditions min. niveaux (≥ 2)",   pq:0.20},
    {id:"a4",label:"Conditions min. travées (≥ 3)",   pq:0.10},
  ],
  b:[
    {id:"b1",label:"Régularité en plan",              pq:0.05},
    {id:"b2",label:"Régularité en élévation",         pq:0.20},
    {id:"b3",label:"Redondance en plan (≥ 2 files)",  pq:0.05},
  ],
  c:[],
}
const QF_MAX = {a:1.35, b:1.30, c:1.0}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINEERING FORMULAS — MOVED TO PYTHON BACKEND  (Session 6)
// ─────────────────────────────────────────────────────────────────────────────
// sadH(), svdV(), buildH(), buildV() have been removed.
// All engineering computation now runs in the FastAPI backend.
// See: calculation_engine/seismic/rpa2024/design_spectrum.py
// Endpoint: POST http://localhost:8000/api/v1/spectrum
//
// React now only: collects inputs → sends to API → displays results.
// This enforces the Engineering Core Isolation Principle.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Robot-compatible format: two columns only — T and Sa/g, no headers, no extra text
function exportTxtH(hData, zone, site) {
  const lines = hData.pts.map(p =>
    p.T.toFixed(2).padEnd(10) + p.Sa_g.toFixed(6)
  )
  const blob = new Blob([lines.join("\n")], {type:"text/plain"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `RPA24_Sad_Zone${zone}_${site}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function exportTxtV(vData, zone, site) {
  const lines = vData.pts.map(p =>
    p.T.toFixed(2).padEnd(10) + p.Sa_g.toFixed(6)
  )
  const blob = new Blob([lines.join("\n")], {type:"text/plain"})
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `RPA24_Svd_Zone${zone}_${site}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Sel({label, value, onChange, options, c}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:12,letterSpacing:"0.06em",color:c.textSec,textTransform:"uppercase",fontWeight:600}}>{label}</label>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{
        background:c.elevated, border:`1px solid ${c.border}`,
        color:c.text, borderRadius:8, padding:"8px 10px",
        fontSize:13, cursor:"pointer", outline:"none",
      }}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

function Card({label, value, unit, accent, c}) {
  return (
    <div style={{background:c.elevated, border:`1px solid ${accent}44`,
      borderRadius:10, padding:"12px 14px", flex:1, minWidth:84}}>
      <div style={{fontSize:12,letterSpacing:"0.06em",color:c.textSec,
        textTransform:"uppercase",fontWeight:600,marginBottom:5}}>{label}</div>
      <div style={{fontSize:24,fontWeight:700,color:accent,
        fontFamily:"monospace",lineHeight:1.1}}>{value}</div>
      {unit&&<div style={{fontSize:12,color:c.textMuted,marginTop:3}}>{unit}</div>}
    </div>
  )
}

function ChartTooltip({active, payload, c}) {
  if (!active||!payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{background:c.elevated,border:`1px solid ${c.borderLight}`,
      borderRadius:8,padding:"9px 13px",fontSize:13}}>
      <div style={{color:c.textMuted,marginBottom:3}}>
        T = <b style={{color:c.text}}>{d.T.toFixed(2)} s</b>
      </div>
      <div style={{color:c.textMuted}}>
        Sa/g = <b style={{color:c.green,fontSize:15}}>{d.Sa_g.toFixed(4)}</b>
      </div>
    </div>
  )
}

function MiniChart({data, color, T1, T2, T3, floor, peak, label, eq, c}) {
  return (
    <div style={{background:c.surface, border:`1px solid ${c.border}`,
      borderRadius:12, padding:"16px 12px 10px", flex:1, minWidth:280}}>
      <div style={{fontSize:12,color:c.textSec,marginBottom:10,display:"flex",
        justifyContent:"space-between",alignItems:"center",fontWeight:500}}>
        <span>
          <b style={{color,fontWeight:700}}>{label}</b>
          &nbsp;·&nbsp;<span style={{color:c.blue}}>{eq}</span>
        </span>
        <span style={{fontFamily:"monospace",color:c.amber,fontSize:11}}>plancher={floor}</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{top:4,right:10,bottom:22,left:4}}>
          <CartesianGrid stroke={c.border} strokeDasharray="4 4"/>
          <XAxis dataKey="T" type="number" domain={[0,4]}
            ticks={[0,0.5,1,1.5,2,2.5,3,3.5,4]}
            tick={{fill:c.textSec,fontSize:11}}
            label={{value:"T (s)",position:"insideBottom",offset:-12,fill:c.textSec,fontSize:11}}/>
          <YAxis tick={{fill:c.textSec,fontSize:11}}
            label={{value:"Sa/g",angle:-90,position:"insideLeft",offset:13,fill:c.textSec,fontSize:11}}/>
          <Tooltip content={<ChartTooltip c={c}/>}/>
          <ReferenceLine x={T1} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₁",fill:c.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine x={T2} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₂",fill:c.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine x={T3} stroke={c.borderLight} strokeDasharray="4 3"
            label={{value:"T₃",fill:c.textSec,fontSize:10,position:"top"}}/>
          <ReferenceLine y={peak}  stroke={c.red+"44"}   strokeDasharray="3 3"/>
          <ReferenceLine y={floor} stroke={c.amber+"44"} strokeDasharray="3 3"/>
          <Line dataKey="Sa_g" dot={false} strokeWidth={2.5}
            stroke={color} isAnimationActive animationDuration={300}/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QF MODAL
// ─────────────────────────────────────────────────────────────────────────────

const DEF_CHECKED = {a1:true,a2:true,a3:true,a4:true,b1:true,b2:true,b3:true}

function QFModal({onClose, onValidate, initCat, initChecked, c}) {
  const [cat, setCat] = useState(initCat)
  const [chk, setChk] = useState(initChecked)
  const criteria = QF_CRITERIA[cat]

  const qf = useMemo(() => {
    if (cat==="c") return 1.0
    let t = 1.0
    criteria.forEach(cr => { if (!chk[cr.id]) t += cr.pq })
    return +Math.min(t, QF_MAX[cat]).toFixed(2)
  }, [cat, chk, criteria])

  function changeCat(c2) {
    setCat(c2)
    const r = {}
    QF_CRITERIA[c2].forEach(cr => { r[cr.id]=true })
    setChk(r)
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:14,padding:26,width:450,maxWidth:"95vw",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,
              textTransform:"uppercase",marginBottom:3}}>RPA 2024 — §3.8 — Table 3.19</div>
            <h2 style={{fontSize:17,fontWeight:700,color:c.text,margin:0}}>
              Facteur de Qualité Q<sub>F</sub>
            </h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>
              Q<sub>F</sub> = 1 + Σ P<sub>q</sub>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",
            color:c.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Category tabs */}
        <div style={{display:"flex",gap:7,marginBottom:14}}>
          {[{id:"a",l:"(a) Ossatures",s:"Syst. 1,2,3"},
            {id:"b",l:"(b) Voiles",s:"Syst. 4,5,6"},
            {id:"c",l:"(c) Spécial",s:"QF = 1.0"}].map(ct=>(
            <button key={ct.id} onClick={()=>changeCat(ct.id)} style={{
              flex:1,padding:"7px 5px",borderRadius:8,cursor:"pointer",
              border:`1px solid ${cat===ct.id?c.blue:c.border}`,
              background:cat===ct.id?c.blue+"22":c.elevated,
              color:cat===ct.id?c.blue:c.textSec,
              fontSize:12,fontWeight:cat===ct.id?700:400,textAlign:"center"}}>
              <div style={{fontWeight:600}}>{ct.l}</div>
              <div style={{fontSize:10,opacity:0.7,marginTop:1}}>{ct.s}</div>
            </button>
          ))}
        </div>

        {cat==="c" ? (
          <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,
            borderRadius:8,padding:"12px",textAlign:"center",
            color:c.green,marginBottom:14,fontSize:14}}>
            Aucune pénalité — <b>Q<sub>F</sub> = 1.0</b>
          </div>
        ) : (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:7,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              ✅ Satisfait = pas de pénalité
            </div>
            {criteria.map(cr=>(
              <div key={cr.id} onClick={()=>setChk(p=>({...p,[cr.id]:!p[cr.id]}))}
                style={{display:"flex",alignItems:"center",gap:10,
                  padding:"9px 11px",borderRadius:8,cursor:"pointer",
                  background:chk[cr.id]?c.green+"11":c.red+"11",
                  border:`1px solid ${chk[cr.id]?c.green+"44":c.red+"44"}`,
                  marginBottom:5}}>
                <div style={{width:20,height:20,borderRadius:5,flexShrink:0,
                  border:`2px solid ${chk[cr.id]?c.green:c.red}`,
                  background:chk[cr.id]?c.green:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:"white",fontWeight:700}}>
                  {chk[cr.id]?"✓":""}
                </div>
                <div style={{flex:1,fontSize:13,color:c.text}}>{cr.label}</div>
                <div style={{fontSize:13,fontFamily:"monospace",
                  color:chk[cr.id]?c.green:c.red,fontWeight:700}}>
                  {chk[cr.id]?"+0.00":`+${cr.pq.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{background:c.elevated,borderRadius:10,padding:"11px 14px",
          marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:2}}>Q<sub>F</sub> résultant</div>
            <div style={{fontSize:32,fontWeight:700,fontFamily:"monospace",
              color:qf<=1.05?c.green:qf<=1.20?c.amber:c.red}}>
              {qf.toFixed(2)}
            </div>
            <div style={{fontSize:11,color:c.textMuted,marginTop:1}}>
              Plage : 1.00 ≤ Q<sub>F</sub> ≤ {QF_MAX[cat]}
            </div>
          </div>
          <div style={{fontSize:40}}>{qf<=1.05?"✅":qf<=1.20?"⚠️":"🔴"}</div>
        </div>

        <button type="button" onClick={()=>onValidate(qf,cat,chk)} style={{
          width:"100%",padding:"11px",borderRadius:8,cursor:"pointer",
          background:c.blue,border:"none",color:"white",fontSize:14,fontWeight:700}}>
          Valider Q<sub>F</sub> = {qf.toFixed(2)}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// R MODAL
// ─────────────────────────────────────────────────────────────────────────────

function RModal({onClose, onValidate, initSystem, c}) {
  const [tab,    setTab]    = useState("manual")
  const [selSys, setSelSys] = useState(initSystem)
  const [Voss,   setVoss]   = useState("")
  const [Vvoi,   setVvoi]   = useState("")
  const [Vtot,   setVtot]   = useState("")
  const [detSys, setDetSys] = useState(null)

  // Active system — from manual selection or auto-detection
  const activeSys = tab==="manual"
    ? SYSTEMS.find(s=>s.id===selSys)
    : detSys

  function detectFromForces() {
    const vo=parseFloat(Voss), vv=parseFloat(Vvoi), vt=parseFloat(Vtot)
    if (isNaN(vt)||vt<=0) return
    const ratio = {ossature:(isNaN(vo)?0:vo)/vt, voiles:(isNaN(vv)?0:vv)/vt}
    const found = SYSTEMS.find(s=>s.detect && s.detect(ratio))
    setDetSys(found||null)
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",
      zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:c.surface,border:`1px solid ${c.border}`,
        borderRadius:14,padding:26,width:520,maxWidth:"95vw",
        maxHeight:"90vh",overflowY:"auto",
        boxShadow:"0 24px 48px rgba(0,0,0,0.4)"}}>

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",
          alignItems:"flex-start",marginBottom:18}}>
          <div>
            <div style={{fontSize:11,letterSpacing:"0.1em",color:c.blue,
              textTransform:"uppercase",marginBottom:3}}>RPA 2024 — §3.5 — Table 3.18</div>
            <h2 style={{fontSize:17,fontWeight:700,color:c.text,margin:0}}>
              Coefficient de Comportement R
            </h2>
            <div style={{fontSize:12,color:c.textMuted,marginTop:2}}>
              Identification du système de contreventement
            </div>
          </div>
          <button type="button" onClick={onClose} style={{background:"none",border:"none",
            color:c.textMuted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:7,marginBottom:16}}>
          {[{id:"manual",l:"🏗️ Sélection manuelle"},
            {id:"forces",l:"📊 Par effort tranchant"}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"9px",borderRadius:8,cursor:"pointer",
              border:`1px solid ${tab===t.id?c.blue:c.border}`,
              background:tab===t.id?c.blue+"22":c.elevated,
              color:tab===t.id?c.blue:c.textSec,
              fontSize:13,fontWeight:tab===t.id?700:400}}>
              {t.l}
            </button>
          ))}
        </div>

        {/* ── Tab: Manual selection — no Robot strip here ── */}
        {tab==="manual" && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:9,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              Choisir le système de contreventement
            </div>
            {SYSTEMS.map(sys=>(
              <div key={sys.id} onClick={()=>setSelSys(sys.id)}
                style={{display:"flex",alignItems:"flex-start",gap:11,
                  padding:"10px 12px",borderRadius:8,cursor:"pointer",marginBottom:5,
                  background:selSys===sys.id?c.blue+"15":c.elevated,
                  border:`1px solid ${selSys===sys.id?c.blue:c.border}`}}>
                <div style={{width:20,height:20,borderRadius:"50%",flexShrink:0,
                  border:`2px solid ${selSys===sys.id?c.blue:c.borderLight}`,
                  background:selSys===sys.id?c.blue:"transparent",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,color:"white",fontWeight:700,marginTop:1}}>
                  {selSys===sys.id?"●":""}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:c.text,marginBottom:2}}>
                    {sys.label}
                    <span style={{marginLeft:8,fontSize:11,
                      color:sys.qfCat==="a"?c.blue:c.purple,
                      background:(sys.qfCat==="a"?c.blue:c.purple)+"22",
                      borderRadius:4,padding:"1px 5px"}}>
                      Cat. ({sys.qfCat})
                    </span>
                  </div>
                  <div style={{fontSize:11,color:c.textMuted,lineHeight:1.5}}>{sys.desc}</div>
                </div>
                <div style={{fontSize:18,fontWeight:700,color:c.amber,
                  fontFamily:"monospace",flexShrink:0}}>
                  R={sys.R}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Force entry — Robot strip here only ── */}
        {tab==="forces" && (
          <div style={{marginBottom:16}}>
            {/* Robot strip — only in this tab */}
            <div style={{background:c.elevated,border:`1px solid ${c.border}`,
              borderRadius:8,padding:"9px 13px",marginBottom:14,
              display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",
                background:c.borderLight,flexShrink:0}}/>
              <span style={{fontSize:12,color:c.textMuted,flex:1}}>
                Robot non connecté — import automatique indisponible
              </span>
              <button style={{padding:"5px 11px",borderRadius:6,cursor:"not-allowed",
                background:c.border,border:"none",color:c.textMuted,fontSize:11}}>
                Connecter
              </button>
            </div>

            <div style={{fontSize:11,color:c.textMuted,marginBottom:10,
              textTransform:"uppercase",letterSpacing:"0.07em"}}>
              Saisir les efforts tranchants à la base
            </div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[
                {label:"V ossature (kN)", val:Voss,set:setVoss},
                {label:"V voiles (kN)",   val:Vvoi,set:setVvoi},
                {label:"V total à la base (kN)",val:Vtot,set:setVtot},
              ].map(f=>(
                <div key={f.label} style={{flex:1}}>
                  <div style={{fontSize:11,color:c.textMuted,marginBottom:4}}>{f.label}</div>
                  <input type="number" min={0} value={f.val}
                    onChange={e=>f.set(e.target.value)}
                    style={{width:"100%",background:c.elevated,border:`1px solid ${c.border}`,
                      borderRadius:7,padding:"8px 10px",color:c.text,
                      fontSize:15,fontFamily:"monospace",outline:"none"}}/>
                </div>
              ))}
            </div>

            {Vtot && parseFloat(Vtot)>0 && (
              <div style={{background:c.elevated,borderRadius:8,padding:"10px 13px",
                marginBottom:12,fontSize:12,color:c.textMuted}}>
                {Voss&&<div>V<sub>ossature</sub>/V<sub>total</sub> = <b style={{color:c.text,fontFamily:"monospace"}}>
                  {((parseFloat(Voss)||0)/parseFloat(Vtot)*100).toFixed(1)}%
                </b></div>}
                {Vvoi&&<div>V<sub>voiles</sub>/V<sub>total</sub> = <b style={{color:c.text,fontFamily:"monospace"}}>
                  {((parseFloat(Vvoi)||0)/parseFloat(Vtot)*100).toFixed(1)}%
                </b></div>}
              </div>
            )}

            <button type="button" onClick={detectFromForces} style={{
              width:"100%",padding:"9px",borderRadius:8,cursor:"pointer",
              background:c.blue,border:"none",color:"white",
              fontSize:13,fontWeight:700,marginBottom:10}}>
              Détecter le système automatiquement
            </button>

            {detSys ? (
              <div style={{background:c.green+"11",border:`1px solid ${c.green}44`,
                borderRadius:8,padding:"11px 13px"}}>
                <div style={{fontSize:12,color:c.green,marginBottom:3}}>✅ Système identifié</div>
                <div style={{fontSize:14,fontWeight:700,color:c.text}}>{detSys.label}</div>
                <div style={{fontSize:11,color:c.textMuted,marginTop:2}}>{detSys.desc}</div>
              </div>
            ) : (Voss||Vvoi||Vtot) ? (
              <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,
                borderRadius:8,padding:"10px 13px",fontSize:12,color:c.amber}}>
                ⚠️ Système 3 ou 6 — sélection manuelle requise
              </div>
            ) : null}
          </div>
        )}

        {/* R summary — table value only, no adjustment */}
        {activeSys && (
          <div style={{background:c.elevated,border:`1px solid ${c.amber}44`,
            borderRadius:10,padding:"14px 16px",marginBottom:16,
            display:"flex",alignItems:"center",gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:c.textMuted,marginBottom:2}}>
                Valeur R — {activeSys.label}
              </div>
              <div style={{fontSize:11,color:c.textMuted}}>
                Cat. Q<sub>F</sub> :&nbsp;
                <b style={{color:activeSys.qfCat==="a"?c.blue:c.purple}}>
                  ({activeSys.qfCat})
                </b>
              </div>
            </div>
            <div style={{fontSize:42,fontWeight:700,fontFamily:"monospace",color:c.amber}}>
              {activeSys.R}
            </div>
          </div>
        )}

        <button
          onClick={()=>onValidate(activeSys?.R, activeSys)}
          disabled={!activeSys}
          style={{width:"100%",padding:"11px",borderRadius:8,
            cursor:activeSys?"pointer":"not-allowed",
            background:activeSys?c.blue:c.border,
            border:"none",color:"white",fontSize:14,fontWeight:700}}>
          {activeSys ? `Valider R = ${activeSys.R}` : "Sélectionner un système d'abord"}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpectrumChart({ c, isDark }) {
  // ── UI state — unchanged from previous sessions ──────────────────────────
  const [wilayaCode, setWilayaCode] = useState("09")   // Blida -> Zone VI default
  const [commune,    setCommune]    = useState("")      // "" = use defaultZone
  const [site,       setSite]       = useState("S2")
  const [group,      setGroup]      = useState("2")
  const [QF,         setQF]         = useState(1.0)
  const [R,          setR]          = useState(4.5)
  const [selSys,     setSelSys]     = useState(1)
  const [qfCat,      setQfCat]      = useState("a")
  const [qfChk,      setQfChk]      = useState(DEF_CHECKED)
  const [showQ,      setShowQ]      = useState(false)
  const [showR,      setShowR]      = useState(false)

  // ── API state — NEW in Session 6 ─────────────────────────────────────────
  // Replaces the useMemo(buildH / buildV) pattern.
  // The Python backend now owns all engineering computation.
  const [specData, setSpecData] = useState(null)    // full API response
  const [loading,  setLoading]  = useState(false)   // fetch in progress
  const [apiErr,   setApiErr]   = useState(null)    // error message string

  // ── Zone derivation — unchanged ───────────────────────────────────────────
  const wilaya       = WILAYAS.find(w => w.code === wilayaCode) || WILAYAS[8]
  const communeData  = WILAYA_COMMUNES[wilayaCode]
  const hasCommunes  = !!communeData

  function deriveZone() {
    if (!commune || !communeData) return wilaya.zone
    const found = communeData.communes.find(c => c.name === commune)
    return found ? found.zone : communeData.defaultZone
  }
  const zone       = deriveZone()
  const isZone0    = zone === "0"

  // Zone 0: no seismic design required — but we still display the spectrum
  // using Zone I parameters (minimum), matching the previous JS behaviour.
  const effectiveZone = isZone0 ? "I" : zone

  function handleWilayaChange(code) {
    setWilayaCode(code)
    setCommune("")
  }

  // ── Fetch spectrum from FastAPI backend ───────────────────────────────────
  // Runs whenever any seismic parameter changes.
  // AbortController cancels the previous request when parameters change quickly,
  // preventing stale data from overwriting fresher results.
  useEffect(() => {
    const controller = new AbortController()

    async function fetchSpectrum() {
      setLoading(true)
      setApiErr(null)
      try {
        const res = await fetch("http://localhost:8000/api/v1/spectrum", {
          method : "POST",
          headers: { "Content-Type": "application/json" },
          body   : JSON.stringify({
            zone:             effectiveZone,
            site_class:       site,
            importance_group: group,
            QF,
            R,
            T_step: 0.01,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }))
          throw new Error(err.detail || `Erreur serveur ${res.status}`)
        }

        const data = await res.json()

        // Map API response fields to the shape expected by chart components.
        // API returns: data.horizontal.points = [{T, Sa_g}, ...]
        // Charts need: hData.pts             = [{T, Sa_g}, ...]   ← same structure ✓
        setSpecData({
          hData: {
            A:     data.A,
            I:     data.I,
            S:     data.S,
            T1:    data.horizontal.T1,
            T2:    data.horizontal.T2,
            T3:    data.horizontal.T3,
            peak:  data.horizontal.peak,
            floor: data.horizontal.floor,
            pts:   data.horizontal.points,
          },
          vData: {
            Av:    data.Av,
            I:     data.I,
            T1:    data.vertical.T1,
            T2:    data.vertical.T2,
            T3:    data.vertical.T3,
            peak:  data.vertical.peak,
            floor: data.vertical.floor,
            pts:   data.vertical.points,
          },
          spectrum_type: data.spectrum_type,
        })
      } catch (err) {
        if (err.name !== "AbortError") {
          // Friendly message for the common case: backend not started
          const msg = err.message.toLowerCase()
          const isNetErr = msg.includes("failed to fetch") || msg.includes("network")
          setApiErr(isNetErr
            ? "Backend non démarré — lancez : uvicorn backend.main:app --reload --port 8000"
            : err.message
          )
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSpectrum()
    return () => controller.abort()   // cleanup: cancel in-flight request
  }, [effectiveZone, site, group, QF, R])

  // ── Derive display values with safe fallbacks ─────────────────────────────
  // Before the first API response: cards show "—", charts show empty axes.
  // After API responds: full data populates all UI elements.
  const EMPTY_H = { A:"—", I:"—", S:"—", T1:"—", T2:"—", T3:"—", peak:0, floor:0, pts:[] }
  const EMPTY_V = { T1:"—", T2:"—", T3:"—", peak:0, floor:0, pts:[] }

  const hData = specData?.hData ?? EMPTY_H
  const vData = specData?.vData ?? EMPTY_V
  // isT1: use API value when available; TYPE1_ZONES used only as pre-fetch fallback
  const isT1  = specData ? specData.spectrum_type === "Type 1" : TYPE1_ZONES.has(zone)


  return (
    <div style={{background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",
      padding:"22px 20px",transition:"background 0.2s,color 0.2s"}}>

      {showQ && <QFModal c={c} initCat={qfCat} initChecked={qfChk}
        onClose={()=>setShowQ(false)}
        onValidate={(qf,cat,chk)=>{setQF(qf);setQfCat(cat);setQfChk(chk);setShowQ(false)}}/>}

      {showR && <RModal c={c} initSystem={selSys}
        onClose={()=>setShowR(false)}
        onValidate={(r,sys)=>{
          setR(r)
          if(sys){setSelSys(sys.id); setQfCat(sys.qfCat)}
          setShowR(false)
        }}/>}

      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:5,fontWeight:600}}>
          RPA 2024 — DTR BC 2.48 — §3.3.3
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>
          Spectre de Réponse de Calcul
        </h1>
        <div style={{color:c.textSec,fontSize:13,marginTop:3}}>
          Composantes horizontale (Éq. 3.15) et verticale (Éq. 3.16)
        </div>
      </div>

      <div style={{display:"flex",gap:18,flexWrap:"wrap"}}>

        {/* ── Input panel ── */}
        <div style={{background:c.surface,border:`1px solid ${c.border}`,
          borderRadius:14,padding:18,width:215,flexShrink:0,
          display:"flex",flexDirection:"column",gap:14}}>

          <div style={{fontSize:12,letterSpacing:"0.08em",fontWeight:700,
            color:c.blue,textTransform:"uppercase"}}>Paramètres</div>

          {/* Wilaya selector */}
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            <label style={{fontSize:12,letterSpacing:"0.06em",color:c.textSec,
              textTransform:"uppercase",fontWeight:600}}>Wilaya</label>
            <select value={wilayaCode} onChange={e=>handleWilayaChange(e.target.value)}
              style={{background:c.elevated,border:`1px solid ${c.border}`,
                color:c.text,borderRadius:8,padding:"8px 10px",
                fontSize:13,cursor:"pointer",outline:"none"}}>
              {WILAYAS.map(w=>(
                <option key={w.code} value={w.code}>
                  {w.code} — {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Commune selector — shown only for split wilayas with known data */}
          {wilaya.split && (
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:12,letterSpacing:"0.06em",color:c.textSec,
                textTransform:"uppercase",fontWeight:600}}>Commune</label>

              {hasCommunes ? (
                <select value={commune} onChange={e=>setCommune(e.target.value)}
                  style={{background:c.elevated,border:`1px solid ${c.amber}66`,
                    color:c.text,borderRadius:8,padding:"8px 10px",
                    fontSize:13,cursor:"pointer",outline:"none"}}>
                  <option value="">
                    — Autre commune (Zone {communeData.defaultZone})
                  </option>
                  {/* Sort communes by zone then name for readability */}
                  {[...communeData.communes]
                    .sort((a,b)=>a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name))
                    .map(cm=>(
                      <option key={cm.name} value={cm.name}>
                        {cm.name} -> Zone {cm.zone}
                      </option>
                    ))
                  }
                </select>
              ) : (
                <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,
                  borderRadius:8,padding:"8px 10px",fontSize:11,color:c.amber,
                  lineHeight:1.5}}>
                  ⚠️ Wilaya partagée — consulter l'Annexe A du RPA 2024 pour votre commune
                </div>
              )}
            </div>
          )}

          {/* Zone display — read only, derived from wilaya + commune */}
          <div style={{
            background: isZone0 ? c.amber+"18" : c.blue+"18",
            border:`1px solid ${isZone0?c.amber:c.blue}55`,
            borderRadius:8, padding:"9px 11px",
          }}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:3,
              textTransform:"uppercase",letterSpacing:"0.06em"}}>
              Zone sismique — Annexe A
            </div>
            <div style={{fontSize:15,fontWeight:700,
              color:isZone0?c.amber:c.blue}}>
              {ZONE_DISPLAY_LABELS[zone]}
            </div>
            {commune && (
              <div style={{fontSize:11,color:c.textSec,marginTop:3}}>
                Commune : <b>{commune}</b>
              </div>
            )}
            {wilaya.split && !commune && !isZone0 && (
              <div style={{fontSize:11,color:c.amber,marginTop:4,lineHeight:1.4}}>
                ⚠️ Zone dominante — préciser la commune
              </div>
            )}
          </div>

          <Sel label="Classe de site" value={site} onChange={setSite} c={c} options={[
            {v:"S1",l:"S1 — Rocher"},{v:"S2",l:"S2 — Ferme"},
            {v:"S3",l:"S3 — Meuble"},{v:"S4",l:"S4 — Très meuble"},
          ]}/>
          <Sel label="Groupe d'importance" value={group} onChange={setGroup} c={c} options={[
            {v:"1A",l:"Groupe 1A — I=1.4"},{v:"1B",l:"Groupe 1B — I=1.2"},
            {v:"2",l:"Groupe 2 — I=1.0"},{v:"3",l:"Groupe 3 — I=0.8"},
          ]}/>

          {/* QF button */}
          <div>
            <div style={{fontSize:12,letterSpacing:"0.06em",color:c.textSec,
              textTransform:"uppercase",fontWeight:600,marginBottom:6}}>
              Facteur qualité Q<sub>F</sub>
            </div>
            <button type="button" onClick={()=>setShowQ(true)} style={{
              width:"100%",display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"9px 11px",borderRadius:8,
              cursor:"pointer",background:c.elevated,
              border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
              <span>Q<sub>F</sub> = <b style={{color:c.amber}}>{QF.toFixed(2)}</b></span>
              <span style={{fontSize:12,color:c.blue}}>Calculer -></span>
            </button>
          </div>

          {/* R button */}
          <div>
            <div style={{fontSize:12,letterSpacing:"0.06em",color:c.textSec,
              textTransform:"uppercase",fontWeight:600,marginBottom:6}}>
              Coeff. comportement R
            </div>
            <button type="button" onClick={()=>setShowR(true)} style={{
              width:"100%",display:"flex",alignItems:"center",
              justifyContent:"space-between",padding:"9px 11px",borderRadius:8,
              cursor:"pointer",background:c.elevated,
              border:`1px solid ${c.border}`,color:c.text,fontSize:13}}>
              <span>R = <b style={{color:c.red}}>{R}</b></span>
              <span style={{fontSize:12,color:c.blue}}>Identifier -></span>
            </button>
            <div style={{fontSize:12,color:c.textSec,marginTop:5,paddingLeft:2}}>
              Syst. {selSys} · Cat. Q<sub>F</sub> ({qfCat})
            </div>
          </div>

          {/* Spectrum type badge */}
          <div style={{background:isT1?c.blue+"22":c.green+"22",
            border:`1px solid ${isT1?c.blue:c.green}`,
            borderRadius:8,padding:"8px 11px",textAlign:"center"}}>
            <div style={{fontSize:11,color:c.textSec,marginBottom:2,fontWeight:500}}>
              Type de spectre
            </div>
            <div style={{fontSize:15,fontWeight:700,color:isT1?c.blue:c.green}}>
              {isT1?"Type 1":"Type 2"}
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div style={{flex:1,minWidth:300,display:"flex",flexDirection:"column",gap:14}}>

          {/* Zone 0 warning banner */}
          {isZone0 && (
            <div style={{background:c.amber+"18",border:`1px solid ${c.amber}`,
              borderRadius:10,padding:"12px 16px",
              display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:22}}>⚠️</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:c.amber}}>
                  Zone 0 — Sismicité très faible
                </div>
                <div style={{fontSize:12,color:c.textSec,marginTop:2}}>
                  Selon RPA 2024 §3.1, le calcul sismique n'est pas requis pour cette wilaya.
                  Le spectre affiché est fourni à titre indicatif uniquement.
                </div>
              </div>
            </div>
          )}

          {/* Param cards */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Card label="A"    value={hData.A}       unit="zone"         accent={c.amber}    c={c}/>
            <Card label="I"    value={hData.I}       unit="importance"   accent={c.purple}   c={c}/>
            <Card label="S"    value={hData.S}       unit="site"         accent={c.green}    c={c}/>
            <Card label="QF"   value={QF.toFixed(2)} unit="qualité"      accent={c.amber}    c={c}/>
            <Card label="R"    value={R}             unit="comportement" accent={c.red}      c={c}/>
            <Card label="T₁"   value={hData.T1}      unit="sec"          accent={c.textSec}  c={c}/>
            <Card label="T₂"   value={hData.T2}      unit="sec"          accent={c.textSec}  c={c}/>
            <Card label="T₃"   value={hData.T3}      unit="sec"          accent={c.textSec}  c={c}/>
          </div>

          {/* Both charts side by side */}

          {/* API status — shown only when backend has an issue */}
          {apiErr && (
            <div style={{background:c.red+"15",border:`1px solid ${c.red}44`,
              borderRadius:8,padding:"10px 14px",fontSize:12,color:c.red,
              display:"flex",alignItems:"flex-start",gap:8}}>
              <span style={{flexShrink:0}}>❌</span>
              <span style={{lineHeight:1.5}}>{apiErr}</span>
            </div>
          )}
          {loading && !specData && (
            <div style={{fontSize:12,color:c.textMuted,
              display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
              <span style={{animation:"spin 1s linear infinite"}}>⏳</span>
              Connexion au backend Python...
            </div>
          )}
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            <MiniChart
              data={hData.pts} color={c.blue}
              T1={hData.T1} T2={hData.T2} T3={hData.T3}
              floor={hData.floor} peak={hData.peak}
              label="Sad(T)/g" eq="Éq. 3.15" c={c}/>
            <MiniChart
              data={vData.pts} color={c.purple}
              T1={vData.T1} T2={vData.T2} T3={vData.T3}
              floor={vData.floor} peak={vData.peak}
              label="Svd(T)/g" eq="Éq. 3.16" c={c}/>
          </div>

          {/* Formula + Export bar */}
          <div style={{background:c.surface,border:`1px solid ${c.border}`,
            borderRadius:10,padding:"11px 14px",
            display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>

            {/* Formula */}
            <div style={{flex:1,fontSize:12,color:c.textSec,fontFamily:"monospace",
              minWidth:240}}>
              <span style={{color:c.blue,fontWeight:700}}>Éq.3.15</span>
              {"  "}Sad(palier)={hData.A}·{hData.I}·{hData.S}·2.5·({QF.toFixed(2)}/{R})={" "}
              <span style={{color:c.red,fontWeight:700}}>{hData.peak}</span>
              {"  "}
              <span style={{color:c.purple,fontWeight:700,marginLeft:10}}>Éq.3.16</span>
              {"  "}Svd(palier)=<span style={{color:c.purple,fontWeight:700}}>{vData.peak}</span>
            </div>

            {/* Export buttons */}
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button
                onClick={()=>alert("Export vers Robot — Session 7 : connexion bridge desktop")}
                style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
                  background:c.blue+"22",border:`1px solid ${c.blue}`,
                  color:c.blue,fontSize:12,fontWeight:600,
                  display:"flex",alignItems:"center",gap:6}}>
                🔌 Export -> Robot
              </button>
              <button
                onClick={()=>specData&&exportTxtH(hData,zone,site)}
                style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
                  background:c.blue+"11",border:`1px solid ${c.blue}66`,
                  color:c.blue,fontSize:12,fontWeight:600,
                  display:"flex",alignItems:"center",gap:5}}>
                📄 Sad -> .txt
              </button>
              <button
                onClick={()=>specData&&exportTxtV(vData,zone,site)}
                style={{padding:"8px 13px",borderRadius:8,cursor:"pointer",
                  background:c.purple+"11",border:`1px solid ${c.purple}66`,
                  color:c.purple,fontSize:12,fontWeight:600,
                  display:"flex",alignItems:"center",gap:5}}>
                📄 Svd -> .txt
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
