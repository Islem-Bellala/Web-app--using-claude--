"""
StructCalc — API v1 Router
===========================
Aggregates all v1 endpoints.

Current endpoints:
    POST /api/v1/spectrum     — RPA 2024 design spectra (Session 6)
    POST /api/v1/base_shear   — Static equivalent method (Session 7)

Planned:
    POST /api/v1/combinations — Session 8
"""

from fastapi import APIRouter

from backend.api.v1.endpoints.spectrum   import router as spectrum_router
from backend.api.v1.endpoints.base_shear import router as base_shear_router

v1_router = APIRouter()

v1_router.include_router(spectrum_router,   prefix="", tags=["Sismique — RPA 2024"])
v1_router.include_router(base_shear_router, prefix="", tags=["Sismique — RPA 2024"])
