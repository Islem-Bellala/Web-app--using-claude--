# StructCalc — Session 6: FastAPI Bridge
## Objectif accompli
Tous les calculs d'ingénierie s'exécutent maintenant en Python (FastAPI).
React n'affiche plus que les résultats — aucune formule dans le frontend.

---

## Nouveaux fichiers (Session 6)

### Calcul (nouveau module Python)
```
calculation_engine/seismic/rpa2024/design_spectrum.py   ← NOUVEAU
```
Implémente exactement Éq.3.15 (Sad horizontal) et Éq.3.16 (Svd vertical).
Ajoute les tables de paramètres verticaux (Tables 3.6 et 3.7).

### Backend FastAPI
```
backend/
├── main.py                        ← Application FastAPI + CORS
├── requirements.txt               ← fastapi, uvicorn, pydantic
├── schemas/spectrum_schema.py     ← Modèles Pydantic (validation JSON)
└── api/v1/
    ├── router.py                  ← Agrège les endpoints v1
    └── endpoints/spectrum.py      ← POST /api/v1/spectrum
```

### Frontend React (mise à jour)
```
frontend/src/components/seismic/SpectrumChart.jsx   ← MODIFIÉ
```
- `useMemo(buildH/buildV)` remplacé par `useEffect + fetch()`
- `sadH()`, `svdV()`, `buildH()`, `buildV()` supprimés du JS
- Toute l'interface utilisateur est identique

---

## Installation

### 1. Copier les fichiers

**Nouveaux fichiers** à ajouter à votre projet :
```
structcalc/
├── calculation_engine/seismic/rpa2024/design_spectrum.py   ← NOUVEAU
├── backend/                                                ← NOUVEAU (dossier complet)
│   ├── __init__.py
│   ├── main.py
│   ├── requirements.txt
│   ├── schemas/__init__.py
│   ├── schemas/spectrum_schema.py
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── router.py
│           └── endpoints/
│               ├── __init__.py
│               └── spectrum.py
└── frontend/src/components/seismic/SpectrumChart.jsx       ← REMPLACER
```

**Fichiers à NE PAS modifier** (Session 1 — inchangés) :
```
calculation_engine/seismic/rpa2024/parameters.py   ← NE PAS TOUCHER
calculation_engine/seismic/rpa2024/spectrum.py     ← NE PAS TOUCHER
calculation_engine/seismic/rpa2024/base_shear.py   ← NE PAS TOUCHER
```

### 2. Installer les dépendances Python

```bash
cd structcalc
pip install -r backend/requirements.txt
```

### 3. Démarrer le backend

**Important** : toujours lancer depuis le dossier `structcalc/` (racine du projet)

```bash
# Depuis structcalc/
uvicorn backend.main:app --reload --port 8000
```

Résultat attendu :
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 4. Vérifier le backend

Ouvrir dans le navigateur : http://localhost:8000/docs

Vous devez voir la documentation interactive Swagger avec l'endpoint :
```
POST /api/v1/spectrum
```

Tester manuellement avec le bouton "Try it out".

### 5. Démarrer le frontend React

Dans un autre terminal :
```bash
cd structcalc/frontend
npm run dev
```

L'application s'ouvre sur : http://localhost:5173

---

## Test de vérification

Sur http://localhost:5173, sélectionner :
- Wilaya : Blida (09) → Zone VI
- Classe de site : S2
- Groupe d'importance : 2
- QF = 1.0, R = 4.5

Résultat attendu :
- Sad(palier) = 0.30 × 1.0 × 1.20 × 2.5 × (1.0/4.5) = 0.2000
- Svd(palier) = (0.90 × 0.30) × 1.0 × 2.5/1.5 = 0.4500 (non, vérifier...)
- Les deux courbes s'affichent immédiatement

---

## Architecture de la donnée (Session 6)

```
React                          FastAPI                    Python Engine
─────                          ───────                    ─────────────
wilaya → zone                  POST /api/v1/spectrum      design_spectrum.py
site, groupe                   ┌─ validates input         compute_design_spectra()
QF, R                          │  (Pydantic)              ├─ compute_Sad_g()   Éq.3.15
                               │                          └─ compute_Svd_g()   Éq.3.16
                          ─────┘
                          calls engineering core
                          ─────┐
Response JSON ←────────────────┘
{horizontal: {T1,T2,T3,peak,floor,points:[{T,Sa_g}]}
 vertical:   {T1,T2,T3,peak,floor,points:[{T,Sa_g}]}}
         ↓
Charts (Recharts)
Cards (A, I, S, QF, R, T1, T2, T3)
Export (.txt)
```

---

## Session 7 (prochaine)

Tableau de bord effort tranchant à la base (Méthode Statique Équivalente).
- Endpoint : `POST /api/v1/base_shear`
- Saisie des niveaux (nom, hauteur, poids)
- Résultats : V, Ft, distribution Fi par niveau
- Graphique de distribution des forces
