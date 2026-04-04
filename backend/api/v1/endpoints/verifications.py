"""
Bunyan — Seismic Verification Endpoints
========================================
RPA 2024 §4.5.2  — Displacement check
RPA 2024 §5.9    — P-Δ effect check
RPA 2024 §5.5    — Overturning & sliding check
"""

from fastapi import APIRouter

from backend.schemas.verifications import (
    DisplacementsRequest, DisplacementsResponse,
    DirectionDisplacementsOut, StoryDisplacementOut,
    PDeltaRequest, PDeltaResponse,
    DirectionPDeltaOut, StoryPDeltaOut,
    OverturningRequest, OverturningResponse,
    DirectionOverturningOut,
)
from calc_engine.seismic.rpa2024.displacements import compute_displacements
from calc_engine.seismic.rpa2024.p_delta import compute_p_delta
from calc_engine.seismic.rpa2024.overturning import compute_overturning

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/v1/verifications/displacements
# ---------------------------------------------------------------------------

@router.post(
    "/verifications/displacements",
    response_model=DisplacementsResponse,
    summary="Vérification des déplacements RPA 2024 §4.5.2 + §5.10",
)
def check_displacements(req: DisplacementsRequest) -> DisplacementsResponse:
    """
    Calcule les déplacements inélastiques et vérifie les limites inter-étages.

    - δk = (R / QF) × δek               [Eq 4.15]
    - Δk = δk − δk−1                    [Eq 4.16]
    - Non-effondrement : Δk ≤ Table 5.2 × hk
    - Limitation dommages : νA × Δk ≤ limit × hk  [§5.10.2]
    """
    stories_data = [
        {
            "hk":    s.hk,
            "dek_x": s.dek_x,
            "dek_y": s.dek_y,
        }
        for s in req.stories
    ]

    res_x, res_y = compute_displacements(
        stories=stories_data,
        R=req.R,
        QF=req.QF,
        structure_type=req.structure_type,
        non_structural_type=req.non_structural_type,
    )

    def _map_dir(res) -> DirectionDisplacementsOut:
        return DirectionDisplacementsOut(
            direction=res.direction,
            R=res.R,
            QF=res.QF,
            structure_type=res.structure_type,
            non_structural_type=res.non_structural_type,
            all_ok_ne=res.all_ok_ne,
            all_ok_ld=res.all_ok_ld,
            stories=[
                StoryDisplacementOut(
                    level=s.level,
                    hk=s.hk,
                    dek=s.dek,
                    dk=s.dk,
                    delta_k=s.delta_k,
                    drift=s.drift,
                    drift_limit_ne=s.drift_limit_ne,
                    damage_value=s.damage_value,
                    damage_limit=s.damage_limit,
                    ok_ne=s.ok_ne,
                    ok_ld=s.ok_ld,
                )
                for s in res.stories
            ],
        )

    return DisplacementsResponse(x=_map_dir(res_x), y=_map_dir(res_y))


# ---------------------------------------------------------------------------
# POST /api/v1/verifications/p-delta
# ---------------------------------------------------------------------------

@router.post(
    "/verifications/p-delta",
    response_model=PDeltaResponse,
    summary="Vérification effet P-Δ RPA 2024 §5.9",
)
def check_p_delta(req: PDeltaRequest) -> PDeltaResponse:
    """
    Calcule l'indice de stabilité θk et détermine si une amplification est nécessaire.

    - Pk = Σ(Gi + ψ·Qi) au-dessus du niveau k  [Eq 5.10]
    - θk = (Pk × Δk) / (Vk × hk)               [Eq 5.9]
    - θk < 0.10   → "ok"
    - 0.10 ≤ θk ≤ 0.20 → "amplify" with factor 1/(1−θk)
    - θk > 0.20   → "unstable"
    """
    stories_data = [
        {
            "hk":        s.hk,
            "wg":        s.wg,
            "wq":        s.wq,
            "elevation": s.elevation,
            "dek_x":     s.dek_x,
            "dek_y":     s.dek_y,
        }
        for s in req.stories
    ]

    res_x, res_y = compute_p_delta(
        stories=stories_data,
        R=req.R,
        QF=req.QF,
        psi=req.psi,
        V_x=req.V_x,
        V_y=req.V_y,
        Ft_x=req.Ft_x,
        Ft_y=req.Ft_y,
    )

    def _map_dir(res) -> DirectionPDeltaOut:
        return DirectionPDeltaOut(
            direction=res.direction,
            all_ok=res.all_ok,
            max_theta=res.max_theta,
            stories=[
                StoryPDeltaOut(
                    level=s.level,
                    hk=s.hk,
                    Pk=s.Pk,
                    Vk=s.Vk,
                    delta_k=s.delta_k,
                    theta_k=s.theta_k,
                    verdict=s.verdict,
                    amplification=s.amplification,
                )
                for s in res.stories
            ],
        )

    return PDeltaResponse(x=_map_dir(res_x), y=_map_dir(res_y))


# ---------------------------------------------------------------------------
# POST /api/v1/verifications/overturning
# ---------------------------------------------------------------------------

@router.post(
    "/verifications/overturning",
    response_model=OverturningResponse,
    summary="Vérification renversement et glissement RPA 2024 §5.5",
)
def check_overturning(req: OverturningRequest) -> OverturningResponse:
    """
    Vérifie la stabilité au renversement et au glissement.

    Renversement : M_stab / M_renvers ≥ 1.3
    Glissement   : μ × W_total / V ≥ 1.25
    """
    stories_data = [
        {
            "wg":        s.wg,
            "wq":        s.wq,
            "elevation": s.elevation,
        }
        for s in req.stories
    ]

    result = compute_overturning(
        stories=stories_data,
        V_x=req.V_x,
        V_y=req.V_y,
        Ft_x=req.Ft_x,
        Ft_y=req.Ft_y,
        psi=req.psi,
        lx=req.lx,
        ly=req.ly,
        mu=req.mu,
        W_total=req.W_total,
    )

    def _map_dir(d) -> DirectionOverturningOut:
        return DirectionOverturningOut(
            direction=d.direction,
            V=d.V,
            M_renvers=d.M_renvers,
            M_stab=d.M_stab,
            coeff_renvers=d.coeff_renvers,
            ok_renvers=d.ok_renvers,
            F_glissement=d.F_glissement,
            F_resistance=d.F_resistance,
            coeff_glissement=d.coeff_glissement,
            ok_glissement=d.ok_glissement,
        )

    return OverturningResponse(x=_map_dir(result.x), y=_map_dir(result.y))
