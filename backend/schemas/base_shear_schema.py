"""
StructCalc — Updated Pydantic Schemas for Base Shear API (Session 8)
Adds lambda_coef to response. Request unchanged.
"""

from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


class StoryIn(BaseModel):
    name:      str
    elevation: float = Field(..., gt=0)
    weight:    float = Field(..., gt=0)


class BaseShearRequest(BaseModel):
    zone:             Literal["I","II","III","IV","V","VI"]
    site_class:       Literal["S1","S2","S3","S4"]
    importance_group: Literal["1A","1B","2","3"]
    QF:               float = Field(default=1.0, ge=1.0, le=1.5)
    R:                float = Field(default=3.5,  ge=1.5, le=6.0)
    frame_system:     Literal["ba_no_infill","steel_no_infill","ba_with_infill","other"] = "ba_with_infill"
    hn:               float = Field(..., gt=0, le=300)
    T_calculated:     Optional[float] = Field(default=None, gt=0)
    stories:          List[StoryIn]   = Field(..., min_length=1)

    @field_validator("stories")
    @classmethod
    def stories_must_be_ordered(cls, v):
        for i in range(1, len(v)):
            if v[i].elevation <= v[i-1].elevation:
                raise ValueError(
                    f"Hauteurs non croissantes: niveau {i+1} ({v[i].elevation}m) ≤ niveau {i} ({v[i-1].elevation}m)."
                )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "zone":"VI","site_class":"S2","importance_group":"2",
                "QF":1.15,"R":4.5,"frame_system":"ba_with_infill","hn":12.0,
                "stories":[
                    {"name":"RDC",    "elevation":3.0, "weight":1200},
                    {"name":"Etage 1","elevation":6.0, "weight":1100},
                    {"name":"Etage 2","elevation":9.0, "weight":1100},
                    {"name":"Etage 3","elevation":12.0,"weight":900},
                ]
            }
        }


class StoryForceOut(BaseModel):
    name:      str
    elevation: float
    weight:    float
    Fi:        float
    ratio:     float


class BaseShearResponse(BaseModel):
    T_emp:        float
    T0:           float
    T_cap:        float
    Sad_g:        float
    W:            float
    V:            float
    Ft:           float
    lambda_coef:  float          # NEW — 0.85 or 1.0
    story_forces: List[StoryForceOut]
