"""
Bunyan — Pydantic Schemas for Verification Endpoints
RPA 2024 §4.5.2 (displacements), §5.9 (P-Δ), §5.5 (overturning)
"""

from typing import List, Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared story input
# ---------------------------------------------------------------------------

class StoryInput(BaseModel):
    hk:    float = Field(..., gt=0, description="Inter-story height (m)")
    wg:    float = Field(default=0.0, ge=0, description="Permanent load Gi (kN)")
    wq:    float = Field(default=0.0, ge=0, description="Live load Qi (kN)")
    dek_x: float = Field(default=0.0, ge=0, description="Elastic displacement X from software (m)")
    dek_y: float = Field(default=0.0, ge=0, description="Elastic displacement Y from software (m)")
    elevation: float = Field(default=0.0, ge=0, description="Absolute elevation from base (m)")


# ---------------------------------------------------------------------------
# Displacements — §4.5.2 + §5.10
# ---------------------------------------------------------------------------

class DisplacementsRequest(BaseModel):
    stories:             List[StoryInput] = Field(..., min_length=1)
    R:                   float = Field(..., ge=1.5, le=6.0)
    QF:                  float = Field(..., ge=1.0, le=1.5)
    structure_type:      Literal["acier", "beton_arme", "paf", "bois", "maconnerie"] = "beton_arme"
    non_structural_type: Literal["fragile", "ductile"] = "fragile"


class StoryDisplacementOut(BaseModel):
    level:           int
    hk:              float
    dek:             float
    dk:              float
    delta_k:         float
    drift:           float
    drift_limit_ne:  float
    damage_value:    float
    damage_limit:    float
    ok_ne:           bool
    ok_ld:           bool


class DirectionDisplacementsOut(BaseModel):
    direction:           str
    R:                   float
    QF:                  float
    structure_type:      str
    non_structural_type: str
    stories:             List[StoryDisplacementOut]
    all_ok_ne:           bool
    all_ok_ld:           bool


class DisplacementsResponse(BaseModel):
    x: DirectionDisplacementsOut
    y: DirectionDisplacementsOut


# ---------------------------------------------------------------------------
# P-Delta — §5.9
# ---------------------------------------------------------------------------

class PDeltaRequest(BaseModel):
    stories: List[StoryInput] = Field(..., min_length=1)
    R:       float = Field(..., ge=1.5, le=6.0)
    QF:      float = Field(..., ge=1.0, le=1.5)
    psi:     float = Field(..., ge=0.0, le=1.0, description="Accompaniment coefficient ψ")
    V_x:     float = Field(..., gt=0, description="Base shear X (kN)")
    V_y:     float = Field(..., gt=0, description="Base shear Y (kN)")
    Ft_x:    float = Field(default=0.0, ge=0, description="Additional top force X (kN)")
    Ft_y:    float = Field(default=0.0, ge=0, description="Additional top force Y (kN)")


class StoryPDeltaOut(BaseModel):
    level:         int
    hk:            float
    Pk:            float
    Vk:            float
    delta_k:       float
    theta_k:       float
    verdict:       str
    amplification: float


class DirectionPDeltaOut(BaseModel):
    direction: str
    stories:   List[StoryPDeltaOut]
    all_ok:    bool
    max_theta: float


class PDeltaResponse(BaseModel):
    x: DirectionPDeltaOut
    y: DirectionPDeltaOut


# ---------------------------------------------------------------------------
# Overturning — §5.5
# ---------------------------------------------------------------------------

class OverturningRequest(BaseModel):
    stories: List[StoryInput] = Field(..., min_length=1)
    V_x:     float = Field(..., gt=0, description="Base shear X (kN)")
    V_y:     float = Field(..., gt=0, description="Base shear Y (kN)")
    Ft_x:    float = Field(default=0.0, ge=0)
    Ft_y:    float = Field(default=0.0, ge=0)
    psi:     float = Field(..., ge=0.0, le=1.0)
    lx:      float = Field(..., gt=0, description="Building plan dimension X (m)")
    ly:      float = Field(..., gt=0, description="Building plan dimension Y (m)")
    mu:      float = Field(default=0.40, gt=0, le=1.0, description="Soil-foundation friction coefficient")
    W_total: float = Field(..., gt=0, description="Total seismic weight (kN)")


class DirectionOverturningOut(BaseModel):
    direction:         str
    V:                 float
    M_renvers:         float
    M_stab:            float
    coeff_renvers:     float
    ok_renvers:        bool
    F_glissement:      float
    F_resistance:      float
    coeff_glissement:  float
    ok_glissement:     bool


class OverturningResponse(BaseModel):
    x: DirectionOverturningOut
    y: DirectionOverturningOut
