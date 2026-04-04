"""
Bunyan — API v1 Central Router
================================
Aggregates all v1 endpoint routers.

Endpoints:
    POST /api/v1/spectrum                       — RPA 2024 design spectra
    POST /api/v1/base_shear                     — Static equivalent method
    POST /api/v1/combinations                   — Seismic load combinations §5.2
    POST /api/v1/verifications/displacements    — Displacement check §4.5.2 + §5.10
    POST /api/v1/verifications/p-delta          — P-Δ stability check §5.9
    POST /api/v1/verifications/overturning      — Overturning & sliding check §5.5
    GET  /api/v1/wilayas                        — All 58 wilayas (Annex A)
    GET  /api/v1/wilayas/{code}/communes        — Split-zone commune data
    GET  /api/v1/zone                           — Zone lookup by wilaya/commune
    POST /api/v1/auth/register                  — Register new user
    POST /api/v1/auth/login                     — Login
    POST /api/v1/auth/refresh                   — Rotate tokens
    GET  /api/v1/auth/me                        — Current user info
    POST /api/v1/projects                       — Create project
    GET  /api/v1/projects                       — List user's projects
    GET  /api/v1/projects/{id}                  — Get project (with state)
    PUT  /api/v1/projects/{id}                  — Update metadata
    PUT  /api/v1/projects/{id}/state            — Save engineering state
    DELETE /api/v1/projects/{id}               — Delete project
"""

from fastapi import APIRouter

from backend.api.v1.endpoints.spectrum      import router as spectrum_router
from backend.api.v1.endpoints.base_shear    import router as base_shear_router
from backend.api.v1.endpoints.combinations  import router as combinations_router
from backend.api.v1.endpoints.annex_a       import router as annex_a_router
from backend.api.v1.endpoints.auth          import router as auth_router
from backend.api.v1.endpoints.projects      import router as projects_router
from backend.api.v1.endpoints.verifications import router as verifications_router

api_router = APIRouter()
v1_router  = api_router  # backward-compatible alias

api_router.include_router(spectrum_router,      prefix="", tags=["Sismique — RPA 2024"])
api_router.include_router(base_shear_router,    prefix="", tags=["Sismique — RPA 2024"])
api_router.include_router(combinations_router,  prefix="", tags=["Sismique — RPA 2024"])
api_router.include_router(verifications_router, prefix="", tags=["Vérifications — RPA 2024"])
api_router.include_router(annex_a_router,       prefix="", tags=["Annexe A — Zones"])
api_router.include_router(auth_router,          prefix="")
api_router.include_router(projects_router,      prefix="")
