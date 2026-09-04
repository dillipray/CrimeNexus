import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "disclaimer" in data

def test_list_cases():
    response = client.get("/api/v1/cases")
    assert response.status_code == 200
    data = response.json()
    assert "cases" in data
    assert len(data["cases"]) > 0

def test_get_case_summary():
    response = client.get("/api/v1/cases/FIR_0001/summary")
    assert response.status_code == 200
    data = response.json()
    assert "kpi" in data
    assert "entities" in data["kpi"]

def test_graph_analytics():
    response = client.get("/api/v1/graph/analytics/FIR_0001")
    assert response.status_code == 200
    data = response.json()
    assert "metrics" in data
    assert "ranked" in data["metrics"]
    assert "communities" in data

def test_subgraph():
    response = client.get("/api/v1/graph/subgraph?hops=2")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data

def test_hybrid_search():
    response = client.get("/api/v1/search/hybrid?q=Alpha")
    assert response.status_code == 200
    data = response.json()
    assert "entities" in data

def test_alerts_and_update():
    response = client.get("/api/v1/alerts")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert len(data["alerts"]) > 0
    
    first_alert = data["alerts"][0]["id"]
    patch_resp = client.patch(
        f"/api/v1/alerts/{first_alert}/status",
        json={"status": "acknowledged", "notes": "Investigator test note", "actor": "Test Officer", "role": "Investigating Officer"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["alert"]["status"] == "acknowledged"

def test_review_duplicates():
    response = client.get("/api/v1/review/duplicates")
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) > 0

def test_audit_trail():
    response = client.get("/api/v1/audit")
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert len(data["logs"]) > 0
    assert "tamper_evident_protection" in data

def test_report_compilation():
    response = client.post(
        "/api/v1/reports/compile",
        json={"case_id": "FIR_0001", "investigator_notes": "All leads verified.", "actor": "R. Basu", "role": "Investigating Officer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "mandatory_disclaimer" in data["report"]

if __name__ == "__main__":
    test_health_check()
    print("[PASS] test_health_check")
    test_list_cases()
    print("[PASS] test_list_cases")
    test_get_case_summary()
    print("[PASS] test_get_case_summary")
    test_graph_analytics()
    print("[PASS] test_graph_analytics")
    test_subgraph()
    print("[PASS] test_subgraph")
    test_hybrid_search()
    print("[PASS] test_hybrid_search")
    test_alerts_and_update()
    print("[PASS] test_alerts_and_update")
    test_review_duplicates()
    print("[PASS] test_review_duplicates")
    test_audit_trail()
    print("[PASS] test_audit_trail")
    test_report_compilation()
    print("[PASS] test_report_compilation")
    print("\nALL 10 BACKEND TESTS PASSED SUCCESSFULLY!")


