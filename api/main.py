"""
StructCalc — FastAPI Application Entry Point
=============================================
Main web application server.

Architecture:
    Routes call the Engineering Core via service functions.
    Engineering Core is NEVER imported directly inside routes.
    All data in/out goes through Pydantic schemas.

Run with:
    uvicorn api.main:app --reload

Author: StructCalc
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Route modules (to be created in next sessions)
# from api.routes import projects, seismic, design, reports

app = FastAPI(
    title="StructCalc API",
    description=(
        "Plateforme de calcul de structures selon RPA 2024, CBA93, BAEL91 et Eurocode 2. "
        "Conçue pour les ingénieurs structure algériens."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],   # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """API health check."""
    return {
        "status": "ok",
        "app": "StructCalc",
        "version": "0.1.0",
        "message": "Bienvenue sur StructCalc — Calcul de structures selon RPA 2024",
    }


@app.get("/health", tags=["Health"])
def health():
    """Detailed health status."""
    return {
        "status": "ok",
        "modules": {
            "rpa2024_spectrum": "ready",
            "base_shear":       "ready",
            "cba93":            "in_development",
            "robot_bridge":     "in_development",
            "etabs_bridge":     "planned",
        }
    }


# ── Seismic routes (stub — will be expanded next session) ─────────────────────

@app.post("/api/seismic/spectrum", tags=["Seismic — RPA 2024"])
def compute_spectrum_endpoint(payload: dict):
    """
    Computes RPA 2024 elastic response spectrum.

    Expected payload:
    {
        "zone": "VI",
        "site_class": "S2",
        "importance_group": "2",
        "xi_percent": 5.0
    }

    NOTE: This is a stub. Full Pydantic schema + service layer
    will be implemented in the next session.
    """
    # TODO: Replace with proper schema + service call
    from calculation_engine.seismic.rpa2024.parameters import (
        SeismicZone, SiteClass, ImportanceGroup
    )
    from calculation_engine.seismic.rpa2024.spectrum import (
        SpectrumInput, compute_spectrum
    )

    zone_map = {
        "I": SeismicZone.ZONE_I, "II": SeismicZone.ZONE_II,
        "III": SeismicZone.ZONE_III, "IV": SeismicZone.ZONE_IV,
        "V": SeismicZone.ZONE_V, "VI": SeismicZone.ZONE_VI,
    }
    site_map = {
        "S1": SiteClass.S1, "S2": SiteClass.S2,
        "S3": SiteClass.S3, "S4": SiteClass.S4,
    }
    group_map = {
        "1A": ImportanceGroup.GROUP_1A, "1B": ImportanceGroup.GROUP_1B,
        "2": ImportanceGroup.GROUP_2, "3": ImportanceGroup.GROUP_3,
    }

    inp = SpectrumInput(
        zone=zone_map[payload.get("zone", "IV")],
        site_class=site_map[payload.get("site_class", "S2")],
        importance_group=group_map[payload.get("importance_group", "2")],
        xi_percent=payload.get("xi_percent", 5.0),
    )

    result = compute_spectrum(inp)

    return {
        "A": result.A,
        "I": result.I,
        "S": result.S,
        "eta": result.eta,
        "T1": result.T1,
        "T2": result.T2,
        "T3": result.T3,
        "peak_Sa_g": result.peak_Sa_g,
        "spectrum_type": result.spectrum_type.value,
        "points": [{"T": p.T, "Sa_g": p.Sa_g} for p in result.points],
    }
