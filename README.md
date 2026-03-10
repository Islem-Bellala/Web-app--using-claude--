# StructCalc 🏗️

**Plateforme SaaS de calcul de structures pour ingénieurs algériens**

Vérification parasismique selon **RPA 2024** et ferraillage selon **CBA93 / BAEL91 / Eurocode 2**.

---

## Architecture

```
structcalc/
├── calculation_engine/     ← Noyau de calcul (formules pures, isolé)
│   ├── core/               ← Modèle structurel unifié
│   ├── seismic/rpa2024/    ← Spectre RPA 2024, méthode statique
│   └── rc_design/          ← Ferraillage BA (CBA93, BAEL91, EC2)
│
├── api/                    ← FastAPI (routes web)
├── bridge/                 ← Agent local (Robot / ETABS)
├── database/               ← PostgreSQL / SQLAlchemy
└── tests/                  ← Tests unitaires
```

---

## Installation

```bash
# 1. Cloner le projet
git clone <repo>
cd structcalc

# 2. Créer un environnement virtuel
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Linux/Mac

# 3. Installer les dépendances
pip install -r requirements.txt
```

---

## Démarrer l'API

```bash
uvicorn api.main:app --reload
```

Ouvrir : http://localhost:8000/docs

---

## Lancer les tests

```bash
# Tous les tests
python -m pytest tests/ -v

# Tests du spectre RPA 2024 seulement
python tests/test_spectrum.py
```

---

## Calcul de spectre (exemple rapide)

```python
from calculation_engine.seismic.rpa2024.parameters import (
    SeismicZone, SiteClass, ImportanceGroup
)
from calculation_engine.seismic.rpa2024.spectrum import (
    SpectrumInput, compute_spectrum
)

inp = SpectrumInput(
    zone=SeismicZone.ZONE_VI,
    site_class=SiteClass.S2,
    importance_group=ImportanceGroup.GROUP_2,
    xi_percent=5.0,
)

result = compute_spectrum(inp)
print(result.summary())
```

**Output:**
```
RPA 2024 — Elastic Response Spectrum
────────────────────────────────────────
  Spectrum type : Type1
  Zone          : VI  →  A = 0.3
  Site class    : S2  →  S = 1.2
  Importance    : Group 2  →  I = 1.0
  Damping       : ξ = 5.0%  →  η = 1.0000
  T1 = 0.1s   T2 = 0.5s   T3 = 2.0s
────────────────────────────────────────
  Peak Sae/g    : 0.9000
  Peak Sae      : 8.829 m/s²
```

---

## État d'avancement

| Module | Statut |
|--------|--------|
| Spectre RPA 2024 (Éq. 3.8) | ✅ Terminé |
| Méthode statique équivalente | ✅ Prêt |
| CBA93 — Poutres | 🔄 En développement |
| Pont Robot | 🔄 Stub prêt |
| Pont ETABS | 📅 Planifié |

---

## Codes de référence

- **RPA 2024** — DTR BC 2.48 — Règles Parasismiques Algériennes
- **CBA 93** — Code du Béton Armé Algérien
- **BAEL 91** — Règles techniques de conception et de calcul des ouvrages en béton armé
- **Eurocode 2** — EN 1992-1-1

---

*Développé pour les ingénieurs structure algériens.*
