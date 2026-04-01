"""
Bunyan — Combinations Pydantic Schemas
RPA 2024 §5.2
"""

from pydantic import BaseModel
from typing import List


class CombinationsRequest(BaseModel):
    zone: str
    group: str
    psi: float


class CombinationOut(BaseModel):
    id: str
    label: str
    seismic_id: str
    ex_coeff: float
    ey_coeff: float
    ez_coeff: float


class CombinationsResponse(BaseModel):
    psi: float
    include_vertical: bool
    av_i: float
    combinations: List[CombinationOut]
    total_count: int
