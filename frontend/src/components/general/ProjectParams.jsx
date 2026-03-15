/**
 * StructCalc — Paramètres Généraux (Session 9b)
 *
 * Layout: Proposal A — two rows
 *   Row 1: [2 Sismique (wide)] [3 Géométrie] [1 Identification]
 *   Row 2: [4 Résultats dynamique — full width]
 *
 * zoom:0.9 applied to the page wrapper (10% smaller than other pages).
 */

import { useState } from "react"
import QFModal, { DEF_CHECKED } from "../shared/QFModal.jsx"
import RModal    from "../shared/RModal.jsx"

// ─────────────────────────────────────────────────────────────────────────────
// DATA — RPA 2024 Annex A (full data from Session 5)
// ─────────────────────────────────────────────────────────────────────────────
const WILAYAS = [
  {code:"01",name:"Adrar",               zone:"0",  split:false},
  {code:"02",name:"Chlef",               zone:"VI", split:true },
  {code:"03",name:"Laghouat",            zone:"II", split:true },
  {code:"04",name:"Oum El Bouaghi",      zone:"IV", split:true },
  {code:"05",name:"Batna",               zone:"III",split:true },
  {code:"06",name:"Béjaïa",            zone:"VI", split:true },
  {code:"07",name:"Biskra",              zone:"III",split:true },
  {code:"08",name:"Béchar",            zone:"I",  split:false},
  {code:"09",name:"Blida",               zone:"VI", split:false},
  {code:"10",name:"Bouira",              zone:"V",  split:true },
  {code:"11",name:"Tamanrasset",         zone:"0",  split:false},
  {code:"12",name:"Tébessa",           zone:"III",split:true },
  {code:"13",name:"Tlemcen",             zone:"IV", split:true },
  {code:"14",name:"Tiaret",              zone:"III",split:true },
  {code:"15",name:"Tizi Ouzou",          zone:"V",  split:true },
  {code:"16",name:"Alger",               zone:"VI", split:false},
  {code:"17",name:"Djelfa",              zone:"III",split:true },
  {code:"18",name:"Jijel",               zone:"VI", split:true },
  {code:"19",name:"Sétif",             zone:"IV", split:true },
  {code:"20",name:"Saïda",            zone:"I",  split:true },
  {code:"21",name:"Skikda",              zone:"IV", split:true },
  {code:"22",name:"Sidi Bel Abbès",   zone:"I",  split:true },
  {code:"23",name:"Annaba",              zone:"IV", split:false},
  {code:"24",name:"Guelma",              zone:"V",  split:false},
  {code:"25",name:"Constantine",         zone:"V",  split:false},
  {code:"26",name:"Médéa",            zone:"V",  split:true },
  {code:"27",name:"Mostaganem",          zone:"V",  split:true },
  {code:"28",name:"M'Sila",           zone:"IV", split:true },
  {code:"29",name:"Mascara",             zone:"VI", split:true },
  {code:"30",name:"Ouargla",             zone:"0",  split:false},
  {code:"31",name:"Oran",                zone:"VI", split:true },
  {code:"32",name:"El Bayadh",           zone:"II", split:true },
  {code:"33",name:"Illizi",              zone:"0",  split:false},
  {code:"34",name:"Bordj Bou Arréridj", zone:"V",  split:true },
  {code:"35",name:"Boumerdès",        zone:"VI", split:true },
  {code:"36",name:"El Tarf",             zone:"V",  split:true },
  {code:"37",name:"Tindouf",             zone:"0",  split:false},
  {code:"38",name:"Tissemsilt",          zone:"IV", split:true },
  {code:"39",name:"El Oued",             zone:"II", split:true },
  {code:"40",name:"Khenchela",           zone:"III",split:true },
  {code:"41",name:"Souk Ahras",          zone:"V",  split:true },
  {code:"42",name:"Tipaza",              zone:"VI", split:false},
  {code:"43",name:"Mila",                zone:"V",  split:true },
  {code:"44",name:"Aïn Defla",        zone:"VI", split:true },
  {code:"45",name:"Naâma",            zone:"II", split:true },
  {code:"46",name:"Aïn Témouchent",  zone:"V",  split:true },
  {code:"47",name:"Ghardaïa",         zone:"I",  split:false},
  {code:"48",name:"Relizane",            zone:"VI", split:true },
  {code:"49",name:"Timimoun",            zone:"0",  split:false},
  {code:"50",name:"Bordj Badji Mokhtar",zone:"0",  split:false},
  {code:"51",name:"Ouled Djellal",       zone:"II", split:false},
  {code:"52",name:"Béni Abbès",       zone:"0",  split:false},
  {code:"53",name:"In Salah",            zone:"0",  split:false},
  {code:"54",name:"In Guezzam",          zone:"0",  split:false},
  {code:"55",name:"Touggourt",           zone:"I",  split:false},
  {code:"56",name:"Djanet",              zone:"0",  split:false},
  {code:"57",name:"El M'Ghair",       zone:"I",  split:false},
  {code:"58",name:"El Meniaa",           zone:"0",  split:false},
]

const WILAYA_COMMUNES = {
  "02":{defaultZone:"VI",communes:[{name:"Beni Bouattab",zone:"V"},{name:"Taougrite",zone:"V"},{name:"El Marsa",zone:"V"},{name:"Dahra",zone:"V"},{name:"Ouled Ben Abdelkader",zone:"V"},{name:"Moussadek",zone:"V"},{name:"Talassa",zone:"V"},{name:"El Hadjadj",zone:"V"},{name:"Sidi Abderrahmane",zone:"V"}]},
  "03":{defaultZone:"II",communes:[{name:"Hassi Delaa",zone:"I"}]},
  "04":{defaultZone:"III",communes:[{name:"Sigus",zone:"IV"},{name:"El Amiria",zone:"IV"},{name:"Ouled Gacem",zone:"IV"},{name:"Ain M'lila",zone:"IV"},{name:"Bir Chouhada",zone:"IV"},{name:"Souk Naamane",zone:"IV"},{name:"Ouled Hamla",zone:"IV"},{name:"Ksar Sbahi",zone:"IV"},{name:"Ain Babouche",zone:"IV"},{name:"Ain Diss",zone:"IV"},{name:"Oued Nini",zone:"II"},{name:"Dhalaa",zone:"II"},{name:"El Djazia",zone:"II"},{name:"Meskiana",zone:"II"},{name:"El Belala",zone:"II"}]},
  "05":{defaultZone:"III",communes:[{name:"Abdelkader Azil",zone:"II"},{name:"M'Doukel",zone:"II"},{name:"Bitam",zone:"II"},{name:"Arris",zone:"II"},{name:"Inoughissen",zone:"II"},{name:"Ichemoul",zone:"II"},{name:"Foum Toub",zone:"II"},{name:"Ouled Fadel",zone:"II"}]},
  "06":{defaultZone:"VI",communes:[{name:"Toudja",zone:"V"},{name:"Adekar",zone:"V"},{name:"Taourirt Ighil",zone:"V"},{name:"El Kseur",zone:"V"},{name:"Fenaia Ilmaten",zone:"V"},{name:"Thinabdher",zone:"V"},{name:"Tifra",zone:"V"},{name:"Akfadou",zone:"V"},{name:"Chemini",zone:"V"},{name:"Tibane",zone:"V"},{name:"Souk Oufella",zone:"V"},{name:"Ouzellaguen",zone:"V"},{name:"Boudjellil",zone:"V"},{name:"Ighil Ali",zone:"V"},{name:"Beni Ksila",zone:"V"}]},
  "07":{defaultZone:"II",communes:[{name:"M'Ziraa",zone:"III"},{name:"Zeribet El Oued",zone:"III"},{name:"Khenguet Sidi Nadji",zone:"III"},{name:"Ain Zaatout",zone:"III"},{name:"Branis",zone:"III"},{name:"Chetma",zone:"III"},{name:"Djemorah",zone:"III"},{name:"El Kantara",zone:"III"},{name:"El Outaya",zone:"III"},{name:"M'Chouneche",zone:"III"}]},
  "10":{defaultZone:"V",communes:[{name:"Taguedit",zone:"IV"},{name:"Mezdour",zone:"IV"},{name:"Hadjera Zergua",zone:"IV"},{name:"Dirah",zone:"IV"},{name:"Mamora",zone:"IV"},{name:"Ridane",zone:"IV"},{name:"Bordj Oukhris",zone:"IV"},{name:"El Hakimia",zone:"IV"}]},
  "12":{defaultZone:"II",communes:[{name:"Bir El Ater",zone:"III"},{name:"Ferkane",zone:"III"},{name:"Negrine",zone:"III"},{name:"Stah Guentis",zone:"III"},{name:"Tlidjene",zone:"III"},{name:"El Meridj",zone:"III"},{name:"Ouenza",zone:"III"},{name:"El Aouinet",zone:"III"},{name:"Boukhadra",zone:"III"}]},
  "13":{defaultZone:"IV",communes:[{name:"Tlemcen",zone:"III"},{name:"Mansourah",zone:"III"},{name:"Ain Fezza",zone:"III"},{name:"Ain Ghoraba",zone:"III"},{name:"Terny Beni Hediel",zone:"III"},{name:"Sabra",zone:"III"},{name:"Bouhlou",zone:"III"},{name:"Beni Mester",zone:"III"},{name:"Ain Nahala",zone:"III"},{name:"Sidi Abdelli",zone:"III"},{name:"Hennaya",zone:"III"},{name:"Chetouane",zone:"III"},{name:"Amieur",zone:"III"},{name:"Sidi Medjahed",zone:"III"},{name:"Beni Bahdel",zone:"III"},{name:"Azails",zone:"III"},{name:"Beni Boussaid",zone:"III"},{name:"Beni Snous",zone:"III"},{name:"Ain Tallout",zone:"II"},{name:"Beni Semiel",zone:"II"},{name:"Oued Lakhdar",zone:"II"},{name:"Sebdou",zone:"II"},{name:"Sidi Djillali",zone:"II"},{name:"El Bouihi",zone:"II"},{name:"El Gor",zone:"II"},{name:"El Aricha",zone:"II"},{name:"Ouled Mimoun",zone:"II"}]},
  "14":{defaultZone:"I",communes:[{name:"Sebt",zone:"III"},{name:"Tidda",zone:"III"},{name:"Sidi Ali Mellal",zone:"III"},{name:"Rahouia",zone:"III"},{name:"Meghila",zone:"III"},{name:"Ain Zarit",zone:"II"},{name:"Ain Bouchekif",zone:"II"},{name:"Ain El Hadid",zone:"II"},{name:"Bougara",zone:"II"},{name:"Dahmouni",zone:"II"},{name:"Frenda",zone:"II"},{name:"Hamadia",zone:"II"},{name:"Mahdia",zone:"II"},{name:"Mechraa Safa",zone:"II"},{name:"Medroussa",zone:"II"},{name:"Mellakou",zone:"II"},{name:"Sebaine",zone:"II"},{name:"Sidi Bakhti",zone:"II"},{name:"Tagdemt",zone:"II"},{name:"Takhemaret",zone:"II"},{name:"Tiaret",zone:"II"},{name:"Rechaiga",zone:"II"},{name:"Si Abdelghani",zone:"II"},{name:"Nadourah",zone:"II"},{name:"Sidi Hosni",zone:"II"},{name:"Djillali Ben Amar",zone:"II"},{name:"Oued Lilli",zone:"II"},{name:"Guertoufa",zone:"II"}]},
  "15":{defaultZone:"IV",communes:[{name:"Illilten",zone:"V"},{name:"Iloula Oumalou",zone:"V"},{name:"Iferhounene",zone:"V"},{name:"Imsouhal",zone:"V"},{name:"Bouzguen",zone:"V"},{name:"Beni Ziki",zone:"V"},{name:"Idjer",zone:"V"},{name:"Abi Youcef",zone:"V"},{name:"Akbil",zone:"V"},{name:"Yatafene",zone:"V"},{name:"Iboudraren",zone:"V"},{name:"Ouacif",zone:"V"},{name:"Ait Boumahdi",zone:"V"},{name:"Boghni",zone:"V"},{name:"Bounouh",zone:"V"},{name:"Frikat",zone:"V"},{name:"Draa El Mizan",zone:"V"},{name:"Tizi Ghenif",zone:"V"},{name:"Mkira",zone:"V"},{name:"Ait Yahia",zone:"V"},{name:"Ifigha",zone:"V"},{name:"Souamaa",zone:"V"},{name:"Tadmait",zone:"V"},{name:"Ain El Hammam",zone:"V"},{name:"Beni Yenni",zone:"V"},{name:"Ait Toudert",zone:"V"},{name:"Agouni Gueghrane",zone:"V"},{name:"Ouadhia",zone:"V"},{name:"Ait Bouadou",zone:"V"},{name:"Tizi N'Tleta",zone:"V"},{name:"Assi Youcef",zone:"V"},{name:"Ait Yahia Moussa",zone:"V"},{name:"Ain Zaouia",zone:"V"},{name:"Mechtras",zone:"V"}]},
  "17":{defaultZone:"II",communes:[{name:"Birin",zone:"III"},{name:"Ain Feka",zone:"III"},{name:"Guettara",zone:"I"},{name:"Oum Laadham",zone:"I"},{name:"Seid Rahal",zone:"I"}]},
  "18":{defaultZone:"V",communes:[{name:"El Taguene",zone:"VI"},{name:"El Aouana",zone:"VI"},{name:"Ziama Mansouriah",zone:"VI"},{name:"Selma Ben Ziada",zone:"VI"},{name:"Jijel",zone:"VI"},{name:"Kaous",zone:"VI"},{name:"Djemaa Beni Habibi",zone:"IV"},{name:"El Ancer",zone:"IV"},{name:"El Milia",zone:"IV"},{name:"Kheiri Oued Adjoul",zone:"IV"},{name:"Sidi Abdelaziz",zone:"IV"}]},
  "19":{defaultZone:"IV",communes:[{name:"Babor",zone:"VI"},{name:"Oued El Bared",zone:"VI"},{name:"Tizi N'Bechar",zone:"VI"},{name:"Tala Ifacene",zone:"VI"},{name:"Ait Tizi",zone:"VI"},{name:"Ait Nawal M'zada",zone:"VI"},{name:"Bousselam",zone:"VI"},{name:"Beni Mouhli",zone:"VI"},{name:"Beni Chebana",zone:"VI"},{name:"Beni Ouartilane",zone:"VI"},{name:"Bouandas",zone:"VI"},{name:"Ain Sebt",zone:"V"},{name:"Beni Aziz",zone:"V"},{name:"Serdj El Ghoul",zone:"V"},{name:"Ain Abessa",zone:"V"},{name:"Ain El Kebira",zone:"V"},{name:"Amoucha",zone:"V"},{name:"Ain Roua",zone:"V"},{name:"El Ouricia",zone:"V"},{name:"Beni Fouda",zone:"V"},{name:"Maaouia",zone:"V"},{name:"Ouled Addouane",zone:"V"},{name:"Dehamcha",zone:"V"},{name:"Djemila",zone:"V"},{name:"Maoklane",zone:"V"},{name:"Ain Legradj",zone:"V"},{name:"Guenzet",zone:"V"},{name:"Harbil",zone:"V"},{name:"Hammam Guergour",zone:"V"},{name:"Bougaa",zone:"V"},{name:"Draa Kebila",zone:"V"}]},
  "20":{defaultZone:"I",communes:[{name:"Saida",zone:"II"},{name:"Ain Soltane",zone:"II"},{name:"Doui Thabet",zone:"II"},{name:"Ouled Brahim",zone:"II"},{name:"Ouled Khaled",zone:"II"},{name:"Youb",zone:"II"},{name:"Hounet",zone:"II"},{name:"Sidi Boubekeur",zone:"II"},{name:"Sidi Amar",zone:"II"}]},
  "21":{defaultZone:"IV",communes:[{name:"Ain Bouziane",zone:"V"},{name:"Beni Oulbane",zone:"V"},{name:"El Ghedir",zone:"V"},{name:"El Harrouch",zone:"V"},{name:"Emdjez Edchich",zone:"V"},{name:"Es Sebt",zone:"V"},{name:"Ouled Hbaba",zone:"V"},{name:"Oum Toub",zone:"V"},{name:"Salah Bouchaour",zone:"V"},{name:"Sidi Mezghiche",zone:"V"},{name:"Zerdaza",zone:"V"},{name:"Ain Charchar",zone:"V"},{name:"Bekkouche Lakhdar",zone:"V"},{name:"Azzaba",zone:"V"},{name:"Ramdane Djamel",zone:"V"}]},
  "22":{defaultZone:"I",communes:[{name:"Ain Adden",zone:"IV"},{name:"Ain El Berd",zone:"IV"},{name:"Ain Thrid",zone:"IV"},{name:"Boudjebaa El Bordj",zone:"IV"},{name:"Makedra",zone:"IV"},{name:"Sehala Thaoura",zone:"IV"},{name:"Sfisef",zone:"IV"},{name:"Sidi Daho De Zairs",zone:"IV"},{name:"Sidi Hamadouche",zone:"IV"},{name:"Tessala",zone:"IV"},{name:"Sidi Bel Abbes",zone:"III"},{name:"Ain Kada",zone:"III"},{name:"Hassi Zahana",zone:"III"},{name:"Lamtar",zone:"III"},{name:"M'Cid",zone:"III"},{name:"Mostefa Ben Brahim",zone:"III"},{name:"Sidi Ali Boussidi",zone:"III"},{name:"Sidi Brahim",zone:"III"},{name:"Sidi Khaled",zone:"III"},{name:"Sidi Lahcene",zone:"III"},{name:"Sidi Yacoub",zone:"III"},{name:"Tilmouni",zone:"III"},{name:"Zerouala",zone:"III"},{name:"Ain Tindamine",zone:"II"},{name:"Benachiba Chelia",zone:"II"},{name:"Chettouane Belaila",zone:"II"},{name:"El Hacaiba",zone:"II"},{name:"Merine",zone:"II"},{name:"Mezaourou",zone:"II"},{name:"Moulay Slissen",zone:"II"},{name:"Sidi Ali Benyoub",zone:"II"},{name:"Teghalimet",zone:"II"},{name:"Telagh",zone:"II"},{name:"Tabia",zone:"II"},{name:"Belarbi",zone:"II"},{name:"Boukhanafis",zone:"II"},{name:"Oued Sefioun",zone:"II"},{name:"Amarnas",zone:"II"},{name:"Hassi Dahou",zone:"II"},{name:"Tenira",zone:"II"},{name:"Ben Badis",zone:"II"},{name:"Badredine El Mokrani",zone:"II"}]},
  "26":{defaultZone:"V",communes:[{name:"Ouled Hellal",zone:"IV"},{name:"Ouled Antar",zone:"IV"},{name:"Boghar",zone:"IV"},{name:"Moudjbar",zone:"IV"},{name:"Seghouane",zone:"IV"},{name:"Ain Ouksir",zone:"IV"},{name:"Chelalat El Adhoura",zone:"IV"},{name:"Tafraout",zone:"IV"},{name:"Sidi Ziane",zone:"IV"},{name:"Rebaia",zone:"IV"},{name:"Kef Lakhdar",zone:"IV"},{name:"Tlatet Eddouair",zone:"IV"},{name:"Cheniguel",zone:"IV"},{name:"Aziz",zone:"III"},{name:"Derrag",zone:"III"},{name:"Oum El Djalil",zone:"III"},{name:"Ksar El Boukhari",zone:"III"},{name:"Saneg",zone:"III"},{name:"Mefatha",zone:"III"},{name:"Ain Boucif",zone:"III"},{name:"Sidi Damed",zone:"III"},{name:"El Aouinet",zone:"III"},{name:"Ouled Maaref",zone:"III"},{name:"Chahbounia",zone:"II"},{name:"Bouaiche",zone:"II"},{name:"Boughezoul",zone:"II"}]},
  "27":{defaultZone:"V",communes:[{name:"Bouguirat",zone:"VI"},{name:"Oued El Kheir",zone:"VI"},{name:"Ouled Maaleh",zone:"VI"},{name:"Safsaf",zone:"VI"},{name:"Sidi Ali",zone:"VI"},{name:"Souaflia",zone:"VI"},{name:"Sour",zone:"VI"}]},
  "28":{defaultZone:"IV",communes:[{name:"Ain Khadra",zone:"III"},{name:"Benzouh",zone:"III"},{name:"Berhoum",zone:"III"},{name:"Chellal",zone:"III"},{name:"Dehahna",zone:"III"},{name:"Magra",zone:"III"},{name:"Ouled Addi Guebala",zone:"III"},{name:"Ouled Derradj",zone:"III"},{name:"Ouled Madhi",zone:"III"},{name:"Souamaa",zone:"III"},{name:"Belaiba",zone:"III"},{name:"Khoubana",zone:"III"},{name:"M'Cif",zone:"III"},{name:"Maarif",zone:"III"},{name:"Ouled Sidi Brahim",zone:"III"},{name:"Sidi Ameur",zone:"III"},{name:"Bou Saada",zone:"II"},{name:"El Houamed",zone:"II"},{name:"Tamsa",zone:"II"},{name:"Slim",zone:"II"},{name:"Bir Fodda",zone:"II"},{name:"Sidi M'hamed",zone:"II"},{name:"Ain Fares",zone:"II"},{name:"Mohamed Boudiaf",zone:"II"},{name:"Ain El Melh",zone:"II"},{name:"Ouled Slimane",zone:"II"},{name:"Zerzour",zone:"II"},{name:"Ben Srour",zone:"II"},{name:"Djebel Messaad",zone:"II"},{name:"El Hamel",zone:"II"},{name:"Medjedel",zone:"II"},{name:"Ouled Atia",zone:"II"},{name:"Oultem",zone:"II"},{name:"Ain Errich",zone:"II"}]},
  "29":{defaultZone:"VI",communes:[{name:"Sidi Kada",zone:"V"},{name:"Sidi Boussaid",zone:"V"},{name:"Sidi Abdeldjebar",zone:"V"},{name:"Bouhanifia",zone:"V"},{name:"El Gaada",zone:"V"},{name:"Zahana",zone:"V"},{name:"Chorfa",zone:"V"},{name:"Froha",zone:"V"},{name:"Matemor",zone:"V"},{name:"Tizi",zone:"V"},{name:"Oued El Abtal",zone:"IV"},{name:"Hachem",zone:"IV"},{name:"Zelmata",zone:"IV"},{name:"Guerdjoum",zone:"IV"},{name:"Ain Fekan",zone:"IV"},{name:"Ghriss",zone:"IV"},{name:"Ain Fras",zone:"IV"},{name:"Makdha",zone:"IV"},{name:"Nesmoth",zone:"IV"},{name:"Ain Ferah",zone:"III"},{name:"Gharrous",zone:"III"},{name:"Aouf",zone:"III"},{name:"Beniane",zone:"III"},{name:"Oued Taria",zone:"III"}]},
  "31":{defaultZone:"VI",communes:[{name:"Tafraoui",zone:"V"}]},
  "32":{defaultZone:"II",communes:[{name:"Bougtob",zone:"I"},{name:"Cheguig",zone:"I"},{name:"El Kheiter",zone:"I"},{name:"Rogassa",zone:"I"}]},
  "34":{defaultZone:"IV",communes:[{name:"Tafreg",zone:"V"},{name:"Djaafra",zone:"V"},{name:"Tassamert",zone:"V"},{name:"Ouled Sidi Brahim",zone:"V"},{name:"El Main",zone:"V"}]},
  "35":{defaultZone:"VI",communes:[{name:"Chaabet El Ameur",zone:"V"},{name:"Leghata",zone:"V"},{name:"Timezrit",zone:"V"},{name:"Isser",zone:"V"},{name:"Bordj Menaiel",zone:"V"},{name:"Djenet",zone:"V"},{name:"Naciria",zone:"V"},{name:"Ouled Aissa",zone:"V"},{name:"Sidi Daoud",zone:"IV"},{name:"Ben Choud",zone:"IV"},{name:"Dellys",zone:"IV"},{name:"Afir",zone:"IV"},{name:"Baghlia",zone:"IV"},{name:"Taourga",zone:"IV"}]},
  "36":{defaultZone:"IV",communes:[{name:"Asfour",zone:"V"},{name:"Chihani",zone:"V"},{name:"Hammam Beni Salah",zone:"V"},{name:"Drean",zone:"V"}]},
  "38":{defaultZone:"III",communes:[{name:"Boucard",zone:"IV"},{name:"Larbaa",zone:"IV"},{name:"Lazharia",zone:"IV"},{name:"Melaab",zone:"IV"},{name:"Khemisti",zone:"II"},{name:"Laayoune",zone:"II"},{name:"Tissemsilt",zone:"II"},{name:"Ammari",zone:"II"},{name:"Maacem",zone:"II"}]},
  "39":{defaultZone:"0",communes:[{name:"Guemar",zone:"II"},{name:"Sidi Aoun",zone:"II"},{name:"Magrane",zone:"II"},{name:"Hassi Khelifa",zone:"II"},{name:"Beni Guecha",zone:"II"},{name:"Hamraia",zone:"II"},{name:"El Oued",zone:"I"},{name:"Kouinine",zone:"I"},{name:"Ourmes",zone:"I"},{name:"Taghzout",zone:"I"},{name:"Bayadha",zone:"I"},{name:"Hassani Abdelkrim",zone:"I"},{name:"Debila",zone:"I"},{name:"Reguiba",zone:"I"},{name:"Trifaoui",zone:"I"},{name:"Taleb Larbi",zone:"I"},{name:"Nekhla",zone:"I"},{name:"Mih Ouensa",zone:"I"},{name:"El Ogla",zone:"I"},{name:"Robbah",zone:"I"},{name:"Oued Allenda",zone:"I"}]},
  "40":{defaultZone:"III",communes:[{name:"M'Sara",zone:"II"},{name:"Ain Touila",zone:"II"},{name:"Baghai",zone:"II"},{name:"Bouhmama",zone:"II"},{name:"Chelia",zone:"II"},{name:"El Hamma",zone:"II"},{name:"El Mahmal",zone:"II"},{name:"Ensigha",zone:"II"},{name:"Kais",zone:"II"},{name:"Khenchela",zone:"II"},{name:"M'Toussa",zone:"II"},{name:"Ouled Rechache",zone:"II"},{name:"Tamza",zone:"II"},{name:"Taouzient",zone:"II"},{name:"Yabous",zone:"II"},{name:"Remila",zone:"II"}]},
  "41":{defaultZone:"IV",communes:[{name:"Hanancha",zone:"V"},{name:"Mechroha",zone:"V"},{name:"Bir Bouhouche",zone:"III"},{name:"Oum El Adhaim",zone:"III"},{name:"Oued Kebrit",zone:"III"},{name:"Safel El Ouiden",zone:"III"},{name:"Terraguelt",zone:"III"}]},
  "43":{defaultZone:"V",communes:[{name:"Tadjenanet",zone:"IV"},{name:"Ouled Khellouf",zone:"IV"},{name:"M'Chira",zone:"IV"}]},
  "44":{defaultZone:"VI",communes:[{name:"Djelida",zone:"V"},{name:"El Maine",zone:"V"},{name:"Zeddine",zone:"V"},{name:"Bourached",zone:"V"},{name:"Oued Djemaa",zone:"V"},{name:"Ain Lachiakh",zone:"V"},{name:"Djemaa Ouled Cheikh",zone:"V"},{name:"Birbouche",zone:"V"},{name:"Oued Chorfa",zone:"V"},{name:"Bordj Emir Khaled",zone:"V"},{name:"Ain Soltane",zone:"V"},{name:"Bir Ouled Khelifa",zone:"V"},{name:"Tarik Ibn Ziad",zone:"IV"},{name:"El Hassania",zone:"IV"},{name:"Bathia",zone:"IV"},{name:"Belaas",zone:"IV"}]},
  "45":{defaultZone:"II",communes:[{name:"El Biod",zone:"I"},{name:"Kasdir",zone:"I"},{name:"Makman Ben Ammar",zone:"I"}]},
  "46":{defaultZone:"V",communes:[{name:"Aghlal",zone:"IV"},{name:"Aoubellil",zone:"IV"},{name:"Hassasna",zone:"IV"},{name:"Oued Berkeche",zone:"IV"}]},
  "48":{defaultZone:"VI",communes:[{name:"Ouled Yaich",zone:"V"},{name:"Zemmora",zone:"V"},{name:"Sidi M'Hamed Benaouda",zone:"V"},{name:"Dar Ben Abdellah",zone:"V"},{name:"Souk El Had",zone:"V"},{name:"Ammi Moussa",zone:"V"},{name:"Ain Tarek",zone:"IV"},{name:"El Hassi",zone:"IV"},{name:"Had Echkalla",zone:"IV"},{name:"Mendes",zone:"IV"},{name:"Oued Essalem",zone:"IV"},{name:"Ramka",zone:"IV"},{name:"Sidi Lazreg",zone:"IV"}]},
}

const ZONE_LABELS={
  "0":"Zone 0 — Très faible","I":"Zone I (0.07g)","II":"Zone II (0.10g)",
  "III":"Zone III (0.15g)","IV":"Zone IV (0.20g)","V":"Zone V (0.25g)","VI":"Zone VI (0.30g)",
}
const FRAME_SYSTEMS=[
  {v:"ba_no_infill",   l:"Ossature BA sans remplissage",       ct:"CT=0.075"},
  {v:"steel_no_infill",l:"Ossature acier sans remplissage",    ct:"CT=0.085"},
  {v:"ba_with_infill", l:"Ossature BA/acier avec remplissage", ct:"CT=0.050"},
  {v:"other",          l:"Autres systèmes",                    ct:"CT=0.050"},
]

// ─────────────────────────────────────────────────────────────────────────────
// SMALL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function Block({ title, number, color, children, c, style={} }) {
  return (
    <div style={{background:c.surface,border:`1px solid ${c.border}`,
      borderRadius:14,padding:16,...style}}>
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}>
        <span style={{background:color+"22",color,borderRadius:5,
          padding:"2px 7px",fontSize:12,fontWeight:700}}>{number}</span>
        <span style={{fontSize:11,letterSpacing:"0.08em",fontWeight:700,
          color,textTransform:"uppercase"}}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Lbl({ children, c }) {
  return (
    <div style={{fontSize:11,letterSpacing:"0.06em",color:c.textSec,
      textTransform:"uppercase",fontWeight:600,marginBottom:4}}>
      {children}
    </div>
  )
}

function Inp({ value, onChange, placeholder, color, c, type="text", step }) {
  return (
    <input type={type} value={value} placeholder={placeholder}
      step={step} min={0}
      onChange={e=>onChange(e.target.value)}
      style={{width:"100%",background:c.elevated,
        border:`1px solid ${color?color+"55":c.border}`,
        color:color||c.text,borderRadius:8,padding:"8px 10px",
        fontSize:13,fontFamily:type==="number"?"monospace":undefined,
        outline:"none"}}/>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ProjectParams({ params, setParams, c }) {
  const [showQF,     setShowQF]     = useState(null)
  const [showR,      setShowR]      = useState(null)
  const [importMsg,  setImportMsg]  = useState(null)

  const wilaya      = WILAYAS.find(w=>w.code===params.wilayaCode)||WILAYAS[8]
  const communeData = WILAYA_COMMUNES[params.wilayaCode]
  const hasCommunes = !!(communeData&&communeData.communes.length>0)
  const isZone0     = params.zone==="0"

  function deriveZone(code,commune){
    const w=WILAYAS.find(w2=>w2.code===code)||WILAYAS[8]
    const cd=WILAYA_COMMUNES[code]
    if (!cd) return w.zone          // no commune data for this wilaya → use wilaya zone
    if (!commune) return cd.defaultZone  // "Autre commune" → use the defaultZone
    const f=cd.communes.find(c2=>c2.name===commune)
    return f?f.zone:cd.defaultZone
  }
  const up=(key,val)=>setParams(p=>({...p,[key]:val}))
  const handleWilaya=code=>setParams(p=>({...p,wilayaCode:code,commune:"",zone:deriveZone(code,"")}))
  const handleCommune=commune=>setParams(p=>({...p,commune,zone:deriveZone(params.wilayaCode,commune)}))

  function handleQFValidate(qf,cat,chk){
    if(showQF==="x")      setParams(p=>({...p,QFx:qf,qfCatX:cat,qfChkX:chk}))
    else if(showQF==="y") setParams(p=>({...p,QFy:qf,qfCatY:cat,qfChkY:chk}))
    else                  setParams(p=>({...p,QF:qf,qfCat:cat,qfChk:chk}))
    setShowQF(null)
  }
  function handleRValidate(r,sys){
    if(showR==="x")      setParams(p=>({...p,Rx:r,selSysX:sys?.id||1,qfCatX:sys?.qfCat||"a"}))
    else if(showR==="y") setParams(p=>({...p,Ry:r,selSysY:sys?.id||1,qfCatY:sys?.qfCat||"a"}))
    else                 setParams(p=>({...p,R:r,selSys:sys?.id||1,qfCat:sys?.qfCat||"a"}))
    setShowR(null)
  }

  function addStorey(){
    const last=params.stories[params.stories.length-1]
    const lastElev=parseFloat(last?.elevation)||0
    const step=params.stories.length>=2
      ?parseFloat(last.elevation)-parseFloat(params.stories[params.stories.length-2].elevation):3.0
    setParams(p=>({...p,stories:[...p.stories,{
      id:Date.now(),name:`Etage ${p.stories.length}`,
      elevation:(lastElev+step).toFixed(1),weight:last?.weight||"1000",drx:"",dry:"",
    }]}))
  }
  function removeStorey(id){if(params.stories.length>1)setParams(p=>({...p,stories:p.stories.filter(s=>s.id!==id)}))}
  function updateStorey(id,field,val){setParams(p=>({...p,stories:p.stories.map(s=>s.id===id?{...s,[field]:val}:s)}))}

  const totalW=params.stories.reduce((a,s)=>a+(parseFloat(s.weight)||0),0)
  const hn=params.stories.length?Math.max(...params.stories.map(s=>parseFloat(s.elevation)||0)):0

  const sel={background:c.elevated,border:`1px solid ${c.border}`,color:c.text,
    borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none",width:"100%"}

  const qfBtn=(dir,val)=>(
    <button type="button" onClick={()=>setShowQF(dir)} style={{
      ...sel,display:"flex",alignItems:"center",justifyContent:"space-between",
      cursor:"pointer",marginBottom:8}}>
      <span>Q<sub>F</sub>{dir!=="single"&&dir.toUpperCase()!=="SINGLE"?`(${dir.toUpperCase()})`:""} = <b style={{color:c.amber}}>{val.toFixed(2)}</b></span>
      <span style={{fontSize:11,color:c.blue}}>Calculer →</span>
    </button>
  )
  const rBtn=(dir,val)=>(
    <button type="button" onClick={()=>setShowR(dir)} style={{
      ...sel,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
      <span>R{dir!=="single"&&dir.toUpperCase()!=="SINGLE"?`(${dir.toUpperCase()})`:""} = <b style={{color:c.red}}>{val}</b></span>
      <span style={{fontSize:11,color:c.blue}}>Identifier →</span>
    </button>
  )

  return (
    // zoom:0.9 — 10% smaller than the rest of the app (which is zoom:1.35)
    <div style={{zoom:0.9, background:c.bg,minHeight:"100vh",color:c.text,
      fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",padding:"22px 20px"}}>

      {showQF&&<QFModal c={c}
        initCat={showQF==="x"?params.qfCatX:showQF==="y"?params.qfCatY:params.qfCat}
        initChecked={showQF==="x"?params.qfChkX:showQF==="y"?params.qfChkY:params.qfChk}
        onClose={()=>setShowQF(null)} onValidate={handleQFValidate}/>}
      {showR&&<RModal c={c}
        initSystem={showR==="x"?params.selSysX:showR==="y"?params.selSysY:params.selSys}
        onClose={()=>setShowR(null)} onValidate={handleRValidate}/>}

      {/* Page header */}
      <div style={{marginBottom:18}}>
        <div style={{fontSize:12,letterSpacing:"0.12em",color:c.blue,
          textTransform:"uppercase",marginBottom:5,fontWeight:600}}>
          StructCalc — Paramètres
        </div>
        <h1 style={{fontSize:22,fontWeight:700,margin:0,color:c.text}}>Paramètres Généraux</h1>
        <div style={{color:c.textSec,fontSize:13,marginTop:3}}>
          Définis une fois — utilisés par tous les modules
        </div>
      </div>

      {/* ── ROW 1: Blocks 1 + 2 + 3 — always same line (CSS grid, no wrap) ── */}
      <div style={{display:"flex",gap:14,flexWrap:"nowrap",alignItems:"flex-start",marginBottom:14,overflow:"hidden"}}>

        {/* ═══ BLOCK 1 — Identification ═══ */}
        <Block number="1" title="Identification" color={c.textMuted} c={c}
          style={{flex:"0 0 200px",minWidth:0,overflow:"hidden"}}>
          <div style={{fontSize:11,color:c.textMuted,marginBottom:10,fontStyle:"italic"}}>
            Facultatif — utilisé dans les rapports
          </div>

          {[
            {l:"Nom du projet",k:"projectName",ph:`Projet_${params.date}`},
            {l:"Ingénieur",    k:"engineer",   ph:"Nom"},
            {l:"Référence",    k:"reference",  ph:"Réf."},
          ].map(f=>(
            <div key={f.k} style={{marginBottom:8}}>
              <Lbl c={c}>{f.l}</Lbl>
              <input type="text" value={params[f.k]} placeholder={f.ph}
                onChange={e=>up(f.k,e.target.value)}
                style={{width:"100%",background:c.elevated,border:`1px solid ${c.border}`,
                  color:c.text,borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none"}}/>
            </div>
          ))}

          <div style={{background:c.elevated,borderRadius:7,padding:"7px 10px",
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:c.textMuted}}>Date</span>
            <span style={{fontSize:12,color:c.textSec}}>{params.date}</span>
          </div>
        </Block>

        {/* ═══ BLOCK 2 — Sismique (widest) ═══ */}
        <Block number="2" title="Paramètres sismiques" color={c.blue} c={c}
          style={{flex:"1 1 0",minWidth:0,overflow:"hidden"}}>

          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {/* Left sub-column */}
            <div style={{flex:"1 1 0",minWidth:0,display:"flex",flexDirection:"column",gap:0}}>
              <div style={{marginBottom:10}}>
                <Lbl c={c}>Wilaya</Lbl>
                <select value={params.wilayaCode} onChange={e=>handleWilaya(e.target.value)} style={sel}>
                  {WILAYAS.map(w=><option key={w.code} value={w.code}>{w.code} — {w.name}</option>)}
                </select>
              </div>

              {wilaya.split&&hasCommunes&&(
                <div style={{marginBottom:10}}>
                  <Lbl c={c}>Commune</Lbl>
                  <select value={params.commune} onChange={e=>handleCommune(e.target.value)}
                    style={{...sel,border:`1px solid ${c.amber}66`}}>
                    <option value="">— Autre commune (Zone {communeData.defaultZone})</option>
                    {[...communeData.communes]
                      .sort((a,b)=>a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name))
                      .map(cm=><option key={cm.name} value={cm.name}>{cm.name} → Zone {cm.zone}</option>)}
                  </select>
                </div>
              )}
              {wilaya.split&&!hasCommunes&&(
                <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,
                  borderRadius:8,padding:"7px 10px",fontSize:11,color:c.amber,
                  lineHeight:1.5,marginBottom:10}}>
                  ⚠️ Wilaya partagée — consulter l'Annexe A du RPA 2024
                </div>
              )}

              {/* Zone display */}
              <div style={{background:isZone0?c.amber+"18":c.blue+"18",
                border:`1px solid ${isZone0?c.amber:c.blue}55`,
                borderRadius:8,padding:"8px 11px",marginBottom:10}}>
                <div style={{fontSize:10,color:c.textMuted,marginBottom:2,
                  textTransform:"uppercase",letterSpacing:"0.06em"}}>Zone — Annexe A</div>
                <div style={{fontSize:14,fontWeight:700,color:isZone0?c.amber:c.blue}}>
                  {ZONE_LABELS[params.zone]||params.zone}
                </div>
                {params.commune&&(
                  <div style={{fontSize:11,color:c.textSec,marginTop:2}}>
                    Commune : <b>{params.commune}</b>
                  </div>
                )}
              </div>

              <div style={{marginBottom:10}}>
                <Lbl c={c}>Classe de site</Lbl>
                <div style={{display:"flex",gap:5}}>
                  {["S1","S2","S3","S4"].map(s=>(
                    <button type="button" key={s} onClick={()=>up("site",s)} style={{
                      flex:1,padding:"6px 0",borderRadius:7,cursor:"pointer",
                      border:`1px solid ${params.site===s?c.green:c.border}`,
                      background:params.site===s?c.green+"22":c.elevated,
                      color:params.site===s?c.green:c.textSec,
                      fontSize:12,fontWeight:params.site===s?700:400}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:10}}>
                <Lbl c={c}>Groupe d'importance</Lbl>
                <select value={params.group} onChange={e=>up("group",e.target.value)} style={sel}>
                  <option value="1A">Groupe 1A — I=1.4</option>
                  <option value="1B">Groupe 1B — I=1.2</option>
                  <option value="2">Groupe 2 — I=1.0</option>
                  <option value="3">Groupe 3 — I=0.8</option>
                </select>
              </div>
            </div>

            {/* Right sub-column */}
            <div style={{flex:"1 1 0",minWidth:0,display:"flex",flexDirection:"column",gap:0}}>
              <div style={{marginBottom:10}}>
                <Lbl c={c}>Directions spectre (QF et R)</Lbl>
                <div style={{display:"flex",gap:6}}>
                  {[{l:"Direction unique",v:false,col:c.blue},
                    {l:"X et Y",          v:true, col:c.purple}].map(d=>(
                    <button type="button" key={String(d.v)} onClick={()=>up("twoDir",d.v)} style={{
                      flex:1,padding:"6px",borderRadius:8,cursor:"pointer",
                      border:`1px solid ${params.twoDir===d.v?d.col:c.border}`,
                      background:params.twoDir===d.v?d.col+"22":c.elevated,
                      color:params.twoDir===d.v?d.col:c.textSec,
                      fontSize:11,fontWeight:params.twoDir===d.v?700:400}}>
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>

              {!params.twoDir?(
                <>
                  <div style={{marginBottom:10}}>
                    <Lbl c={c}>Facteur qualité QF</Lbl>
                    {qfBtn("single",params.QF)}
                  </div>
                  <div style={{marginBottom:10}}>
                    <Lbl c={c}>Coeff. comportement R</Lbl>
                    {rBtn("single",params.R)}
                    <div style={{fontSize:11,color:c.textSec,marginTop:3}}>
                      Syst. {params.selSys} · Cat. ({params.qfCat})
                    </div>
                  </div>
                </>
              ):(
                <div style={{display:"flex",gap:8}}>
                  <div style={{flex:1,background:c.blue+"11",border:`1px solid ${c.blue}33`,
                    borderRadius:8,padding:10}}>
                    <div style={{fontSize:10,color:c.blue,fontWeight:700,marginBottom:8,
                      textTransform:"uppercase",letterSpacing:"0.06em"}}>Dir. X</div>
                    {qfBtn("x",params.QFx)}
                    {rBtn("x",params.Rx)}
                  </div>
                  <div style={{flex:1,background:c.purple+"11",border:`1px solid ${c.purple}33`,
                    borderRadius:8,padding:10}}>
                    <div style={{fontSize:10,color:c.purple,fontWeight:700,marginBottom:8,
                      textTransform:"uppercase",letterSpacing:"0.06em"}}>Dir. Y</div>
                    {qfBtn("y",params.QFy)}
                    {rBtn("y",params.Ry)}
                  </div>
                </div>
              )}

              <div style={{marginTop:8}}>
                <Lbl c={c}>Système CT (période)</Lbl>
                <select value={params.frameSys} onChange={e=>up("frameSys",e.target.value)} style={sel}>
                  {FRAME_SYSTEMS.map(f=>(
                    <option key={f.v} value={f.v}>{f.ct} — {f.l.split(" ").slice(0,4).join(" ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Block>

        {/* ═══ BLOCK 3 — Géométrie ═══ */}
        <Block number="3" title="Géométrie et masses" color={c.green} c={c}
          style={{flex:"1 1 0",minWidth:0,overflow:"hidden"}}>

          {/* Import buttons */}
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {["Robot","ETABS"].map(sw=>(
              <button type="button" key={sw}
                onClick={()=>setImportMsg(`${sw} non connecté — menu Connexion`)}
                style={{flex:1,padding:"6px 10px",borderRadius:7,cursor:"pointer",
                  background:c.blue+"11",border:`1px solid ${c.blue}44`,
                  color:c.blue,fontSize:12,fontWeight:600}}>
                🔌 {sw}
              </button>
            ))}
          </div>
          {importMsg&&(
            <div style={{background:c.amber+"11",border:`1px solid ${c.amber}44`,
              borderRadius:7,padding:"6px 9px",fontSize:11,color:c.amber,
              marginBottom:8,display:"flex",justifyContent:"space-between"}}>
              {importMsg}
              <button type="button" onClick={()=>setImportMsg(null)}
                style={{background:"none",border:"none",color:c.textMuted,cursor:"pointer"}}>✕</button>
            </div>
          )}

          {/* Table header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 58px 68px 24px",
            gap:5,marginBottom:5}}>
            {["Niveau","h(m)","W(kN)",""].map((h,i)=>(
              <div key={i} style={{fontSize:10,color:c.textMuted,
                textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{display:"flex",flexDirection:"column",gap:4,
            maxHeight:250,overflowY:"auto",marginBottom:8}}>
            {params.stories.map(s=>(
              <div key={s.id} style={{display:"grid",
                gridTemplateColumns:"1fr 58px 68px 24px",gap:5,alignItems:"center"}}>
                <input value={s.name} onChange={e=>updateStorey(s.id,"name",e.target.value)}
                  style={{background:c.elevated,border:`1px solid ${c.border}`,
                    borderRadius:5,padding:"5px 7px",color:c.text,fontSize:12,
                    outline:"none",width:"100%"}}/>
                <input type="number" value={s.elevation} min={0} step={0.5}
                  onChange={e=>updateStorey(s.id,"elevation",e.target.value)}
                  style={{background:c.elevated,border:`1px solid ${c.border}`,
                    borderRadius:5,padding:"5px 7px",color:c.purple,
                    fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                <input type="number" value={s.weight} min={0}
                  onChange={e=>updateStorey(s.id,"weight",e.target.value)}
                  style={{background:c.elevated,border:`1px solid ${c.border}`,
                    borderRadius:5,padding:"5px 7px",color:c.green,
                    fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                <button type="button" onClick={()=>removeStorey(s.id)}
                  disabled={params.stories.length<=1}
                  style={{width:22,height:22,borderRadius:4,cursor:"pointer",
                    background:params.stories.length>1?c.red+"22":"transparent",
                    border:params.stories.length>1?`1px solid ${c.red}44`:"1px solid transparent",
                    color:params.stories.length>1?c.red:c.textMuted,fontSize:12,
                    display:"flex",alignItems:"center",justifyContent:"center"}}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addStorey} style={{
            width:"100%",padding:"6px",borderRadius:7,cursor:"pointer",
            background:c.green+"22",border:`1px solid ${c.green}44`,
            color:c.green,fontSize:12,fontWeight:600,marginBottom:10}}>
            + Ajouter un niveau
          </button>

          <div style={{display:"flex",gap:8}}>
            {[{l:"Poids total W",v:`${totalW.toFixed(0)} kN`,col:c.green},
              {l:"Hauteur hn",   v:`${hn.toFixed(1)} m`,    col:c.purple}].map(r=>(
              <div key={r.l} style={{flex:1,background:c.elevated,borderRadius:7,padding:"7px 10px",
                display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:10,color:c.textMuted}}>{r.l}</span>
                <span style={{fontSize:13,fontWeight:700,color:r.col,fontFamily:"monospace"}}>{r.v}</span>
              </div>
            ))}
          </div>
        </Block>
      </div>


        {/* ── ROW 2: Block 4 — full width ── */}
      <Block number="4" title="Résultats analyse dynamique" color={c.amber} c={c}>

        <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"flex-start"}}>

          {/* Import strip */}
          <div style={{width:"100%",background:c.elevated,border:`1px solid ${c.border}`,
            borderRadius:8,padding:"8px 12px",marginBottom:4,
            display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:c.borderLight,flexShrink:0}}/>
            <span style={{fontSize:12,color:c.textMuted,flex:1}}>
              Robot / ETABS non connecté — saisie manuelle
            </span>
            <button type="button" style={{padding:"5px 12px",borderRadius:6,
              cursor:"not-allowed",background:c.border,border:"none",
              color:c.textMuted,fontSize:11}}>
              Importer
            </button>
          </div>

          {/* Periods + shear */}
          <div style={{flex:"0 0 auto",display:"flex",gap:10,flexWrap:"wrap"}}>
            {[
              {l:"Période Tx (s)",       k:"Tx", col:c.blue},
              {l:"Période Ty (s)",        k:"Ty", col:c.purple},
              {l:"Effort dyn. Vxd (kN)", k:"Vxd",col:c.blue},
              {l:"Effort dyn. Vyd (kN)", k:"Vyd",col:c.purple},
            ].map(f=>(
              <div key={f.k} style={{width:160}}>
                <Lbl c={c}>{f.l}</Lbl>
                <input type="number" value={params[f.k]} step="0.01" min={0}
                  placeholder="—"
                  onChange={e=>up(f.k,e.target.value)}
                  style={{width:"100%",background:c.elevated,
                    border:`1px solid ${f.col}44`,borderRadius:8,
                    padding:"8px 10px",color:f.col,fontSize:14,
                    fontFamily:"monospace",outline:"none"}}/>
              </div>
            ))}
          </div>

          {/* Displacements per floor */}
          <div style={{flex:1,minWidth:300}}>
            <Lbl c={c}>Déplacements inter-étages relatifs (cm)</Lbl>
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px 90px",
              gap:6,marginBottom:5}}>
              {["Niveau","drx (cm)","dry (cm)"].map(h=>(
                <div key={h} style={{fontSize:10,color:c.textMuted,
                  textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>{h}</div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,
              maxHeight:160,overflowY:"auto"}}>
              {params.stories.map(s=>(
                <div key={s.id} style={{display:"grid",
                  gridTemplateColumns:"1fr 90px 90px",gap:6,alignItems:"center"}}>
                  <div style={{fontSize:12,color:c.textSec,padding:"3px 0"}}>{s.name}</div>
                  <input type="number" value={s.drx||""} step="0.001" min={0} placeholder="—"
                    onChange={e=>updateStorey(s.id,"drx",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.blue}44`,
                      borderRadius:6,padding:"5px 7px",color:c.blue,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                  <input type="number" value={s.dry||""} step="0.001" min={0} placeholder="—"
                    onChange={e=>updateStorey(s.id,"dry",e.target.value)}
                    style={{background:c.elevated,border:`1px solid ${c.purple}44`,
                      borderRadius:6,padding:"5px 7px",color:c.purple,
                      fontSize:12,fontFamily:"monospace",outline:"none",width:"100%"}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div style={{flex:"0 0 160px",background:c.elevated,borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:11,color:c.textMuted,marginBottom:8,
              textTransform:"uppercase",letterSpacing:"0.06em",fontWeight:600}}>
              Données disponibles
            </div>
            {[
              {l:"Périodes Tx/Ty",  ok:!!(params.Tx&&params.Ty)},
              {l:"Efforts Vxd/Vyd",ok:!!(params.Vxd&&params.Vyd)},
              {l:"Dépl. drx",       ok:params.stories.some(s=>s.drx)},
              {l:"Dépl. dry",       ok:params.stories.some(s=>s.dry)},
            ].map(item=>(
              <div key={item.l} style={{display:"flex",alignItems:"center",gap:7,
                fontSize:12,color:item.ok?c.green:c.textMuted,marginBottom:4}}>
                <span style={{fontSize:13}}>{item.ok?"✅":"○"}</span>
                {item.l}
              </div>
            ))}
          </div>
        </div>
      </Block>
    </div>
  )
}
