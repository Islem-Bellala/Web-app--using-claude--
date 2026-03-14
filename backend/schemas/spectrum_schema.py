"""
StructCalc — Pydantic Schemas for Spectrum API
===============================================
These models define the contract between the React frontend and the FastAPI backend.
They handle validation and serialisation — NOT engineering logic.

Rule:  No engineering formulas here. This layer translates JSON ↔ Python objects.

Code reference: FastAPI / Pydantic v2 patterns
"""

from typing import List, Literal
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# REQUEST MODEL
# =============================================================================

class SpectrumRequest(BaseModel):
    """
    Parameters sent by the React frontend to request a design spectrum computation.

    All engineering parameters are validated here before reaching the engine.
    The frontend sends zone as a string ("I", "II", ...) — Python converts to enum.
    """

    zone: Literal["I", "II", "III", "IV", "V", "VI"] = Field(
        ...,
        description="Seismic zone — RPA 2024 Annex A (I to VI, Zone 0 excluded)",
    )
    site_class: Literal["S1", "S2", "S3", "S4"] = Field(
        ...,
        description="Site classification — RPA 2024 Table 3.1",
    )
    importance_group: Literal["1A", "1B", "2", "3"] = Field(
        ...,
        description="Building importance group — RPA 2024 Table 3.11",
    )
    QF: float = Field(
        default=1.0,
        ge=1.0,
        le=1.5,
        description="Quality factor QF — RPA 2024 §3.8, Table 3.19 (1.0 ≤ QF ≤ 1.35)",
    )
    R: float = Field(
        default=3.5,
        ge=1.5,
        le=6.0,
        description="Behaviour coefficient R — RPA 2024 §3.5, Table 3.18",
    )
    T_step: float = Field(
        default=0.01,
        ge=0.005,
        le=0.1,
        description="Period step for spectrum computation (s) — 0.01 = 401 points (0 to 4s)",
    )

    @field_validator("R")
    @classmethod
    def r_must_be_valid(cls, v: float) -> float:
        # R must be one of the standard values from Table 3.18
        # We allow any float in range — exact values are engineer's responsibility
        if v <= 0:
            raise ValueError("Le coefficient de comportement R doit être positif.")
        return round(v, 4)

    @field_validator("QF")
    @classmethod
    def qf_must_be_valid(cls, v: float) -> float:
        if v < 1.0:
            raise ValueError("Le facteur de qualité QF ne peut pas être inférieur à 1.0.")
        return round(v, 4)

    class Config:
        json_schema_extra = {
            "example": {
                "zone": "VI",
                "site_class": "S2",
                "importance_group": "2",
                "QF": 1.15,
                "R": 4.5,
                "T_step": 0.01,
            }
        }


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class SpectrumPoint(BaseModel):
    """One point on a spectrum curve: period T and spectral acceleration Sa/g."""
    T:    float   # period (seconds)
    Sa_g: float   # spectral acceleration / g (dimensionless)


class CurveOut(BaseModel):
    """
    A complete spectrum curve (horizontal or vertical) ready for chart rendering.
    Contains the key period values (for reference lines) and all data points.
    """
    T1:     float                # lower corner of plateau (s)
    T2:     float                # upper corner of plateau (s)
    T3:     float                # start of displacement branch (s)
    peak:   float                # plateau spectral value
    floor:  float                # minimum ordinate (0.2·A·I or 0.2·Av·I)
    points: List[SpectrumPoint]  # all T, Sa_g pairs for the chart


class SpectrumResponse(BaseModel):
    """
    Complete response returned to the React frontend.

    Contains:
      - Engineering parameters (A, I, S, Av, QF, R) for display in cards
      - Spectrum type ("Type 1" or "Type 2") for badge display
      - Full horizontal and vertical spectrum curves for chart rendering
      - Export data (points are used by the .txt export buttons)

    Code reference: RPA 2024 — §3.3.3
    """
    zone:          str    # e.g. "VI"
    spectrum_type: str    # "Type 1" or "Type 2"

    # Engineering parameters — displayed in the parameter cards
    A:   float    # zone acceleration coefficient
    I:   float    # importance factor
    S:   float    # horizontal site coefficient
    Av:  float    # vertical acceleration coefficient (= vRatio × A)
    QF:  float    # quality factor
    R:   float    # behaviour coefficient

    # Design spectrum curves
    horizontal: CurveOut   # Sad(T)/g — Eq.3.15
    vertical:   CurveOut   # Svd(T)/g — Eq.3.16
