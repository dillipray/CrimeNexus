from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.data_loader import loader
from backend.services.nlp_service import nlp_service
from backend.services.audit_service import audit_service

router = APIRouter(prefix="/search", tags=["Hybrid Search"])

class SemanticSearchRequest(BaseModel):
    query: str
    top_k: int = 5
    case_id: Optional[str] = None
    actor: str = "R. Basu"
    role: str = "Investigating Officer"

@router.get("/hybrid")
def hybrid_search(
    q: str = Query(..., min_length=1),
    case_id: Optional[str] = None,
    actor: str = "R. Basu",
    role: str = "Investigating Officer",
):
    query = q.strip().lower()
    
    # 1. Entity matches
    matched_entities = []
    for pid, p in loader.persons.items():
        if query in p.get("name", "").lower() or query in pid.lower():
            matched_entities.append({
                "id": pid,
                "name": p.get("name", pid),
                "type": "PERSON",
                "sub": f"Person · {p.get('district', '')}, {p.get('state', '')}",
            })
            if len(matched_entities) >= 6:
                break

    # Phones
    for phid, ph in loader.phones.items():
        if query in ph.get("number_display", "").lower() or query in phid.lower():
            matched_entities.append({
                "id": phid,
                "name": ph.get("number_display", phid),
                "type": "PHONE",
                "sub": f"Phone · Owner: {ph.get('owner_id', 'Unknown')}",
            })
            if len(matched_entities) >= 10:
                break

    # Vehicles
    for vid, v in loader.vehicles.items():
        if query in v.get("registration", "").lower() or query in vid.lower():
            matched_entities.append({
                "id": vid,
                "name": v.get("registration", vid),
                "type": "VEHICLE",
                "sub": f"Vehicle · {v.get('vehicle_type', 'Sedan')}",
            })
            if len(matched_entities) >= 12:
                break

    # Locations
    for lid, loc in loader.locations.items():
        if query in loc.get("name", "").lower() or query in lid.lower():
            matched_entities.append({
                "id": lid,
                "name": loc.get("name", lid),
                "type": "LOCATION",
                "sub": f"Location · {loc.get('district', '')}, {loc.get('state', '')}",
            })
            if len(matched_entities) >= 15:
                break

    # 2. Evidence Record matches
    matched_evidence = []
    for cdr in loader.cdr_records[:500]:
        if query in cdr.get("cdr_id", "").lower() or query in cdr.get("tower_id", "").lower():
            matched_evidence.append({
                "id": cdr["cdr_id"],
                "type": "CDR",
                "detail": f"Voice call between {cdr.get('caller_id')} and {cdr.get('receiver_id')} at {cdr.get('date_time')}",
            })
            if len(matched_evidence) >= 5:
                break

    for txn in loader.transactions[:500]:
        if query in txn.get("transaction_id", "").lower() or query in txn.get("sender_account", "").lower() or query in txn.get("receiver_account", "").lower():
            matched_evidence.append({
                "id": txn["transaction_id"],
                "type": "TRANSACTION",
                "detail": f"{txn.get('transaction_type', 'Transfer')} ₹{float(txn.get('amount_inr', 0)):,.0f} ({txn.get('sender_account')} → {txn.get('receiver_account')})",
            })
            if len(matched_evidence) >= 10:
                break

    # 3. Semantic / Narrative Search
    semantic_results = nlp_service.semantic_search(query, top_k=3)

    # Log search action
    audit_service.log(
        actor=actor,
        role=role,
        action_type="SEARCH",
        target_type="QUERY",
        target_id=q[:20],
        details=f"Executed hybrid search for '{q}' ({len(matched_entities)} entities, {len(matched_evidence)} records)",
    )

    return {
        "query": q,
        "entities": matched_entities,
        "evidence": matched_evidence,
        "semantic_matches": semantic_results,
    }

@router.post("/semantic")
def semantic_search_post(req: SemanticSearchRequest):
    results = nlp_service.semantic_search(req.query, top_k=req.top_k)
    audit_service.log(
        actor=req.actor,
        role=req.role,
        action_type="SEMANTIC_SEARCH",
        target_type="NARRATIVE",
        target_id=req.query[:25],
        details=f"Semantic narrative search: '{req.query}' returned {len(results)} matches",
    )
    return {"query": req.query, "results": results}
