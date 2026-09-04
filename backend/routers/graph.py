from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from backend.services.graph_service import graph_service

router = APIRouter(prefix="/graph", tags=["Graph Analytics"])

@router.get("/subgraph")
def get_subgraph(
    case_id: Optional[str] = None,
    center_id: Optional[str] = None,
    hops: int = Query(2, ge=1, le=4),
):
    return graph_service.get_subgraph(case_id=case_id, center_id=center_id, hops=hops)

@router.get("/analytics/{case_id}")
def get_analytics(case_id: str):
    metrics = graph_service.compute_metrics(case_id)
    communities = graph_service.detect_bridges_and_communities(case_id)
    return {
        "case_id": case_id,
        "metrics": metrics,
        "communities": communities,
    }

@router.get("/shortest-path")
def get_shortest_path(
    source_id: str = Query(...),
    target_id: str = Query(...),
    case_id: Optional[str] = None,
):
    return graph_service.shortest_path(source_id=source_id, target_id=target_id, case_id=case_id)
