# Bunyan — Plateforme de Vérification Structurale

**Bunyan (بنيان)** — Plateforme SaaS de vérification structurale pour ingénieurs algériens.

Vérification parasismique selon **RPA 2024** et ferraillage selon **CBA93 / BAEL91 / Eurocode 2**.

---

## Architecture

```
bunyan/
├── calc_engine/           <- Noyau de calcul (formules pures, isolé)
│   ├── seismic/rpa2024/   <- Spectre RPA 2024, méthode statique
│   ├── rc_design/         <- Ferraillage BA (CBA93, BAEL91, EC2)
│   └── core/              <- Modèle Structurel Unifié (USM)
│
├── backend/               <- FastAPI (routes, schemas)
├── frontend/              <- React 18 + TypeScript + Vite
├── bridge/                <- Agent local (Robot / ETABS)
└── tests/                 <- Tests unitaires (pytest)
```

---

## Installation

```bash
# 1. Créer un environnement virtuel
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/Mac

# 2. Installer les dépendances Python
pip install -r requirements.txt

# 3. Installer les dépendances frontend
cd frontend && npm install
```

---

## Démarrer les serveurs de développement

```bash
# Backend (port 8000)
uvicorn backend.main:app --reload --port 8000

# Frontend (port 5173)
cd frontend && npm run dev
```

Ouvrir : http://localhost:8000/docs (Swagger UI)

---

## Lancer les tests

```bash
pytest tests/ -v
```

---

## Codes de référence

- **RPA 2024** — DTR BC 2.48 — Règles Parasismiques Algériennes
- **CBA 93** — Code du Béton Armé Algérien
- **BAEL 91** — Règles techniques béton armé
- **Eurocode 2** — EN 1992-1-1

---

*Développé pour les ingénieurs structure algériens.*
