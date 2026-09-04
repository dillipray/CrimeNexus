from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from backend.services.audit_service import audit_service

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])

ROLES = {
    "investigating_officer": {
        "id": "investigating_officer",
        "name": "Investigating Officer",
        "default_user": "R. Basu",
        "permissions": ["view_case", "search", "graph_explore", "review_leads", "request_merge", "export_report"],
    },
    "senior_investigator": {
        "id": "senior_investigator",
        "name": "Senior Investigator",
        "default_user": "P. Sharma",
        "permissions": ["view_case", "search", "graph_explore", "review_leads", "approve_merge", "sign_report", "cross_case_view"],
    },
    "intelligence_analyst": {
        "id": "intelligence_analyst",
        "name": "Intelligence Analyst",
        "default_user": "M. Chakraborty",
        "permissions": ["view_case", "search", "graph_analytics", "cross_case_view", "centrality_metrics"],
    },
    "forensic_analyst": {
        "id": "forensic_analyst",
        "name": "Forensic Analyst",
        "default_user": "A. Sen",
        "permissions": ["view_case", "cdr_analysis", "financial_flow", "imei_towers", "raw_records"],
    },
    "auditor": {
        "id": "auditor",
        "name": "Auditor",
        "default_user": "K. Varma",
        "permissions": ["view_audit_trail", "export_compliance", "verify_hashes"],
    },
    "admin": {
        "id": "admin",
        "name": "Admin",
        "default_user": "System Admin",
        "permissions": ["*"],
    },
}

class SwitchRoleRequest(BaseModel):
    role_id: str
    user_name: str

@router.get("/roles")
def get_roles():
    return {"roles": list(ROLES.values())}

@router.post("/switch-role")
def switch_role(req: SwitchRoleRequest):
    role_info = ROLES.get(req.role_id, ROLES["investigating_officer"])
    audit_service.log(
        actor=req.user_name,
        role=role_info["name"],
        action_type="ROLE_SWITCH",
        target_type="SESSION",
        target_id=req.role_id,
        details=f"Switched operational role to {role_info['name']}",
    )
    return {
        "status": "success",
        "current_role": role_info,
        "active_user": req.user_name,
    }
