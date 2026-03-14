"""
StructCalc — Pydantic Schemas for Base Shear API
=================================================
Request and response models for POST /api/v1/base_shear.

Rule: No engineering formulas here.
      This layer only validates JSON and defines the data contract.

Code reference:
    RPA 2024 — §4.2 — Méthode Statique Équivalente
    Equations 4.1, 4.2, 4.3, 4.4
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


# =============================================================================
# REQUEST MODELS
# =============================================================================

class StoryIn(BaseModel):
    """One storey — name, height from ground, seismic weight."""
    name:      str    = Field(..., description="Nom du niveau (ex: RDC, Etage 1)")
    elevation: float  = Field(..., gt=0, description="Hauteur depuis le sol (m)")
    weight:    float  = Field(..., gt=0, description="Poids sismique Wi (kN)")


class BaseShearRequest(BaseModel):
    """
    All parameters needed to compute the base shear V by the
    static equivalent method (RPA 2024 §4.2).
    """

    # Seismic parameters — same as spectrum
    zone:             Literal["I","II","III","IV","V","VI"] = Field(
        ..., description="Zone sismique RPA 2024"
    )
    site_class:       Literal["S1","S2","S3","S4"] = Field(
        ..., description="Classe de site"
    )
    importance_group: Literal["1A","1B","2","3"] = Field(
        ..., description="Groupe d'importance"
    )
    QF: float = Field(default=1.0, ge=1.0, le=1.5, description="Facteur de qualité QF")
    R:  float = Field(default=3.5, ge=1.5, le=6.0, description="Coefficient de comportement R")

    # Period parameters — Equation 4.4
    frame_system: Literal[
        "ba_no_infill",
        "steel_no_infill",
        "ba_with_infill",
        "other"
    ] = Field(
        default="ba_with_infill",
        description="Système de contreventement pour CT (Éq.4.4)"
    )
    hn: float = Field(
        ..., gt=0, le=300,
        description="Hauteur totale du bâtiment hn (m)"
    )
    T_calculated: Optional[float] = Field(
        default=None, gt=0,
        description="Période calculée par Rayleigh ou FEM (optionnel, s)"
    )

    # Storey data — at least 1 storey required
    stories: List[StoryIn] = Field(
        ..., min_length=1,
        description="Liste des niveaux (nom, hauteur, poids sismique)"
    )

    @field_validator("stories")
    @classmethod
    def stories_must_be_ordered(cls, v: List[StoryIn]) -> List[StoryIn]:
        """Storeys must have strictly increasing elevations."""
        for i in range(1, len(v)):
            if v[i].elevation <= v[i-1].elevation:
                raise ValueError(
                    f"Les hauteurs doivent être croissantes. "
                    f"Niveau {i+1} ({v[i].elevation}m) ≤ niveau {i} ({v[i-1].elevation}m)."
                )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "zone": "VI",
                "site_class": "S2",
                "importance_group": "2",
                "QF": 1.15,
                "R": 4.5,
                "frame_system": "ba_with_infill",
                "hn": 12.0,
                "T_calculated": None,
                "stories": [
                    {"name": "RDC",     "elevation": 3.0,  "weight": 1200.0},
                    {"name": "Etage 1", "elevation": 6.0,  "weight": 1100.0},
                    {"name": "Etage 2", "elevation": 9.0,  "weight": 1100.0},
                    {"name": "Etage 3", "elevation": 12.0, "weight":  900.0},
                ]
            }
        }


# =============================================================================
# RESPONSE MODELS
# =============================================================================

class StoryForceOut(BaseModel):
    """Seismic force result for one storey."""
    name:      str
    elevation: float   # m
    weight:    float   # kN
    Fi:        float   # kN — seismic lateral force at this level
    ratio:     float   # Wi·hi / Σ(Wj·hj) — distribution factor


class BaseShearResponse(BaseModel):
    """
    Complete result of the static equivalent method.
    Returned to the React frontend.
    """
    # Period results — Equation 4.4
    T_emp:  float   # empirical period CT × hn^0.75  (s)
    T0:     float   # design period used in calculation (s)
    T_cap:  float   # upper cap 1.3 × T_emp (s)

    # Spectral value at T0
    Sad_g:  float   # Sad(T0)/g — design spectral ordinate at T0

    # Base shear — Equation 4.1
    W:      float   # total seismic weight ΣWi  (kN)
    V:      float   # total base shear  V = 0.8 × Sad × W  (kN)
    Ft:     float   # additional top force (kN) — Equation 4.3

    # Storey distribution — Equation 4.2
    story_forces: List[StoryForceOut]
