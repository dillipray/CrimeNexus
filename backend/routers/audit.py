from fastapi import APIRouter, Query
from typing import Dict, Any, List, Optional
from backend.services.audit_service import audit_service

router = APIRouter(prefix="/audit", tags=["Audit Trail"])

@router.get("")
def get_audit_trail(
    role: Optional[str] = Query("all"),
    action: Optional[str] = Query("all"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    logs = audit_service.get_logs(role_filter=role, action_filter=action, search=search, limit=limit)
    return {
        "logs": logs,
        "total": len(logs),
        "tamper_evident_protection": "SHA-256 Chained Hashes Enabled",
    }
