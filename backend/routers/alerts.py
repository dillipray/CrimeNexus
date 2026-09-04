from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from backend.services.pattern_detector import pattern_detector
from backend.services.audit_service import audit_service

router = APIRouter(prefix="/alerts", tags=["AI Leads & Pattern Alerts"])

# In-memory alert state storage initialized from pattern detector
ALERTS_CACHE: Dict[str, Dict[str, Any]] = {}

def get_alerts_store(case_id: Optional[str] = None):
    global ALERTS_CACHE
    if not ALERTS_CACHE:
        initial = pattern_detector.detect_all_leads(case_id)
        for a in initial:
            ALERTS_CACHE[a["id"]] = a
    return list(ALERTS_CACHE.values())

class UpdateAlertStatusRequest(BaseModel):
    status: str  # "review", "acknowledged", "resolved", "false_positive"
    notes: Optional[str] = ""
    actor: str = "R. Basu"
    role: str = "Investigating Officer"

@router.get("")
def list_alerts(case_id: Optional[str] = None):
    alerts = get_alerts_store(case_id)
    if case_id:
        alerts = [a for a in alerts if a.get("case_id") == case_id or a.get("case_id") == "CASE-2026-001"]
    return {"alerts": alerts, "total": len(alerts)}

@router.patch("/{alert_id}/status")
def update_alert_status(alert_id: str, req: UpdateAlertStatusRequest):
    global ALERTS_CACHE
    get_alerts_store()
    
    if alert_id not in ALERTS_CACHE:
        raise HTTPException(status_code=404, detail="Alert ID not found")
        
    ALERTS_CACHE[alert_id]["status"] = req.status
    if req.notes:
        ALERTS_CACHE[alert_id]["investigator_notes"] = req.notes

    audit_service.log(
        actor=req.actor,
        role=req.role,
        action_type="ALERT_STATUS_UPDATE",
        target_type="LEAD",
        target_id=alert_id,
        details=f"Updated alert status to '{req.status}'. Notes: {req.notes or 'None'}",
    )
    return {"status": "success", "alert": ALERTS_CACHE[alert_id]}
