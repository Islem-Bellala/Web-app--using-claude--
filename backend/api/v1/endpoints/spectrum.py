"""
StructCalc — Spectrum API Endpoint
===================================
Exposes POST /api/v1/spectrum

This module is the translation layer between HTTP and the engineering core.
Its only responsibility is:
    1. Receive and validate the request (Pydantic handles this)
    2. Map schema fields → engineering input objects
    3. Call the engineering function
    4. Return the result as a Pydantic response model

Engineering Core Isolation Principle:
    No formulas here. This file calls the engine; it does not compute.

Typical call time: < 5ms  (local API, 401 spectrum points)
"""

from fastapi import APIRouter, HTTPException

from backend.schemas.spectrum_schema import (
    SpectrumRequest,
    SpectrumResponse,
    CurveOut,
    SpectrumPoint,
)
from calculation_engine.seismic.rpa2024.design_spectrum import (
    DesignSpectrumInput,
    compute_design_spectra,
)
from calculation_engine.seismic.rpa2024.parameters import (
    SeismicZone,
    SiteClass,
    ImportanceGroup,
)


router = APIRouter()


@router.post(
    "/spectrum",
    response_model=SpectrumResponse,
    summary="Calcul du spectre de réponse de calcul (RPA 2024)",
    description=(
        "Calcule les spectres de calcul horizontal Sad(T)/g (Éq.3.15) "
        "et vertical Svd(T)/g (Éq.3.16) selon RPA 2024 — DTR BC 2.48."
    ),
)
def compute_spectrum(req: SpectrumRequest) -> SpectrumResponse:
    """
    Computes RPA 2024 design response spectra from zone, site, and structural parameters.

    Called by the React frontend whenever seismic parameters change.
    Returns both horizontal and vertical spectra in one response.

    Raises:
        422  If Pydantic validation fails (handled automatically by FastAPI)
        500  If engineering computation fails unexpectedly (wrapped in try/except)
    """

    # ── Map Pydantic schema → engineering dataclass ───────────────────────────
    # This is the only place where string ↔ enum conversion happens.
    try:
        inp = DesignSpectrumInput(
            zone             = SeismicZone(req.zone),
            site_class       = SiteClass(req.site_class),
            importance_group = ImportanceGroup(req.importance_group),
            QF               = req.QF,
            R                = req.R,
            T_step           = req.T_step,
            T_start          = 0.0,
            T_end            = 4.0,
        )
    except (ValueError, KeyError) as exc:
        # Should never happen — Pydantic already validates zone/site/group literals
        raise HTTPException(
            status_code=422,
            detail=f"Paramètre invalide : {exc}",
        )

    # ── Call the engineering core ─────────────────────────────────────────────
    try:
        result = compute_design_spectra(inp)
    except Exception as exc:
        # Unexpected error in engineering computation — surface for debugging
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de calcul : {exc}",
        )

    # ── Map engineering result → Pydantic response ────────────────────────────
    # Convert SpectrumPoint dataclasses to Pydantic models
    def to_curve(curve) -> CurveOut:
        return CurveOut(
            T1    = curve.T1,
            T2    = curve.T2,
            T3    = curve.T3,
            peak  = curve.peak,
            floor = curve.floor,
            points=[
                SpectrumPoint(T=p.T, Sa_g=p.Sa_g)
                for p in curve.points
            ],
        )

    return SpectrumResponse(
        zone          = result.zone,
        spectrum_type = result.spectrum_type,
        A             = result.A,
        I             = result.I,
        S             = result.S,
        Av            = result.Av,
        QF            = result.QF,
        R             = result.R,
        horizontal    = to_curve(result.horizontal),
        vertical      = to_curve(result.vertical),
    )
