"""
Bunyan — Annex A API Endpoints
================================
Serves RPA 2024 Annex A zone data (wilayas, communes, zone lookup).

Endpoints:
    GET /api/v1/wilayas                         — all 58 wilayas
    GET /api/v1/wilayas/{code}/communes         — communes for a split-zone wilaya
    GET /api/v1/zone?wilaya_code=XX&commune=YY  — zone lookup

Engineering Core Isolation: NO data or logic here.
This file only calls calc_engine functions and returns results.
"""

from fastapi import APIRouter, HTTPException, Query

from backend.schemas.annex_a import WilayaResponse, CommuneResponse, ZoneResponse
from calc_engine.seismic.rpa2024.annex_a import (
    get_all_wilayas,
    get_communes,
    get_zone,
)

router = APIRouter()


@router.get(
    "/wilayas",
    response_model=list[WilayaResponse],
    summary="Liste des 58 wilayas avec leur zone sismique (RPA 2024 Annexe A)",
)
def list_wilayas() -> list[WilayaResponse]:
    """Returns all 58 Algerian wilayas with their seismic zone."""
    return [WilayaResponse(**w) for w in get_all_wilayas()]


@router.get(
    "/wilayas/{code}/communes",
    response_model=list[CommuneResponse],
    summary="Communes à zones différentes pour une wilaya partagée",
)
def list_communes(code: str) -> list[CommuneResponse]:
    """
    Returns communes with exceptional zones for a split-zone wilaya.
    Returns empty list for non-split wilayas.
    """
    return [CommuneResponse(**c) for c in get_communes(code)]


@router.get(
    "/zone",
    response_model=ZoneResponse,
    summary="Zone sismique pour une wilaya (et commune optionnelle)",
)
def lookup_zone(
    wilaya_code: str = Query(..., description="Code wilaya à deux chiffres, ex: '09'"),
    commune: str | None = Query(None, description="Nom de la commune (optionnel)"),
) -> ZoneResponse:
    """
    Returns the seismic zone for a given wilaya and optional commune.
    """
    try:
        zone = get_zone(wilaya_code, commune)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    return ZoneResponse(wilaya_code=wilaya_code, commune=commune, zone=zone)
