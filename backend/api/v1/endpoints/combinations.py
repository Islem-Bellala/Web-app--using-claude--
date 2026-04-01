"""
Bunyan — Combinations API Endpoint
RPA 2024 §5.2 — Combinaisons d'actions sismiques
"""

from fastapi import APIRouter, HTTPException

from backend.schemas.combinations import (
    CombinationsRequest,
    CombinationOut,
    CombinationsResponse,
)
from calc_engine.seismic.rpa2024.combinations import (
    TABLE_5_1,
    requires_vertical_component,
    generate_combinations,
)

router = APIRouter()


@router.post(
    "/combinations",
    response_model=CombinationsResponse,
    summary="Combinaisons sismiques RPA 2024 §5.2 (E1–E5)",
)
def compute_combinations(req: CombinationsRequest) -> CombinationsResponse:
    """
    Génère les combinaisons d'actions sismiques selon RPA 2024 §5.2.

    - Si Av·I ≤ 0.25 : 8 combinaisons (E1 + E2, horizontales uniquement)
    - Si Av·I > 0.25 : 24 combinaisons (E3 + E4 + E5, avec composante verticale)
    """
    # Validate zone + group exist in TABLE_5_1
    av_i = TABLE_5_1.get((req.zone, req.group))
    if av_i is None:
        raise HTTPException(
            status_code=422,
            detail=f"Zone '{req.zone}' ou groupe '{req.group}' invalide. "
                   f"Zones valides: I, II, III, IV, V, VI. Groupes: 1A, 1B, 2, 3.",
        )

    if not (0.0 <= req.psi <= 2.0):
        raise HTTPException(
            status_code=422,
            detail=f"Coefficient ψ invalide : {req.psi}. Doit être compris entre 0 et 2.",
        )

    include_vertical = requires_vertical_component(req.zone, req.group)
    combos = generate_combinations(psi=req.psi, include_vertical=include_vertical)

    return CombinationsResponse(
        psi=req.psi,
        include_vertical=include_vertical,
        av_i=round(av_i, 4),
        combinations=[
            CombinationOut(
                id=c.id,
                label=c.label,
                seismic_id=c.seismic_id,
                ex_coeff=c.ex_coeff,
                ey_coeff=c.ey_coeff,
                ez_coeff=c.ez_coeff,
            )
            for c in combos
        ],
        total_count=len(combos),
    )
