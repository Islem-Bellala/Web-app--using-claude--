"""
StructCalc — Base Shear API Endpoint
======================================
Exposes POST /api/v1/base_shear

Translation layer only:
    1. Receive + validate request (Pydantic)
    2. Map schema → engineering input objects
    3. Call compute_base_shear() from the engineering core
    4. Return result as Pydantic response

No formulas here. Engineering logic lives in base_shear.py.

Code reference: RPA 2024 — §4.2, Equations 4.1–4.4
"""

from fastapi import APIRouter, HTTPException

from backend.schemas.base_shear_schema import (
    BaseShearRequest,
    BaseShearResponse,
    StoryForceOut,
)
from calculation_engine.seismic.rpa2024.base_shear import (
    BaseShearInput,
    StoryMass,
    compute_base_shear,
    get_design_period,
    compute_empirical_period,
)
from calculation_engine.seismic.rpa2024.parameters import (
    SeismicZone,
    SiteClass,
    ImportanceGroup,
)

router = APIRouter()


@router.post(
    "/base_shear",
    response_model=BaseShearResponse,
    summary="Méthode Statique Équivalente — Effort tranchant à la base (RPA 2024)",
    description=(
        "Calcule l'effort tranchant total V et la distribution des forces sismiques "
        "par niveau selon RPA 2024 §4.2, Équations 4.1 à 4.4."
    ),
)
def compute_shear(req: BaseShearRequest) -> BaseShearResponse:
    """
    Computes the base shear V and storey force distribution.

    The endpoint:
        1. Computes T_emp and T0 (period rules §4.2.4)
        2. Builds the BaseShearInput dataclass
        3. Calls compute_base_shear() from the engineering core
        4. Returns the full result

    Raises:
        422  Pydantic validation error (invalid inputs)
        500  Unexpected engineering computation error
    """

    try:
        zone             = SeismicZone(req.zone)
        site_class       = SiteClass(req.site_class)
        importance_group = ImportanceGroup(req.importance_group)
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Paramètre invalide : {exc}")

    # ── Period calculation — Equation 4.4 ──────────────────────────────────
    T_emp = compute_empirical_period(req.hn, req.frame_system)
    T_cap = round(1.3 * T_emp, 4)
    T0    = get_design_period(req.hn, req.frame_system, req.T_calculated)

    # ── Total seismic weight W = Σ Wi ──────────────────────────────────────
    W = sum(s.weight for s in req.stories)

    # ── Build engineering input ────────────────────────────────────────────
    try:
        inp = BaseShearInput(
            zone             = zone,
            site_class       = site_class,
            importance_group = importance_group,
            R                = req.R,
            Q                = req.QF,        # base_shear.py uses Q, schema uses QF
            W                = W,
            T0               = T0,
            xi_percent       = 5.0,
            stories          = [
                StoryMass(
                    name      = s.name,
                    elevation = s.elevation,
                    weight    = s.weight,
                )
                for s in req.stories
            ],
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Erreur de paramètres : {exc}")

    # ── Call engineering core ──────────────────────────────────────────────
    try:
        result = compute_base_shear(inp)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erreur de calcul : {exc}")

    # ── Map result → response ──────────────────────────────────────────────
    return BaseShearResponse(
        T_emp  = round(T_emp, 4),
        T0     = round(T0,    4),
        T_cap  = T_cap,
        Sad_g  = round(result.Sad_g, 5),
        W      = round(W,     2),
        V      = round(result.V,     2),
        Ft     = round(result.Ft,    2),
        story_forces=[
            StoryForceOut(
                name      = sf.name,
                elevation = sf.elevation,
                weight    = sf.weight,
                Fi        = round(sf.Fi,    2),
                ratio     = round(sf.ratio, 5),
            )
            for sf in result.story_forces
        ],
    )
