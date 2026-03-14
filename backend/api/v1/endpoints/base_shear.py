"""
StructCalc — Base Shear API Endpoint (Session 8)
Adds lambda_coef to response. No other logic changes.
"""

from fastapi import APIRouter, HTTPException

from backend.schemas.base_shear_schema import (
    BaseShearRequest, BaseShearResponse, StoryForceOut,
)
from calculation_engine.seismic.rpa2024.base_shear import (
    BaseShearInput, StoryMass, compute_base_shear,
    get_design_period, compute_empirical_period,
)
from calculation_engine.seismic.rpa2024.parameters import (
    SeismicZone, SiteClass, ImportanceGroup,
)

router = APIRouter()


@router.post(
    "/base_shear",
    response_model=BaseShearResponse,
    summary="Méthode Statique Équivalente — V = λ·Sad(T₀)/g·W (RPA 2024 §4.2)",
)
def compute_shear(req: BaseShearRequest) -> BaseShearResponse:
    try:
        zone             = SeismicZone(req.zone)
        site_class       = SiteClass(req.site_class)
        importance_group = ImportanceGroup(req.importance_group)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Paramètre invalide : {exc}")

    T_emp = compute_empirical_period(req.hn, req.frame_system)
    T_cap = round(1.3 * T_emp, 4)
    T0    = get_design_period(req.hn, req.frame_system, req.T_calculated)
    W     = sum(s.weight for s in req.stories)

    try:
        inp = BaseShearInput(
            zone=zone, site_class=site_class, importance_group=importance_group,
            R=req.R, Q=req.QF, W=W, T0=T0, xi_percent=5.0,
            stories=[StoryMass(name=s.name, elevation=s.elevation, weight=s.weight)
                     for s in req.stories],
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Erreur de paramètres : {exc}")

    try:
        result = compute_base_shear(inp)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur de calcul : {exc}")

    return BaseShearResponse(
        T_emp       = round(T_emp, 4),
        T0          = round(T0,    4),
        T_cap       = T_cap,
        Sad_g       = round(result.Sad_g, 5),
        W           = round(W, 2),
        V           = round(result.V,  2),
        Ft          = round(result.Ft, 2),
        lambda_coef = result.lambda_coef,
        story_forces=[
            StoryForceOut(
                name=sf.name, elevation=sf.elevation, weight=sf.weight,
                Fi=round(sf.Fi, 2), ratio=round(sf.ratio, 5),
            )
            for sf in result.story_forces
        ],
    )
