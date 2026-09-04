from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.services.nlp_service import nlp_service
from backend.services.audit_service import audit_service

router = APIRouter(prefix="/review", tags=["Entity Resolution & Triage"])

# Initial duplicate match queue adhering to PRD Sections 8 & 9
RESOLUTION_QUEUE_STATE = [
    {
        "id": "MATCH-01",
        "a": "Devraj Sharma",
        "b": "D. Sharma",
        "confidence": 91,
        "status": "pending",
        "reasons": ["Similar name syntax", "Co-registered vehicle (KA-04 White Sedan)", "Overlapping phone contact pattern"],
        "aAttrs": {"Source": "VEH-202", "Phone": "+91 98•••1223", "Vehicle": "KA-04 White Sedan"},
        "bAttrs": {"Source": "LOC-118 witness log", "Phone": "+91 98•••1223", "Vehicle": "KA-04 White Sedan"},
    },
    {
        "id": "MATCH-02",
        "a": "Meera Sen",
        "b": "M. Sen",
        "confidence": 76,
        "status": "pending",
        "reasons": ["Similar name syntax", "Same organization affiliation", "Overlapping transaction window"],
        "aAttrs": {"Source": "ORG-011", "Phone": "+91 98•••1042", "Organization": "Silverline Logistics"},
        "bAttrs": {"Source": "TXN-322 counterparty", "Phone": "Not captured", "Organization": "Silverline Logistics"},
    },
    {
        "id": "MATCH-03",
        "a": "Kavita Rao",
        "b": "K. Rao (Cafe Meridian log)",
        "confidence": 58,
        "status": "pending",
        "reasons": ["Similar name syntax", "Shared location observation window"],
        "aAttrs": {"Source": "CDR-1119", "Phone": "+91 98•••1119", "Location": "Cafe Meridian"},
        "bAttrs": {"Source": "LOC-204 manual entry", "Phone": "Not captured", "Location": "Cafe Meridian"},
    },
]

class ResolveMatchRequest(BaseModel):
    decision: str  # "merged" or "rejected"
    justification: Optional[str] = ""
    actor: str = "R. Basu"
    role: str = "Senior Investigator"

class DocumentExtractionRequest(BaseModel):
    text: str
    document_title: Optional[str] = "FIR Document"
    actor: str = "R. Basu"
    role: str = "Investigating Officer"

@router.get("/duplicates")
def get_duplicates():
    return {
        "matches": RESOLUTION_QUEUE_STATE,
        "pending_count": sum(1 for m in RESOLUTION_QUEUE_STATE if m["status"] == "pending"),
    }

@router.post("/duplicates/{match_id}/resolve")
def resolve_duplicate(match_id: str, req: ResolveMatchRequest):
    match_item = None
    for m in RESOLUTION_QUEUE_STATE:
        if m["id"] == match_id:
            match_item = m
            break

    if not match_item:
        raise HTTPException(status_code=404, detail="Duplicate match ID not found")

    match_item["status"] = req.decision
    match_item["resolved_by"] = req.actor
    match_item["justification"] = req.justification

    audit_service.log(
        actor=req.actor,
        role=req.role,
        action_type="ENTITY_RESOLUTION",
        target_type="DUPLICATE_PAIR",
        target_id=match_id,
        details=f"Investigator decided: '{req.decision}' for pair {match_item['a']} & {match_item['b']}. Justification: {req.justification or 'Verified by investigator'}",
    )

    return {"status": "success", "match": match_item}

@router.post("/ner-extract")
def extract_document_entities(req: DocumentExtractionRequest):
    result = nlp_service.extract_entities(req.text)
    audit_service.log(
        actor=req.actor,
        role=req.role,
        action_type="DOCUMENT_INGESTION",
        target_type="DOCUMENT",
        target_id=req.document_title[:20],
        details=f"Simulated entity extraction on '{req.document_title}': {len(result['persons'])} persons, {len(result['phones'])} phones, {len(result['vehicles'])} vehicles found",
    )
    return {
        "document_title": req.document_title,
        "extracted": result,
    }
