"""
Bunyan - FastAPI Backend Entry Point
====================================
Run from the project root with:

    uvicorn backend.main:app --reload --port 8000

Then visit:
    http://localhost:8000/docs       <- Swagger UI (interactive API docs)
    http://localhost:8000/redoc      <- ReDoc documentation
    http://localhost:8000/api/v1/... <- API endpoints

Architecture:
    React (port 5173) <-> FastAPI (port 8000) <-> Engineering Core (Python)

CORS is configured via backend/config.py (reads from .env if present).
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.v1.router import api_router
from backend.config import settings
from backend.database import dispose_engine


# =============================================================================
# LIFESPAN - startup / shutdown
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup - nothing to do yet (engine connects lazily)
    yield
    # shutdown - release connection pool
    await dispose_engine()


# =============================================================================
# APPLICATION
# =============================================================================

app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    description=(
        "Calcul sismique et ferraillage BA selon RPA 2024, CBA93, BAEL91.\n\n"
        "Backend Python pour Bunyan - plateforme de verification structurale algerienne."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# =============================================================================
# CORS - Allow React dev server to call this API
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# ROUTERS
# =============================================================================

app.include_router(
    api_router,
    prefix=settings.api_v1_prefix,
)


# =============================================================================
# HEALTH CHECK
# =============================================================================


@app.get("/health", tags=["Health"])
def health():
    """Detailed health check."""
    return {
        "status": "ok",
        "modules": {
            "spectrum": "active",
            "base_shear": "active",
            "annex_a": "active",
            "combinations": "pending",
        },
    }


@app.get("/api/health", tags=["Health"])
def api_health():
    """Production health check for Railway / uptime monitors."""
    return {"status": "ok", "version": "1.0.0"}


# =============================================================================
# STATIC FILES - serve the frontend build in production
# Must be registered AFTER all API routes so the catch-all doesn't intercept them.
# =============================================================================

frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    @app.get("/", include_in_schema=False)
    async def serve_root():
        """Serve the SPA entrypoint at the site root."""
        return FileResponse(frontend_dist / "index.html")


    app.mount(
        "/assets",
        StaticFiles(directory=frontend_dist / "assets"),
        name="assets",
    )


    @app.get("/{path:path}", include_in_schema=False)
    async def spa_fallback(path: str):
        """SPA fallback - serve index.html for any non-API route."""
        file_path = frontend_dist / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", tags=["Health"])
    def root():
        """Health check - confirms the backend is running."""
        return {
            "status": "ok",
            "app": settings.app_name,
            "version": "0.1.0",
            "docs": "/docs",
        }
