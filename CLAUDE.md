# CLAUDE.md — Bunyan Development Guide

> **Bunyan** (بنيان) — Structural Verification Platform for Algerian Engineers

---

## 1. PROJECT OVERVIEW

Bunyan is a structural engineering SaaS platform built for Algerian structural engineers. It connects to structural analysis software (Robot, ETABS), performs seismic and reinforced concrete design verification according to Algerian and international codes, and generates professional calculation reports (notes de calcul).

### Core Workflow

```
Structural Software (Robot / ETABS)
        ↓
   Software Adapter
        ↓
 Unified Structural Model (USM)
        ↓
 Engineering Verification Engine
        ↓
 Verification Dashboard + Calculation Report
```

### Bidirectional Data Exchange

- **Software → Bunyan**: import structural data for verification
- **Bunyan → Software**: export response spectra and load combinations

### Typical Engineer Actions

- Import Model
- Export Response Spectrum
- Generate Load Combinations
- Send Combinations to Software
- Run Seismic Verification
- Run RC Design Checks
- Generate Calculation Report

---

## 2. AI COLLABORATION MODEL

Development uses a **two-role AI workflow**. This is a strict protocol.

### Claude Opus (Chat) — System Architect

Responsible for:
- Software architecture and system design
- Engineering formula verification against RPA 2024 / CBA93 / BAEL91 sources
- Planning development steps and defining specs
- Reviewing Claude Code's work at a high level
- Preparing structured implementation tasks

**Claude Opus is the single source of design authority.**

### Claude Code (Terminal) — Implementation Agent

Responsible for:
- Writing code, creating files, modifying modules
- Refactoring, running tests, git operations
- Executing clearly defined tasks from Opus specs

### Communication Protocol (CRITICAL)

```
┌─────────────────────────────────────────────────────────┐
│                  WORKFLOW LOOP                           │
│                                                         │
│  1. Opus designs spec  ──→  2. Engineer validates       │
│                                      │                  │
│  4. Opus reviews        ←──  3. Claude Code implements  │
│         │                            │                  │
│  5. Next spec or fix   ──→   (back to 1)               │
└─────────────────────────────────────────────────────────┘
```

**Rule 1**: Claude Code takes design/architecture instructions ONLY from Opus.
If Claude Code encounters an architectural decision during implementation,
it must stop and ask — never decide on its own.

**Rule 2**: After every modification, Claude Code MUST write a brief summary
of what was done. This summary is sent back to Opus for review.

Summary format:
```
## Session Summary — [date]

### What was done
- [List of changes with file paths]

### Decisions made
- [Any micro-decisions during implementation]

### Issues encountered
- [Blockers, ambiguities, questions]

### Tests
- [Test results: passed/failed/skipped]

### Files modified
- [Full list of touched files]
```

**Rule 3**: The engineer validates all engineering formulas before implementation.
The AI must never invent engineering formulas. Instead, it must ask:
> "Please confirm the formula or code rule you want to use."
The engineering responsibility always belongs to the engineer.

### Task Delegation Format

When Opus prepares a task for Claude Code:

```
TASK: [Short title]

GOAL
[What this task achieves]

FILES
[File paths to create/modify]

REQUIREMENTS
- [Bullet list of what must be implemented]

CONSTRAINTS
- [Architecture rules to respect]
- [Things NOT to do]

TESTS
- [What tests to write/run]

VERIFY
- [How to confirm it works]
```

---

## 3. ARCHITECTURE PRINCIPLES

### 3.1 Engineering Core Isolation (CRITICAL — MOST IMPORTANT RULE)

ALL engineering formulas live EXCLUSIVELY in `calc_engine/`.

- **NEVER** put formulas in API routes (`backend/api/`)
- **NEVER** put formulas in React components (`frontend/src/`)
- **NEVER** put formulas in the bridge (`bridge/`)
- **NEVER** put formulas in database code or services

API routes only call engine functions and return results.
React components only display results from the API.

### 3.2 Single Source of Truth

- Engineering data (zones, coefficients, code tables) → `calc_engine/` only
- The backend serves this data via API endpoints
- The frontend fetches and caches — never hardcodes engineering data
- One definition, one location, zero duplication

### 3.3 Unified Structural Model (USM)

Robot and ETABS use different formats. The system converts them into a
Unified Structural Model using dedicated adapters.

```
Robot / ETABS  →  Bridge  →  Adapters  →  USM  →  Engine  →  Reports
```

The calculation engine works EXCLUSIVELY with the USM.

### 3.4 Manual Input Always Available

Even when data is imported automatically, the engineer must always have
the option to manually modify or override any value.

```
Import value from software  →  Use imported value
Switch to manual input      →  Engineer enters custom value
```

### 3.5 Clean Layered Architecture

```
1. Presentation Layer  — Frontend (React + TypeScript)
2. API Layer           — FastAPI (routes, schemas, validation)
3. Application Layer   — Services / use case orchestration
4. Engineering Core    — All structural calculations (calc_engine/)
5. Infrastructure      — Database, bridge communication
```

Each layer is independent and testable.

---

## 4. UI/UX RULES (CRITICAL)

### 4.1 Fixed Viewport Layout — NO SCROLLING

```
┌─────────────────────────────────────────────────────┐
│  TOPBAR (sticky)                          [≡] [🌙]  │
├────────┬────────────────────────────────────────────┤
│        │                                            │
│  SIDE  │         MAIN CONTENT AREA                  │
│  BAR   │                                            │
│        │    Everything visible at once.              │
│ (nav)  │    No full-page scrolling.                 │
│        │    Panels, cards, tabs for overflow.        │
│        │                                            │
├────────┴────────────────────────────────────────────┤
│  STATUS BAR (optional)                              │
└─────────────────────────────────────────────────────┘
```

**This is a single-page, fixed-viewport application.**

- The entire page fits within `100vh × 100vw` — no full-page scrolling
- Content that exceeds available space uses:
  - Tabs to switch between sections
  - Scrollable panels/cards within fixed containers
  - Collapsible sections
  - Modal overlays for detail views
- Each "page" is a view that fills the main content area
- Sidebar is fixed and toggleable, hamburger in sticky topbar
- Think of it like ETABS or Robot: a professional desktop application in the browser

### 4.2 Design Identity

- Modern, professional, engineering-focused
- Clean visual hierarchy with clear data presentation
- Meaningful color coding for verification states:
  - ✅ OK (ratio < 0.9)
  - ⚠️ Warning (0.9 ≤ ratio ≤ 1.0)
  - ❌ Failure (ratio > 1.0)
- Dark/light theme support
- French interface for Algerian engineers
- Fluid interactions, minimal manual effort, minimal cognitive load
- Intuitive data visualization (tables, charts, diagrams)

### 4.3 Current UI Parameters (until redesign)

- `zoom: 1.35` on main content
- `zoom: 1.08` on sidebar (height = 100vh / 1.08 for night mode button fix)
- `zoom: 0.9` on ProjectParams page
- Modals use `zoom: 1` (no scaling)
- These will be replaced by a proper design system in the UI redesign phase

---

## 5. TECH STACK

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | React 18, TypeScript, Vite, Zustand     |
| Styling        | Tailwind CSS (or design tokens)         |
| Backend        | Python FastAPI, Pydantic                |
| Database       | PostgreSQL, SQLAlchemy, Alembic         |
| Auth           | JWT-based                               |
| Engine         | Pure Python (no framework dependencies) |
| Desktop Bridge | Python agent (local HTTP API)           |
| Testing        | pytest (engine + backend), vitest (frontend) |

---

## 6. PROJECT STRUCTURE

```
bunyan/
├── CLAUDE.md                          # This file — Claude Code reads this first
├── README.md                          # Project overview
├── .gitignore
├── pyproject.toml                     # Python project config
├── requirements.txt
│
├── docs/
│   ├── architecture.md                # Architecture decisions & principles
│   ├── session-log.md                 # Session history
│   └── formulas/                      # Formula references per module
│       └── rpa2024-seismic.md
│
├── calc_engine/                       # ALL engineering logic lives here
│   ├── __init__.py
│   ├── seismic/
│   │   └── rpa2024/
│   │       ├── __init__.py
│   │       ├── parameters.py          # Seismic zone params, soil classes
│   │       ├── spectrum.py            # Elastic spectrum Sae/g
│   │       ├── design_spectrum.py     # Sad (Eq 3.15) + Svd (Eq 3.16)
│   │       ├── base_shear.py          # V = λ·Sad·W (Eq 3.1)
│   │       └── annex_a.py             # Wilaya/commune/zone — SINGLE SOURCE
│   ├── rc_design/                     # Future: CBA93, BAEL91, EC2
│   │   └── __init__.py
│   └── core/                          # Future: Unified Structural Model
│       └── __init__.py
│
├── backend/
│   ├── main.py                        # FastAPI app entry
│   ├── config.py                      # Pydantic BaseSettings
│   ├── database.py                    # SQLAlchemy setup (Phase 5)
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py              # Central router
│   │       └── endpoints/
│   │           ├── spectrum.py
│   │           ├── base_shear.py
│   │           └── annex_a.py         # Serve wilaya/commune/zone data
│   ├── schemas/
│   │   ├── seismic.py
│   │   └── common.py
│   ├── models/                        # SQLAlchemy models (Phase 5)
│   │   └── __init__.py
│   └── services/                      # Business logic orchestration
│       └── __init__.py
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── types/                     # Shared TypeScript interfaces
│       │   ├── seismic.ts
│       │   ├── project.ts
│       │   └── structural.ts
│       ├── stores/                    # Zustand state management
│       │   ├── projectStore.ts
│       │   ├── seismicStore.ts
│       │   └── uiStore.ts
│       ├── services/                  # API client layer
│       │   └── api.ts
│       ├── components/
│       │   ├── shared/
│       │   │   ├── QFModal.tsx
│       │   │   └── RModal.tsx
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── TopBar.tsx
│       │   │   └── AppShell.tsx       # Fixed viewport container
│       │   ├── general/
│       │   │   └── ProjectParams.tsx
│       │   └── seismic/
│       │       ├── SpectrumChart.tsx
│       │       └── BaseShearPage.tsx
│       └── styles/
│           └── theme.ts              # Design tokens, colors, theme
│
├── tests/
│   ├── engine/
│   │   └── seismic/
│   │       ├── test_spectrum.py
│   │       ├── test_base_shear.py
│   │       └── test_annex_a.py
│   └── backend/
│       └── test_endpoints.py
│
└── bridge/                            # Future: desktop bridge agent
    ├── __init__.py
    └── adapters/
        ├── robot_adapter.py
        └── etabs_adapter.py
```

---

## 7. FILE CONVENTIONS

### Engine (`calc_engine/`)

- Each code module gets its own directory: `calc_engine/seismic/rpa2024/`
- Every formula function MUST have:
  - Docstring with the equation number and code clause reference
  - Type hints on all parameters and return values
  - Corresponding test in `tests/engine/`
- Parameters from code tables → dataclass or typed dict, never magic numbers
- Pure functions — no side effects, no framework dependencies
- Always check uploaded RPA 2024 source files before implementing formulas

### Backend (`backend/`)

- Endpoints in `backend/api/v1/endpoints/`
- Request/response models in `backend/schemas/`
- Endpoints MUST NOT contain engineering logic — only call engine functions
- Use Pydantic BaseSettings for configuration
- RESTful with versioning: `/api/v1/`
- Route groups: `/projects`, `/models`, `/calculations`, `/reports`

### Frontend (`frontend/src/`)

- ALL files are TypeScript (.tsx / .ts) — no .jsx / .js
- Shared types in `frontend/src/types/`
- State management via Zustand stores in `frontend/src/stores/`
- API calls via `frontend/src/services/api.ts` — never raw fetch in components
- Components read from stores, not prop drilling from App.tsx
- All user-facing text: French
- All code, comments, variable names: English

### Tests (`tests/`)

- Mirror the source structure: `tests/engine/seismic/test_spectrum.py`
- Every engine function MUST have tests
- Test names: `test_<function>_<scenario>`
- Use pytest parametrize for multiple input cases
- No calculation module is complete without passing tests

---

## 8. LANGUAGE RULES

- **Application interface**: French (for Algerian engineers)
- **Code, comments, variables, git commits**: English
- **Engineering terms**: may appear in French when referencing code clauses
  (e.g., RPA 2024 equation names, DTR references)
- **Development discussions**: English

---

## 9. GIT CONVENTIONS

- Branch naming: `feature/<module>`, `fix/<issue>`, `refactor/<scope>`
- Commit messages: imperative mood, reference the module
  - `Add annex_a.py with commune-to-zone mapping`
  - `Refactor SpectrumChart to use seismic store`
- Atomic commits: one logical change per commit
- Always run tests before committing

---

## 10. DATA VALIDATION & ERROR HANDLING

### Data Validation

- All incoming data validated using Pydantic schemas
- Units must be explicit and consistent (kN, m, MPa, etc.)
- Invalid structural data rejected with clear error messages

### Error Handling

The system must handle:
- Missing model data
- Invalid geometry
- Incomplete load cases
- API connection failures
- Bridge disconnection

Errors must be descriptive, logged, and user-friendly (in French).

---

## 11. SECURITY

- JWT-based authentication
- Each user can only access their own projects
- Secure communication between bridge and backend (local token or key)

---

## 12. ENGINEERING FORMULAS — WORKING RULES

1. **Observations before code** — present all findings and observations first
2. **If a formula is uncertain → ASK before coding** — never guess
3. **Include equation reference** as a comment at the point of use
4. **Include formula module reference** at the top of each file
5. **Cross-reference** with RPA 2024 (DTR BC 2.48) uploaded source documents
6. **Always check uploaded project files** before implementing any formula
   (RPA 2024 chapters are uploaded as project knowledge)

---

## 13. CURRENT STATE

### Completed Modules

- ✅ **Elastic spectrum** Sae/g — `calc_engine/seismic/rpa2024/spectrum.py`
- ✅ **Design spectrum** Sad Eq 3.15 — `calc_engine/seismic/rpa2024/design_spectrum.py`
- ✅ **Design spectrum** Svd Eq 3.16 — `calc_engine/seismic/rpa2024/design_spectrum.py`
- ✅ **Base shear** V = λ·Sad·W Eq 3.1 — `calc_engine/seismic/rpa2024/base_shear.py`
- ✅ **FastAPI endpoints** — POST /api/v1/spectrum, POST /api/v1/base_shear
- ✅ **React pages** — ProjectParams, SpectrumChart, BaseShearPage
- ✅ **23 passing tests** for engine modules
- ✅ **QF Modal** with category-based calculation per RPA 2024
- ✅ **R Modal** with 6 material tabs, 25 bracing systems from Table 3.18
- ✅ **Annex A data** for all 58 wilayas (verified against official Excel)

### Key Formulas Implemented

- `Sad(T)/g` — Eq 3.15 (4 branches + floor 0.2·A·I)
- `Svd(T)/g` — Eq 3.16 (alpha exponent, R=1.5 fixed)
- `QF = 1 + ΣPq` — capped per category
- `V = λ · Sad(T₀)/g · W` — where λ=0.85 if T₀≤2T₂ AND n>2, else 1.0
- `Ft = 0.07·T₀·V` — (max 0.25V) if T₀ > 0.7s
- `T_emp = CT · hₙ^0.75`
- `T₀ = min(T_calc, 1.3·T_emp)`
- 80% check: `Vt ≥ 0.8·V`, majoration coeff = 0.8·V/Vt

### Pending (Foundation Upgrade)

- 🔄 TypeScript migration
- 🔄 Zustand state management (replace props drilling)
- 🔄 Data deduplication (Annex A → backend only)
- 🔄 Database + auth (PostgreSQL)
- 🔄 Fixed viewport UI redesign

### Not Started

- ⏳ Seismic combinations
- ⏳ RC design — CBA93
- ⏳ RC design — BAEL91
- ⏳ RC design — Eurocode 2
- ⏳ Desktop bridge (Robot, ETABS)
- ⏳ Report generation
- ⏳ Verification dashboard

---

## 14. PROGRESSIVE DEVELOPMENT STRATEGY

### Software Integration Order

1. Robot Structural Analysis
2. ETABS

### Design Code Order

1. CBA93
2. BAEL91
3. Eurocode 2

### Feature Development Order

**Step 1** — RPA 2024 spectral response + seismic verification *(in progress)*
**Step 2** — CBA93 reinforced concrete design: Beams → Columns → Shear Walls → Foundations
**Step 3** — BAEL91 modules
**Step 4** — Eurocode 2 modules
**Step 5** — Repeat full workflow for ETABS

### Future Scalability

The system must support adding without refactoring core components:
- Additional structural software
- Additional design codes
- Additional materials (steel, composite)

New modules must plug into the existing architecture cleanly.

---

## 15. COMMON PATTERNS

### Adding a New Engine Module

1. Create `calc_engine/<domain>/<code>/<module>.py`
2. Write pure functions with type hints, docstrings, and equation references
3. Add tests in `tests/engine/<domain>/test_<module>.py`
4. Run tests: `pytest tests/engine/ -v`
5. Verify against uploaded source documents

### Adding a New API Endpoint

1. Create endpoint in `backend/api/v1/endpoints/<name>.py`
2. Define schemas in `backend/schemas/<name>.py`
3. Import engine functions — NO formula logic in the endpoint
4. Register router in `backend/api/v1/router.py`

### Adding a New React Page

1. Create component in `frontend/src/components/<domain>/`
2. Use Zustand store for state — NO props from App.tsx
3. Use `api.ts` service for backend calls
4. Respect fixed viewport layout — no full-page scrolling
5. All user-facing text in French, all code in English

---

## 16. PERFORMANCE & MONITORING

- Calculations optimized for large models
- Asynchronous processing where necessary
- Long calculations support background jobs
- Log all calculations, errors, and API calls
- Logs sufficient to debug engineering issues

---

## 17. DESIGN SUGGESTIONS (FUTURE)

When elements fail verification, the system may suggest corrections:

- **Beam**: increase reinforcement, increase section depth, adjust stirrup spacing
- **Column**: increase reinforcement, increase section size, increase concrete strength

**The system must NEVER automatically modify the structural model.**

---

## 18. REPORT GENERATION (FUTURE)

Export formats: PDF, Word

Report contents:
- Project data
- Model summary
- Seismic verification results
- RC design calculations
- Reinforcement results
- Optional calculation traceability

Export levels: Summary / Standard / Detailed

---

## 19. SUPPORTED SOFTWARE APIs

### ETABS

Use ETABS OAPI with Python (`comtypes` or `ETABSv1`).
Extract: members, sections, load cases, load combinations, story data, member forces.

### Robot Structural Analysis

Use Robot API via Python (`comtypes` / `win32com`).
Extract: bars, nodes, load cases, structural results.

Both support writing back: response spectra, load cases, load combinations.

### Desktop Bridge

A lightweight Python agent runs locally:
- Connect to ETABS or Robot
- Extract structural model data
- Send generated data back to software
- Expose a local HTTP API
- Communicate with the web application

---

## 20. UNIFIED STRUCTURAL MODEL (FUTURE)

| Entity      | Fields                                           |
|-------------|--------------------------------------------------|
| Node        | id, x, y, z                                     |
| Member      | id, start_node, end_node, section, material, type|
| LoadCase    | name, type                                       |
| MemberForce | member_id, load_combination, N, V2, V3, M2, M3  |

The calculation engine works exclusively with USM entities.

---

## 21. DATABASE STRUCTURE (FUTURE)

- Projects
- Models
- Calculations
- Results
- Reports

Each user can only access their own projects.
Multiple calculations per model allowed for comparison.
