"""
Bunyan — Pydantic schemas for Annex A (wilaya/commune/zone data).
"""

from pydantic import BaseModel


class WilayaResponse(BaseModel):
    code: str
    name: str
    zone: str
    has_split_zones: bool


class CommuneResponse(BaseModel):
    name: str
    zone: str


class ZoneResponse(BaseModel):
    wilaya_code: str
    commune: str | None
    zone: str
