"""
StructCalc — FastAPI Backend Entry Point
=========================================
Run from the project root (structcalc/) with:

    uvicorn backend.main:app --reload --port 8000

Then visit:
    http://localhost:8000/docs       ← Swagger UI (interactive API docs)
    http://localhost:8000/redoc      ← ReDoc documentation
    http://localhost:8000/api/v1/... ← API endpoints

Architecture:
    React (port 5173) ←→ FastAPI (port 8000) ←→ Engineering Core (Python)

CORS is configured to allow the React dev server (localhost:5173).
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.v1.router import v1_router


# =============================================================================
# APPLICATION
# =============================================================================

app = FastAPI(
    title       = "StructCalc API",
    description = (
        "Calcul sismique et ferraillage BA selon RPA 2024, CBA93, BAEL91.\n\n"
        "Backend Python pour l'application StructCalc — ingénierie structurale algérienne."
    ),
    version     = "0.1.0",
    docs_url    = "/docs",
    redoc_url   = "/redoc",
)


# =============================================================================
# CORS — Allow React dev server to call this API
# =============================================================================
# In production, replace these origins with your deployed frontend URL.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3004",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3004",
    ],
    allow_credentials = True,
    allow_methods     = ["GET", "POST", "OPTIONS"],
    allow_headers     = ["Content-Type", "Authorization"],
)


# =============================================================================
# ROUTERS
# =============================================================================

app.include_router(
    v1_router,
    prefix = "/api/v1",
)


# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/", tags=["Health"])
def root():
    """Health check — confirms the backend is running."""
    return {
        "status"  : "ok",
        "app"     : "StructCalc API",
        "version" : "0.1.0",
        "docs"    : "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    """Detailed health check — used by the frontend bridge status indicator."""
    return {
        "status"  : "ok",
        "modules" : {
            "spectrum"    : "active",     # RPA 2024 Eq.3.15 + Eq.3.16
            "base_shear"  : "pending",    # Session 7
            "combinations": "pending",    # Session 8
        },
    }
