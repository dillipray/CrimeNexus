import hashlib
import time
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

class AuditService:
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
        self._prev_hash = "GENESIS_HASH_SIH26189"
        self._seed_initial_logs()

    def _seed_initial_logs(self):
        sample_entries = [
            ("R. Basu", "Investigating Officer", "CASE_ACCESS", "CASE", "CASE-2026-001", "Opened case context for analysis"),
            ("R. Basu", "Investigating Officer", "GRAPH_EXPAND", "ENTITY", "ENT-101", "Expanded 2-hop neighborhood of Arjun Nair"),
            ("A. Sen", "Forensic Analyst", "CDR_ANALYSIS", "CDR", "CDR-1042", "Filtered CDR tower records for frequency surge"),
            ("P. Sharma", "Senior Investigator", "LEAD_REVIEW", "LEAD", "LEAD-07", "Reviewed bridge entity anomaly: Meera Sen"),
        ]
        for actor, role, action, target_type, target_id, details in sample_entries:
            self.log(actor=actor, role=role, action_type=action, target_type=target_type, target_id=target_id, details=details)

    def log(
        self,
        actor: str,
        role: str,
        action_type: str,
        target_type: str,
        target_id: str,
        details: str,
        ip_address: str = "127.0.0.1",
    ) -> Dict[str, Any]:
        log_id = f"AUD-{len(self.logs)+1:05d}"
        now = datetime.now(timezone.utc).isoformat()
        
        # Calculate chained tamper-evident SHA-256 hash
        payload = f"{self._prev_hash}|{log_id}|{now}|{actor}|{role}|{action_type}|{target_id}|{details}"
        tamper_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]
        self._prev_hash = tamper_hash

        entry = {
            "id": log_id,
            "timestamp": now,
            "actor": actor,
            "role": role,
            "action_type": action_type,
            "target_type": target_type,
            "target_id": target_id,
            "details": details,
            "ip_address": ip_address,
            "tamper_hash": tamper_hash,
        }
        self.logs.insert(0, entry)  # Most recent first
        return entry

    def get_logs(
        self,
        role_filter: Optional[str] = None,
        action_filter: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        results = self.logs
        if role_filter and role_filter != "all":
            results = [l for l in results if l["role"].lower() == role_filter.lower()]
        if action_filter and action_filter != "all":
            results = [l for l in results if l["action_type"].lower() == action_filter.lower()]
        if search:
            q = search.lower()
            results = [
                l for l in results
                if q in l["actor"].lower() or q in l["details"].lower() or q in l["target_id"].lower()
            ]
        return results[:limit]

audit_service = AuditService()
