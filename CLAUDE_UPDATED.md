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
┌─────────────────────────────────────────────────────────┐
│  TOPBAR (48px): بنيان Bunyan + project + save + user    │
├────────┬────────────────────────────────────────────────┤
│        │                                                │
│  SIDE  │         MAIN CONTENT AREA                      │
│  BAR   │                                                │
│ (~200px│    Everything visible at once.                  │
│  nav)  │    No full-page scrolling.                     │
│        │    Only <main> scrolls.                        │
│ Grouped│    Panels, cards, tabs for overflow.            │
│ by code│                                                │
│        │                                                │
│ BIENTÔT│                                                │
│ tags   │                                                │
├────────┴────────────────────────────────────────────────┤
```

**This is a single-page, fixed-viewport application.**

- The entire page fits within `100vh × 100vw` — no full-page scrolling
- Layout enforced by `Layout.tsx`: `h-screen w-screen overflow-hidden`
- Only the `<main>` area scrolls (via `overflow-y: auto`)
- Content that exceeds available space uses:
  - Tabs to switch between sections
  - Scrollable panels/cards within fixed containers
  - Collapsible sections
  - Modal overlays for detail views
- Each "page" is a view that fills the main content area
- Sidebar is fixed and toggleable, hamburger in topbar
- Think of it like ETABS or Robot: a professional desktop application in the browser

### 4.2 Design Identity

- Modern, professional, engineering-focused
- White/light background with clean cards and subtle borders
- Multi-color accent system (blue, orange, green, purple, red — each with meaning)
- Clean visual hierarchy with clear data presentation
- Meaningful color coding for verification states:
  - ✅ OK (ratio < 0.9)
  - ⚠️ Warning (0.9 ≤ ratio ≤ 1.0)
  - ❌ Failure (ratio > 1.0)
- Dark/light theme support via `html.dark` class + Tailwind dark: variants
- Theme persisted to `localStorage` as `bunyan-theme`
- Anti-flash `<script>` in `<head>` applies dark class before React loads
- French interface for Algerian engineers
- Fluid interactions, minimal manual effort, minimal cognitive load
- Intuitive data visualization (tables, charts, diagrams)

### 4.3 ProjectParams — Two-Row Layout

The ProjectParams page uses a two-row layout to fit within the viewport:

```
┌────────────────────────────────────────────────────────────┐
│ ROW 1 — Inputs (flex: 0 0 58%, 3 columns)                  │
│                                                            │
│  Col 1 (210px)    Col 2 (250px)    Col 3 (flex: 1)        │
│  IDENTIFICATION   SISMIQUE         GÉOMÉTRIE ET MASSES     │
│  Nom, ingénieur   Wilaya, commune  Stories table           │
│  référence, date  zone, site       (N, H, W)              │
│                   groupe, QF/R     Poids total, hn         │
│                                                            │
│  Each column: overflow-y: auto (independent scroll)        │
├────────────────────────────────────────────────────────────┤
│ ROW 2 — Results (flex: 1, full width)                      │
│                                                            │
│  4 — RÉSULTATS ANALYSE DYNAMIQUE                           │
│  Left (320px): Tx/Ty/Vxd/Vyd 2×2 grid + status checklist  │
│  Right (flex: 1): drx/dry displacements table (scrollable) │
└────────────────────────────────────────────────────────────┘
```

### 4.4 Color Tokens (Tailwind v4)

Colors are defined in `frontend/src/styles/globals.css` using CSS custom properties
within a `@theme` block. Component-level colors use `frontend/src/theme.ts` which
exports `DARK` and `LIGHT` constants and a `getColors()` helper.

**No zoom: properties anywhere in the codebase.** Use proper font-size and padding.

### 4.5 Sidebar Navigation Structure

```
GÉNÉRAL
  ├── Projets
  └── Paramètres généraux

SISMIQUE — RPA 2024
  ├── Spectre de réponse          ← standalone page (SpectrumChart.tsx)
  ├── Combinaisons                ← standalone page (CombinationsPage.tsx) — NEW
  └── Vérification sismique       ← tabbed page (SeismicVerificationPage.tsx) — NEW
        ├── tab: Effort V            (base shear V + 80% check)
        ├── tab: Déplacements        (Dk + inter-story drift limits)
        ├── tab: P-Δ                 (θk stability check)
        └── tab: Renversement        (overturning + sliding)

FERRAILLAGE BA
  ├── Poutres — CBA93             BIENTÔT
  ├── Poteaux — CBA93             BIENTÔT
  └── Voiles — CBA93              BIENTÔT

CONNEXION
  ├── Robot Structural            BIENTÔT
  └── ETABS                       BIENTÔT
```

### 4.6 Vérification Sismique — Tabbed Page Layout

The "Vérification sismique" page uses horizontal tabs within the fixed viewport.
Each tab fills the same content area. No page scrolling — only local scroll
where needed (e.g., drift table or P-Δ table for many stories).

**Tab 1 — Effort V** (simplified from current BaseShearPage):
- Base shear: V = λ·Sad(T₀)·W, Ft, λ logic, T₀ capping
- 80% check: Vt ≥ 0.8·V, majoration coefficient
- Robot export button (kept)
- **REMOVED**: per-story force distribution (Fk) table and bar charts

**Tab 2 — Déplacements** (§4.5.2 + §5.10):
- Compute δk = (R / QF) × δek at each level (Eq 4.15)  ← R/QF not R×QF
- Relative displacement Δk = δk − δk-1 (Eq 4.16)
- Drift check: Δk vs Table 5.2 limits (non-effondrement + limitation de dommages)
- Status per story: ✅/❌

**Tab 3 — P-Δ** (§5.9):
- θk = (Pk × Δk) / (Vk × hk) at each level (Eq 5.9)
- Pk = cumulative weight above level k (Eq 5.10)
- Verdict: θk < 0.10 → OK, 0.10–0.20 → amplify by 1/(1−θk), > 0.20 → unstable
- Status per story: ✅/⚠️/❌

**Tab 4 — Renversement** (§5.5):
- M_renversement = Σ(Fi × hi) from lateral forces
- M_stabilisant from vertical loads × building half-width
- Coefficient: M_stab / M_renvers ≥ 1.3 (overturning)
- Sliding check: coefficient ≥ 1.25 (if applicable)

### 4.7 Bridge Architecture — Data Input Adapter

The Robot/ETABS bridge does NOT change the verification pipeline. It is purely
a data input adapter that fills the same store fields the engineer would fill manually:

```
Manual input  ─┐
                ├──→ Same Zustand stores ──→ Same calc_engine ──→ Same results
Robot bridge  ─┘
```

All verification modules work identically regardless of data source.
The bridge is a future module — all MVP verifications work with manual input.

---

## 5. TECH STACK

| Layer          | Technology                                       |
|----------------|--------------------------------------------------|
| Frontend       | React 18, TypeScript, Vite, Zustand, Tailwind v4 |
| Styling        | Tailwind CSS v4 + theme.ts color constants        |
| Backend        | Python FastAPI, Pydantic                          |
| Database       | PostgreSQL 18, SQLAlchemy 2.0, asyncpg, Alembic   |
| Auth           | JWT (access + refresh tokens), bcrypt==4.0.1       |
| Engine         | Pure Python (no framework dependencies)            |
| Desktop Bridge | Python agent (local HTTP API) — future             |
| Testing        | pytest (engine + backend), vitest (frontend)       |

---

## 6. PROJECT STRUCTURE

```
bunyan/                                    # Project root
├── CLAUDE.md                              # This file
├── README.md
├── .gitignore
├── pyproject.toml
├── requirements.txt
│
├── calc_engine/                           # ALL engineering logic
│   ├── __init__.py
│   ├── seismic/
│   │   └── rpa2024/
│   │       ├── __init__.py
│   │       ├── parameters.py
│   │       ├── spectrum.py              # Elastic spectrum Sae/g
│   │       ├── design_spectrum.py       # Sad (Eq 3.15) + Svd (Eq 3.16)
│   │       ├── base_shear.py            # V = λ·Sad·W (Eq 3.1)
│   │       ├── annex_a.py              # Wilaya/commune/zone — SINGLE SOURCE
│   │       ├── combinations.py          # Seismic load combinations (Eqs 5.1-5.4) — NEW
│   │       ├── displacements.py         # Dk, Δk, drift check (Eqs 4.15-4.16, §5.10) — NEW
│   │       ├── p_delta.py               # θk stability check (Eq 5.9) — NEW
│   │       └── overturning.py           # Renversement + glissement (§5.5) — NEW
│   ├── rc_design/                        # Future: CBA93, BAEL91, EC2
│   │   └── __init__.py
│   └── core/                             # Future: Unified Structural Model
│       └── __init__.py
│
├── backend/
│   ├── main.py                           # FastAPI app entry (CORS configured)
│   ├── config.py                         # Pydantic BaseSettings (env vars)
│   ├── database.py                       # Async SQLAlchemy 2.0 + asyncpg
│   ├── dependencies.py                   # get_db dependency
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py                # Central router
│   │       └── endpoints/
│   │           ├── spectrum.py
│   │           ├── base_shear.py
│   │           ├── annex_a.py           # Serve wilaya/commune/zone data
│   │           ├── combinations.py      # Seismic load combinations — NEW
│   │           ├── verifications.py     # Displacements, P-Δ, overturning — NEW
│   │           ├── auth.py              # Register, login, refresh, me
│   │           └── projects.py          # CRUD, JSONB state persistence
│   ├── schemas/
│   │   ├── seismic.py
│   │   ├── annex_a.py
│   │   ├── auth.py
│   │   ├── project.py
│   │   ├── verifications.py     # Displacements, P-Δ, overturning I/O schemas — NEW
│   │   └── common.py
│   ├── models/
│   │   ├── user.py                      # SQLAlchemy User model
│   │   └── project.py                   # SQLAlchemy Project model (JSONB state)
│   └── services/
│       └── auth.py                      # JWT creation, password hashing
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts                    # Proxy /api → localhost:8000
│   ├── postcss.config.js                 # @tailwindcss/postcss plugin
│   ├── index.html                        # Anti-flash <script>, entry: main.tsx
│   └── src/
│       ├── App.tsx                       # Auth gate only (~29 lines)
│       ├── main.tsx                      # Imports globals.css, renders App
│       ├── theme.ts                      # DARK/LIGHT color constants + getColors()
│       ├── types/
│       │   ├── project.ts               # Story, GlobalParams
│       │   ├── seismic.ts               # Spectrum/BaseShear request/result types
│       │   ├── ui.ts                    # AppColors, ThemeMode, ModalBaseProps
│       │   ├── auth.ts                  # User, AuthResponse types
│       │   ├── persistence.ts           # ProjectState, saved/loaded shapes
│       │   └── index.ts                 # Barrel export
│       ├── stores/
│       │   ├── projectStore.ts          # Wilaya, commune, zone, site, group, project CRUD
│       │   ├── seismicStore.ts          # QF, R, periods, base shear, bracing, twoDir
│       │   ├── structuralStore.ts       # stories[] with CRUD actions
│       │   ├── authStore.ts             # JWT tokens, user, login/logout/refresh
│       │   ├── uiStore.ts              # Theme (dark/light), sidebar, activePage
│       │   └── index.ts                 # Barrel export
│       ├── services/
│       │   └── api.ts                   # Typed fetch + AbortController + 401→refresh→retry
│       ├── styles/
│       │   └── globals.css              # @import "tailwindcss", @theme block, dark mode
│       └── components/
│           ├── auth/
│           │   └── LoginPage.tsx         # Full-page login (outside Layout)
│           ├── layout/
│           │   ├── Layout.tsx            # Fixed viewport: 100vh × 100vw overflow-hidden
│           │   ├── Topbar.tsx            # 48px: logo, project name, save, theme, user
│           │   └── Sidebar.tsx           # Nav groups, BIENTÔT tags, logout, theme toggle
│           ├── shared/
│           │   ├── QFModal.tsx           # Quality factor modal (controlled component)
│           │   └── RModal.tsx            # Behavior factor modal (controlled component)
│           ├── general/
│           │   ├── ProjectParams.tsx     # Two-row layout (3 input cols + results row)
│           │   └── ProjectList.tsx       # Project selection / create new
│           └── seismic/
│               ├── SpectrumChart.tsx     # Sad + Svd charts, X/Y directions, .txt export
│               ├── CombinationsPage.tsx  # Seismic load combinations (standalone page)
│               ├── SeismicVerificationPage.tsx  # Tabbed: Effort V, Déplacements, P-Δ, Renversement
│               └── BaseShearPage.tsx     # V, 80% check, majoration (tab inside verification page)
│
├── tests/
│   ├── engine/
│   │   └── seismic/
│   │       ├── test_spectrum.py          # 23 tests
│   │       ├── test_base_shear.py
│   │       └── test_annex_a.py           # 29 tests
│   └── backend/
│       ├── test_auth.py                  # 9 tests
│       └── test_projects.py              # 10 tests + 2 new in Phase 6
│
├── alembic/                               # Database migrations
│   ├── alembic.ini
│   └── versions/                          # users + projects tables
│
└── bridge/                               # Future: desktop bridge agent
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
- Use Pydantic BaseSettings for configuration (`backend/config.py`)
- RESTful with versioning: `/api/v1/`
- Auth: JWT stateless, 401→refresh→retry handled by frontend
- Project persistence: normalized metadata + JSONB state column (opaque blob)

### Frontend (`frontend/src/`)

- ALL files are TypeScript (.tsx / .ts) — no .jsx / .js in src/
- Shared types in `frontend/src/types/`
- State management via Zustand stores in `frontend/src/stores/`
- API calls via `frontend/src/services/api.ts` — never raw fetch in components
- API base URL: relative `/api/v1` through Vite proxy (no hardcoded localhost)
- Components read from stores, not prop drilling from App.tsx
- Modals are controlled components (receive props, don't couple to stores)
- Color constants in `theme.ts`, CSS tokens in `globals.css`
- All user-facing text: French
- All code, comments, variable names: English

### Tests (`tests/`)

- Mirror the source structure: `tests/engine/seismic/test_spectrum.py`
- Every engine function MUST have tests
- Test names: `test_<function>_<scenario>`
- Use pytest parametrize for multiple input cases
- No calculation module is complete without passing tests
- Backend tests use isolated per-test async engines (Windows-compatible)
- Total: 73 tests passing (52 engine + 21 backend)

---

## 8. ZUSTAND STORE ARCHITECTURE

### Store Layout (5 stores)

| Store | Fields | Responsibility |
|-------|--------|---------------|
| `projectStore` | wilayaCode, commune, zone, site, group, wilayas[], communes[], currentProjectId, projects[], metadata | Location, site classification, project CRUD, persistence |
| `seismicStore` | twoDir, QF/R params, frameSys, Tx, Ty, Vxd, Vyd, + 12 more | QF/R parameters, bracing system, periods, base shear results |
| `structuralStore` | stories[], 5 actions | Building stories with elevation, weight, drift ratios |
| `authStore` | user, accessToken, refreshToken, isAuthenticated, login/logout/refresh | JWT authentication, token management |
| `uiStore` | theme, sidebarOpen, activePage | Theme (dark/light with localStorage), sidebar state, navigation |

### Patterns

- **Generic setter**: `seismicStore.setField<K>(key, value)` for individual field updates
- **Batch setter**: `setQFParams(partial)`, `setRParams(partial)` for related field groups
- **Modals**: Use Option B — controlled components receiving data via props from parent
- **Components**: Import stores directly, no props drilling through App.tsx
- **Expand existing stores** — don't create new stores unless strong architectural reason

### Component → Store Mapping

| Component | Reads from |
|-----------|-----------|
| App.tsx | authStore (isAuthenticated) |
| Layout.tsx | uiStore (sidebarOpen, activePage) |
| Topbar.tsx | projectStore + authStore + uiStore |
| Sidebar.tsx | uiStore + authStore |
| ProjectParams | projectStore + seismicStore + structuralStore |
| SpectrumChart | projectStore + seismicStore |
| BaseShearPage | projectStore + seismicStore + structuralStore |
| ProjectList | projectStore + authStore |
| LoginPage | authStore |
| QFModal | props from parent (controlled) |
| RModal | props from parent (controlled) |

---

## 9. AUTH & DATABASE

### Authentication

- JWT-based: access token (short-lived) + refresh token (long-lived)
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- Password hashing: `passlib` + `bcrypt==4.0.1` (pinned for compatibility)
- Frontend: `authStore` manages tokens, `api.ts` handles 401→refresh→retry
- Each user can only access their own projects

### Database

- PostgreSQL 18 (local: `bunyan` database, user `postgres`, port 5432)
- Connection: `postgresql+asyncpg://postgres:postgres@localhost:5432/bunyan`
- Async SQLAlchemy 2.0 + asyncpg
- Alembic for migrations
- Tables: `users`, `projects`

### Project Persistence (Hybrid Model)

- **Normalized columns**: id, name, user_id, created_at, updated_at
- **JSONB state column**: opaque blob containing all engineering state
- JSONB scope (persisted): wilayaCode, commune, zone, site, group, seismic parameters, stories[]
- Runtime-only (NOT persisted): reference data arrays (wilayas[], communes[]), loading flags, navigation state
- loadProject cycle: reset stores → hydrate from JSONB → re-derive computed values

---

## 10. LANGUAGE RULES

- **Application interface**: French (for Algerian engineers)
- **Code, comments, variables, git commits**: English
- **Engineering terms**: may appear in French when referencing code clauses
  (e.g., RPA 2024 equation names, DTR references)
- **Development discussions**: English

---

## 11. GIT CONVENTIONS

- Branch naming: `feature/<module>`, `fix/<issue>`, `refactor/<scope>`
- Commit messages: imperative mood, reference the module
  - `Add annex_a.py with commune-to-zone mapping`
  - `Refactor SpectrumChart to use seismic store`
- Atomic commits: one logical change per commit
- Always run tests before committing
- `main` branch is always deployable — never push broken code to main

### Branch Workflow (Production)

```
main ────── always deployable, auto-deploys to production
  │
  ├── feature/seismic-combinations  ← build here
  ├── fix/auth-flow                 ← bug fixes here
  └── feature/cba93-beams           ← future modules here
```

Work on feature branches. Test locally. Merge to main when ready.

---

## 12. DATA VALIDATION & ERROR HANDLING

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
- Auth token expiry (401→refresh→retry)

Errors must be descriptive, logged, and user-friendly (in French).

---

## 13. SECURITY

- JWT-based authentication (access + refresh tokens)
- Each user can only access their own projects
- CORS configured for allowed origins
- Secure communication between bridge and backend (local token or key)
- Environment variables for secrets (DATABASE_URL, JWT_SECRET, etc.)
- Never commit credentials — use `.env` files

---

## 14. ENGINEERING FORMULAS — WORKING RULES

1. **Observations before code** — present all findings and observations first
2. **If a formula is uncertain → ASK before coding** — never guess
3. **Include equation reference** as a comment at the point of use
4. **Include formula module reference** at the top of each file
5. **Cross-reference** with RPA 2024 (DTR BC 2.48) uploaded source documents
6. **Always check uploaded project files** before implementing any formula

---

## 15. CURRENT STATE

### All Foundation Phases Complete

- ✅ **Phase 1**: Project restructure, CLAUDE.md, annex_a.py, central router, config
- ✅ **Phase 2**: Full TypeScript migration (0 tsc errors, all .tsx)
- ✅ **Phase 3**: Zustand stores (4→5 stores), App.tsx thin shell
- ✅ **Phase 4**: Data deduplication — single source of truth (annex_a.py → API → frontend)
- ✅ **Phase 5**: PostgreSQL + JWT auth (async SQLAlchemy, Alembic, project CRUD)
- ✅ **Phase 6**: UI structural fix (fixed viewport, Tailwind v4, two-row layout, branding, dark mode)

### Completed Engineering Modules

- ✅ **Elastic spectrum** Sae/g — `spectrum.py`
- ✅ **Design spectrum** Sad Eq 3.15 + Svd Eq 3.16 — `design_spectrum.py`
- ✅ **Base shear** V = λ·Sad·W Eq 3.1 — `base_shear.py`
- ✅ **Annex A** — 58 wilayas, 35 split wilayas, commune-level zones — `annex_a.py`
- ✅ **FastAPI endpoints** — spectrum, base_shear, annex_a, auth, projects, verifications (disp/p-delta/overturning)
- ✅ **React pages** — ProjectParams, SpectrumChart, BaseShearPage, ProjectList, LoginPage
- ✅ **221 passing tests** (142 engine + 46 backend + verification + deployment tests)
- ✅ **Data model extended** — Story.dek_x/dek_y, projectStore: structureType, nonStructuralType, lx, ly, mu

### Verified Annex A Corrections

- 35 split wilayas (not 25) with commune-level zone overrides
- El Bayadh: default zone II, four communes at zone I
- Jijel commune: "Erraguene" (corrected from "El Taguene")
- 11 wilaya default zones corrected
- 6 wrong zone values fixed across wilayas 20, 24, 25, 28, 29, 31

### Known Issues (Pre-Deploy Fixes)

- Auth flow: app hangs on "Chargement..." on first load, skips login on refresh
- Correct flow should be: Login → Projects list → ProjectParams
- Default activePage should be 'projects' (not 'params') after login
- BaseShearPage: remove per-story Fk distribution table and bar charts (keep base shear + 80% check)

### MVP Scope (Pre-First-Deploy)

1. ✅ Fix auth flow (login → projects → params)
2. ✅ Simplify BaseShearPage (remove Fk table + bar charts, keep Robot export)
3. ✅ Seismic combinations module — §5.2 (standalone page)
4. ✅ Backend: displacement engine §4.5.2 + §5.10 — `displacements.py` + endpoint
5. ✅ Backend: P-Δ engine §5.9 — `p_delta.py` + endpoint
6. ✅ Backend: overturning engine §5.5 — `overturning.py` + endpoint
7. ⬜ Frontend: SeismicVerificationPage with 4 tabs (Effort V, Déplacements, P-Δ, Renversement)
8. ✅ Deploy to production — Dockerfile + railway.toml + scripts/start.sh

### Future Modules (Post-Deploy)

- ⏳ Joints sismiques — §5.8 (deferred, not needed for MVP)
- ⏳ RC design — CBA93 (Beams → Columns → Walls → Foundations)
- ⏳ RC design — BAEL91
- ⏳ RC design — Eurocode 2
- ⏳ Desktop bridge (Robot first, then ETABS) — data input adapter only
- ⏳ Report generation (PDF, Word)
- ⏳ Verification dashboard

---

## 16. KEY FORMULAS

### Implemented
- `Sad(T)/g` — Eq 3.15 (4 branches + floor 0.2·A·I)
- `Svd(T)/g` — Eq 3.16 (alpha exponent, R=1.5 fixed)
- `QF = 1 + ΣPq` — capped per category
- `V = λ · Sad(T₀)/g · W` — where λ=0.85 if T₀≤2T₂ AND n>2, else 1.0
- `Ft = 0.07·T₀·V` — (max 0.25V) if T₀ > 0.7s
- `T_emp = CT · hₙ^0.75`
- `T₀ = min(T_calc, 1.3·T_emp)`
- 80% check: `Vt ≥ 0.8·V`, majoration coeff = 0.8·V/Vt

### To Implement (MVP)
- **Combinations (§5.2)**: `G + ψQ ± E`, `E1 = ±Ex ± 0.3Ey`, `E2 = ±0.3Ex ± Ey`
  Vertical component Ez added if `Av·I·g > 0.25g` → E3, E4, E5 (up to 24 combos)
- **Displacements (§4.5.2)**: `δk = (R / QF) × δek` (Eq 4.15), `Δk = δk − δk-1` (Eq 4.16)  ← R/QF not R×QF
- **Drift check (§5.10)**: `Δk < limits` from Table 5.2 (non-effondrement + limitation de dommages)
- **P-Δ (§5.9)**: `θk = (Pk × Δk) / (Vk × hk)` (Eq 5.9), `Pk = Σ(Gi + ψQi)` for i≥k (Eq 5.10)
  θk < 0.10 → OK; 0.10–0.20 → amplify by 1/(1−θk); > 0.20 → unstable
- **Overturning (§5.5)**: `M_stab / M_renvers ≥ 1.3`, sliding coefficient ≥ 1.25

---

## 17. DEPLOYMENT STRATEGY

### Ship Early, Iterate in Production

The project follows a "deploy MVP, then iterate" approach:

1. **MVP**: Complete RPA 2024 seismic verification (all Chapter 4+5 checks) → deploy
2. **Iterate**: Use the live app, collect feedback, fix bugs
3. **Expand**: Add RC modules (CBA93/BAEL91/EC2) and Robot bridge as live updates

### Deployment Target: Railway

- **Single service**: FastAPI serves both the API and the Vite-built frontend
- Backend: uvicorn (1 worker, `--host 0.0.0.0 --port $PORT`)
- Frontend: `npm run build` in Docker Stage 1 → `frontend/dist/` served as static files
- Database: Railway-managed PostgreSQL (URL normalized automatically from `postgres://`)
- Migrations: `alembic upgrade head` runs inside `scripts/start.sh` before uvicorn
- Auto-deploy: push to `main` → Railway rebuilds and deploys

### Pre-Deployment Checklist

- [ ] Auth flow working correctly (login → projects → params)
- [ ] BaseShearPage simplified (Fk table + bar charts removed)
- [ ] Seismic combinations page complete (§5.2)
- [ ] Displacement + drift check tab complete (§4.5.2 + §5.10)
- [ ] P-Δ tab complete (§5.9)
- [ ] Overturning tab complete (§5.5)
- [ ] SeismicVerificationPage with 4 tabs working
- [x] CORS configured for production domain (env var `CORS_ORIGINS`)
- [x] Environment variables for all secrets (see Railway section below)
- [x] Alembic migrations run on production DB (via `scripts/start.sh`)
- [x] Build succeeds (`npm run build` + backend starts)
- [x] Dockerfile multi-stage build (frontend → backend+dist)
- [x] `railway.toml` configured with health check + restart policy

### Railway Deployment

**Architecture:** Single service — FastAPI serves API + static frontend from `frontend/dist/`.

**Startup chain:**
```
Docker build:
  Stage 1 (node:20-alpine): npm ci → npm run build → frontend/dist/
  Stage 2 (python:3.12-slim): pip install → copy code + dist

Container start (scripts/start.sh):
  1. alembic upgrade head   ← creates/migrates tables, exits on failure
  2. uvicorn backend.main:app --host 0.0.0.0 --port $PORT

Request routing:
  /api/v1/*    → FastAPI routers (auth, projects, spectrum, etc.)
  /api/health  → health check
  /assets/*    → frontend/dist/assets/ (JS, CSS, images)
  /*           → frontend/dist/index.html (SPA fallback)
```

**Environment Variables (set in Railway dashboard):**
- `DATABASE_URL` — auto-linked from Railway PostgreSQL plugin (`postgres://...`, normalized automatically)
- `JWT_SECRET_KEY` — generate with `openssl rand -hex 32`
- `CORS_ORIGINS` — `https://YOUR-APP.up.railway.app` (comma-separated if multiple)
- `ENVIRONMENT` — `production`

---

## 18. PROGRESSIVE DEVELOPMENT STRATEGY

### Design Code Order

1. **RPA 2024** (DTR BC 2.48) — Seismic *(MVP — in progress)*
2. **CBA93** — RC design (Algerian code)
3. **BAEL91** — RC design (French code)
4. **Eurocode 2** — RC design (European code)

### Software Integration Order

1. Robot Structural Analysis
2. ETABS

### Future Scalability

The system must support adding without refactoring core components:
- Additional structural software
- Additional design codes
- Additional materials (steel, composite)

New modules must plug into the existing architecture cleanly.

---

## 19. COMMON PATTERNS

### Adding a New Engine Module

1. Create `calc_engine/<domain>/<code>/<module>.py`
2. Write pure functions with type hints, docstrings, and equation references
3. Add tests in `tests/engine/<domain>/test_<module>.py`
4. Run tests: `pytest tests/engine/ -v`
5. Verify against uploaded source documents

### Adding a New API Endpoint

1. Create endpoint in `backend/api/v1/endpoints/<n>.py`
2. Define schemas in `backend/schemas/<n>.py`
3. Import engine functions — NO formula logic in the endpoint
4. Register router in `backend/api/v1/router.py`

### Adding a New React Page

1. Create component in `frontend/src/components/<domain>/`
2. Use Zustand store for state — import stores directly
3. Use `api.ts` service for backend calls (relative `/api/v1` URLs)
4. Respect fixed viewport layout — no full-page scrolling
5. Use `theme.ts` colors via `getColors()` helper
6. All user-facing text in French, all code in English

---

## 20. DESIGN SUGGESTIONS (FUTURE)

When elements fail verification, the system may suggest corrections:

- **Beam**: increase reinforcement, increase section depth, adjust stirrup spacing
- **Column**: increase reinforcement, increase section size, increase concrete strength

**The system must NEVER automatically modify the structural model.**

---

## 21. REPORT GENERATION (FUTURE)

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

## 22. SUPPORTED SOFTWARE APIs (FUTURE)

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
