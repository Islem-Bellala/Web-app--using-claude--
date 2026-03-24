"""
Bunyan — API v1 Central Router
================================
Aggregates all v1 endpoint routers.

Endpoints:
    POST /api/v1/spectrum                       — RPA 2024 design spectra
    POST /api/v1/base_shear                     — Static equivalent method
    GET  /api/v1/wilayas                        — All 58 wilayas (Annex A)
    GET  /api/v1/wilayas/{code}/communes        — Split-zone commune data
    GET  /api/v1/zone                           — Zone lookup by wilaya/commune
"""

from fastapi import APIRouter

from backend.api.v1.endpoints.spectrum   import router as spectrum_router
from backend.api.v1.endpoints.base_shear import router as base_shear_router
from backend.api.v1.endpoints.annex_a   import router as annex_a_router

api_router = APIRouter()
v1_router  = api_router  # backward-compatible alias

api_router.include_router(spectrum_router,   prefix="", tags=["Sismique — RPA 2024"])
api_router.include_router(base_shear_router, prefix="", tags=["Sismique — RPA 2024"])
api_router.include_router(annex_a_router,    prefix="", tags=["Annexe A — Zones"])
