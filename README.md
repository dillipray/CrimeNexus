# NexusIntel — AI-Powered Criminal Network Analysis System
### SIH 2026 Problem Statement PS 189 / SIH26189 — Ministry of Home Affairs

> **Statutory Notice:** AI-assisted analytical report for authorized human review; not a final legal conclusion. All synthetic records, FIR narratives, telephony numbers, and entities are completely fictional demonstration artifacts.

---

## 1. Overview & Architecture

**NexusIntel** is an enterprise-grade investigative intelligence platform designed for law enforcement analysts and investigating officers. It fuses multi-source data (FIRs, CDRs, bank transactions, vehicle registrations, and geospatial sightings) into an integrated knowledge graph to identify suspicious patterns, compute network centrality, and reconstruct chronological timelines.

```
                    ┌──────────────────────────────────────────────┐
                    │               NexusIntel Web UI              │
                    │   React 18 + Vite + Lucide + Recharts + jsPDF│
                    └──────────────────────┬───────────────────────┘
                                           │
                        REST API v1 / JSON │ (Instant fallback to Client Mode)
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            FastAPI AI Backend Engine         │
                    │     NetworkX + Scikit-Learn + Python 3.12    │
                    └──────────────────────┬───────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  Graph Analytics │             │ Pattern Detector │             │  Audit & Review  │
│ Brandes Centrality             │ FR-10 Rules:     │             │ SHA-256 Chained  │
│ Bridge Detection │             │ CDR Surge, Layer-│             │ Hashes & Human-  │
│ Community Split  │             │ ing, Smurfing    │             │ in-the-loop Merge│
└──────────────────┘             └──────────────────┘             └──────────────────┘
```

### Key Modules Implemented:
1. **Interactive Knowledge Graph (Module 12)**: SVG graph with pan/zoom, link filtering, and sliding entity/edge inspectors.
2. **Investigation Timeline (Module 13)**: Multi-source chronological event stream with range scrubbers.
3. **AI Leads & Anomaly Engine (Module 10)**: FR-10.1 (CDR call surge), FR-10.2 (Cross-case linkages), FR-10.5 (Structuring/Smurfing), FR-10.6 (Bridge entity). Every lead includes a 4-step "Why am I seeing this?" reasoning trace.
4. **Telephony & Financial Intelligence (Modules 5 & 10)**: Daily CDR frequency charts and transaction flow timelines.
5. **Geospatial & Co-Location Analysis (Module 14)**: Tactical coordinate mapping with co-location alert badges.
6. **Entity Resolution & De-duplication (Modules 8 & 9)**: Side-by-side attribute matching with human confirmation, canvas-confetti, and reversible decisions.
7. **Document Ingestion & NER (Module 11)**: Free-text FIR ingestion with regex + TF-IDF dictionary matcher and low-confidence triage.
8. **Formal Investigation Reports (Module 15 & 19)**: Distinct section attribution (`OBSERVED`, `AI`, `REVIEW`) and **Client-Side One-Click PDF Export via jsPDF**.
9. **Tamper-Evident Audit Trail (Module 18)**: Append-only ledger chained with SHA-256 integrity hashes.
10. **Role-Based Access Control (RBAC)**: Switch between *Investigating Officer*, *Senior Investigator*, *Intelligence Analyst*, *Forensic Analyst*, *Auditor*, and *Admin*.

---

## 2. Quick Start Guide

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### Step 1: Start the FastAPI Backend
```bash
# From d:\Developer\projects\SIH:
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API docs will be available at: http://127.0.0.1:8000/docs*

### Step 2: Start the React Frontend
```bash
# In another terminal:
npm run dev
```
*Frontend will launch at: http://localhost:5173*

> **Dual-Mode Capability:** The frontend features automatic backend detection. If the backend is running, the top bar shows `LIVE FASTAPI BACKEND`. If offline, it falls back seamlessly to client-side mock execution with zero disruption!

---

## 3. Running Automated Tests

### Backend Unit & Integration Tests
```bash
python tests/test_backend.py
```
Validates all 10 core API endpoints: health check, case summaries, graph analytics, hybrid search, alert lifecycles, and audit logging.

### Frontend Production Build
```bash
npm run build
```
Validates compilation and packaging of all React views and CSS tokens.

---

## 4. Hackathon Evaluation Walkthrough (Demo Script)

1. **Dashboard & Case Context**: Observe KPI cards, active leads, and the duplicate resolution alert banner. Notice the active case (`CASE-2026-001`).
2. **RBAC Role Switcher**: Click the top-right profile badge to switch to *Senior Investigator (P. Sharma)* or *Forensic Analyst (A. Sen)*.
3. **Interactive Graph**: Navigate to *Network Graph*. Filter links by *Communication* or *Financial*. Click **Meera Sen** to open the Entity Drawer and inspect connected relationships.
4. **AI Leads Review**: Navigate to *AI Leads*. Click *"Why am I seeing this?"* to inspect the algorithmic explainability trace. Enter a triage note and click **Confirm Lead**.
5. **Entity Resolution**: Navigate to *Entity Resolution*. Expand **Devraj Sharma ↔ D. Sharma**. Compare phone numbers and vehicles side-by-side. Click **Confirm Merge** to trigger the confirmation effect and audit log.
6. **Geospatial Co-location**: Navigate to *Geospatial Map*. Toggle **Co-location Events (3)** to view temporal overlap at *Cafe Meridian* and *Transit Hub 4-1*.
7. **Document Ingestion**: Navigate to *Document Ingestion*. Click **Run NER Extraction** to test simulated OCR/NER on the case note.
8. **Report Generation & PDF Export**: Navigate to *Reports & PDF Export*. Add officer observations and click **Export Formal PDF** to download the signed intelligence report with statutory disclaimers.
9. **Audit Trail**: Navigate to *Audit Trail*. Confirm that every click, search, status change, and merge from the demo was cryptographically logged with a SHA-256 chained hash.
