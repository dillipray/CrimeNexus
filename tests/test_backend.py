import sys
import os
# Must be set before paddleocr / paddlex is ever imported anywhere
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")

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

# ── PDF Ingestion tests ────────────────────────────────────────────────────────

def _minimal_digital_pdf() -> bytes:
    """
    Build a minimal well-formed PDF using pypdf's PdfWriter.
    Injects a text stream containing account ACCT_0099 for digital extraction & NER tests.
    """
    from pypdf import PdfWriter
    from pypdf.generic import (
        NameObject, DictionaryObject, DecodedStreamObject
    )
    import io as _io

    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)

    stream_data = b"BT /F1 12 Tf 72 720 Td (NexusIntel Police Investigation Report. Identified suspect bank account ACCT_0099 linked to case FIR_0001.) Tj ET"
    stream_obj = DecodedStreamObject()
    stream_obj.set_data(stream_data)

    font_dict = DictionaryObject({
        NameObject("/Type"): NameObject("/Font"),
        NameObject("/Subtype"): NameObject("/Type1"),
        NameObject("/BaseFont"): NameObject("/Helvetica"),
    })
    page[NameObject("/Resources")] = DictionaryObject({
        NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font_dict)})
    })
    page[NameObject("/Contents")] = writer._add_object(stream_obj)

    buf = _io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def test_ingest_pdf_digital():
    """Upload a minimal digital PDF and verify text extraction succeeds."""
    pdf_bytes = _minimal_digital_pdf()
    response = client.post(
        "/api/v1/ingest/pdf",
        files={"file": ("test_digital.pdf", pdf_bytes, "application/pdf")},
        data={"force_ocr": "false", "actor": "Test Officer", "role": "Investigating Officer"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "success"
    assert "extraction" in data
    assert data["extraction"]["page_count"] >= 1
    assert "disclaimer" in data


def test_ingest_pdf_ner():
    """Upload a minimal digital PDF and verify NER extraction endpoint works."""
    pdf_bytes = _minimal_digital_pdf()
    response = client.post(
        "/api/v1/ingest/pdf/ner-extract",
        files={"file": ("test_ner.pdf", pdf_bytes, "application/pdf")},
        data={"force_ocr": "false", "actor": "Test Officer", "role": "Investigating Officer"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["status"] == "success"
    assert "extracted" in data
    # The test PDF contains ACCT_0099 — the regex NER should find it
    accounts = data["extracted"].get("accounts", [])
    account_values = [a["value"] for a in accounts]
    assert "ACCT_0099" in account_values, f"Expected ACCT_0099 in accounts, got: {account_values}"
    assert "relationships" in data
    assert "cleaned_text" in data


# ── Text Cleaning, Custom spaCy NER & Action Extraction Tests ─────────────────

def test_text_cleaning():
    """Verify hyphenation repair, ligature normalization, and token preservation."""
    from backend.services.text_cleaner import clean_text, get_text_cleaning_stats

    raw = "The inves-\ntigation con\ufb01rmed an expedited NEFT trans-\nfer of Rs. 4,50,000\xa0from account ACCT_0070."
    cleaned = clean_text(raw)

    assert "investigation" in cleaned, f"Hyphenation repair failed: {cleaned}"
    assert "transfer" in cleaned, f"Hyphenation repair failed: {cleaned}"
    assert "confirmed" in cleaned, f"Ligature replacement failed: {cleaned}"
    assert "₹4,50,000" in cleaned, f"Currency standardization failed: {cleaned}"
    assert "ACCT_0070" in cleaned, f"Account identifier mangled: {cleaned}"

    stats = get_text_cleaning_stats(raw, cleaned)
    assert stats["raw_length"] > 0
    assert stats["cleaned_length"] > 0


def test_spacy_custom_ner():
    """Verify custom NER extracts persons, locations, orgs, accounts, vehicles, phones."""
    from backend.services.nlp_service import nlp_service

    sample_text = (
        "Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1 on 12-Aug-2026. "
        "Vehicle JH-00-XX-0003 was observed parked in the bay. Both subjects are affiliated with Synthetic Logistics Group 11. "
        "Surveillance confirmed an expedited NEFT transfer of ₹4,50,000 from account ACCT_0070 to ACCT_0073. "
        "Contact was maintained via mobile phone +91 98451 10421."
    )

    extracted = nlp_service.extract_entities(sample_text)

    # Persons
    person_names = [p["name"] for p in extracted["persons"]]
    assert any("Aditya Singh" in p for p in person_names), f"Aditya Singh not found in {person_names}"
    assert any("Person Alpha" in p for p in person_names), f"Person Alpha not found in {person_names}"

    # Accounts
    acct_values = [a["value"] for a in extracted["accounts"]]
    assert "ACCT_0070" in acct_values
    assert "ACCT_0073" in acct_values

    # Vehicles
    veh_values = [v["value"] for v in extracted["vehicles"]]
    assert "JH-00-XX-0003" in veh_values

    # Phones
    phone_values = [ph["value"] for ph in extracted["phones"]]
    assert any("+91 98451 10421" in ph for ph in phone_values)

    # Organizations
    org_names = [o["name"] for o in extracted["organizations"]]
    assert any("Synthetic Logistics Group 11" in o for o in org_names), f"Org not found in {org_names}"

    # Locations
    loc_names = [l["name"] for l in extracted["locations"]]
    assert any("Synthetic Transport Hub 4-1" in l for l in loc_names), f"Location not found in {loc_names}"


def test_action_relationship_extraction():
    """Verify hybrid dependency parse and pattern matching for action verbs."""
    from backend.services.nlp_service import nlp_service

    sample_text = (
        "Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1 on 12-Aug-2026. "
        "Vehicle JH-00-XX-0003 was observed parked in the bay. Both subjects are affiliated with Synthetic Logistics Group 11. "
        "Surveillance confirmed an expedited NEFT transfer of ₹4,50,000 from account ACCT_0070 to ACCT_0073. "
        "Contact was maintained via mobile phone +91 98451 10421."
    )

    entities = nlp_service.extract_entities(sample_text)
    relationships = nlp_service.extract_relationships(sample_text, entities)

    assert len(relationships) >= 4, f"Expected at least 4 relationships, got {len(relationships)}"

    rel_types = [r["relation_type"] for r in relationships]
    assert "MET_WITH" in rel_types, f"MET_WITH not extracted: {relationships}"
    assert "AFFILIATED_WITH" in rel_types, f"AFFILIATED_WITH not extracted: {relationships}"
    assert "TRANSFERRED_FUNDS_TO" in rel_types, f"TRANSFERRED_FUNDS_TO not extracted: {relationships}"

    # Verify meeting relationship details
    met_rel = next(r for r in relationships if r["relation_type"] == "MET_WITH")
    assert met_rel["source"] == "Aditya Singh"
    assert met_rel["target"] == "Person Alpha"
    assert "Synthetic Transport Hub 4-1" in met_rel.get("location", "")

    # Verify financial transfer details
    transfer_rel = next(r for r in relationships if r["relation_type"] == "TRANSFERRED_FUNDS_TO")
    assert transfer_rel["source"] == "ACCT_0070"
    assert transfer_rel["target"] == "ACCT_0073"


def test_review_ner_extract_endpoint():
    """Verify POST /api/v1/review/ner-extract returns cleaned text, entities & relationships."""
    sample_text = "Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1. Both subjects are affiliated with Synthetic Logistics Group 11. ACCT_0070 transferred Rs 450000 to ACCT_0073."
    response = client.post(
        "/api/v1/review/ner-extract",
        json={"text": sample_text, "document_title": "Test Intelligence Brief", "actor": "Test Officer", "role": "Investigating Officer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "extracted" in data
    assert "relationships" in data
    assert "cleaned_text" in data
    assert len(data["extracted"]["persons"]) >= 2
    assert len(data["relationships"]) >= 2


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
    test_ingest_pdf_digital()
    print("[PASS] test_ingest_pdf_digital")
    test_ingest_pdf_ner()
    print("[PASS] test_ingest_pdf_ner")
    test_text_cleaning()
    print("[PASS] test_text_cleaning")
    test_spacy_custom_ner()
    print("[PASS] test_spacy_custom_ner")
    test_action_relationship_extraction()
    print("[PASS] test_action_relationship_extraction")
    test_review_ner_extract_endpoint()
    print("[PASS] test_review_ner_extract_endpoint")
    print("\nALL 16 BACKEND TESTS PASSED SUCCESSFULLY!")
