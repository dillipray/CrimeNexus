# Product Requirements Document (PRD)
## AI-Powered Criminal Network Analysis System

**Problem Statement:** PS 189 / SIH26189
**Organization:** Ministry of Home Affairs
**Category:** Software | **Theme:** Blockchain & Cybersecurity

---

## 1. Document Control

| Field | Value |
|---|---|
| Document Title | PRD — AI-Powered Criminal Network Analysis System |
| Problem Statement ID | SIH26189 (PS 189) |
| Version | 1.0 |
| Status | Draft for hackathon submission |
| Prepared For | Smart India Hackathon, Ministry of Home Affairs (theme owner) |
| Prepared As | Student prototype — synthetic data only |
| Audience | Hackathon team, technical mentor, evaluator/jury, government stakeholder reviewer |
| Classification | Unrestricted — no real personal, criminal, telecom, banking, or intelligence data is used or referenced anywhere in this document or the associated prototype |
| Revision Policy | Version-controlled in the team's repository; every change logged with author, date, and reason |

**Reader's note:** Every dataset, name, phone number, account, FIR number, and coordinate in this document is fictional and created only to illustrate the design. No content here should be interpreted as, or is derived from, real case data, real government systems, or real individuals.

---

## 2. Executive Summary

Indian law-enforcement agencies increasingly deal with organized, networked crime — where a single case (an FIR, a financial fraud report, a surveillance note) is one thread in a much larger fabric of people, phones, accounts, vehicles, organizations, and locations. Today this fabric is invisible because the underlying records sit in different systems, different formats (structured tables, PDFs, scanned notes, free-text reports), and different cases, and cross-referencing them by hand does not scale.

This PRD defines a **decision-support platform**, not an autonomous accusation engine. The system ingests multi-source case data (in the prototype: entirely synthetic), extracts entities and relationships using NLP, resolves duplicate identities cautiously, builds a knowledge graph, layers in vector-based semantic search, graph analytics, and explainable anomaly detection, and presents all of this to a human investigator through a dashboard built around evidence, provenance, and confidence — never a bare verdict.

The prototype is scoped realistically for a hackathon timeline: a working pipeline over synthetic CSVs and fictional FIR text, a Neo4j knowledge graph, a small set of transparent suspicious-pattern rules, vector similarity search over fictional report narratives, an alert/review workflow, and an exportable report — all wrapped in role-based access control and an immutable audit log. Every screen and report is explicitly labelled as AI-assisted analytical output requiring authorized human review, and the system is architecturally forbidden from auto-labelling anyone a criminal.

Production integration with real systems (CCTNS, ICJS, NCRB, NATGRID, telecom, banking, Aadhaar, or any other restricted government data source) is explicitly out of scope for this project and would require separate legal authorization, inter-agency agreements, and government security certification that a student team cannot obtain or assume.

---

## 3. Problem Statement

**As given (PS 189 / SIH26189 — Ministry of Home Affairs, Blockchain & Cybersecurity theme):**

Modern criminal activity is organized and networked, involving associates, intermediaries, financial channels, communication links, locations, vehicles, organizations, and events. Investigators collect data from FIRs, CDRs, financial records, surveillance reports, social-media intelligence, criminal-history databases, intelligence reports, and vehicle/location/organization/case records — but this information is fragmented, unstructured, and spread across disconnected systems. As a result, investigators can miss hidden relationships, influential individuals, unusual patterns, and links between seemingly unrelated cases.

**Restated as a product problem:**

> Investigators lack a single, explainable, access-controlled workspace that converts fragmented multi-source case data into a connected, searchable, analyzable picture — one that surfaces candidate relationships and patterns for human review without ever pre-judging or auto-labelling any individual.

---

## 4. Background and Context

- Crime records in India are generated and stored across many systems and formats: FIR text (often narrative, sometimes scanned), CDR exports, bank/UPI transaction logs, informal surveillance notes, open-source social-media leads, and case management records that may or may not be linked to each other.
- An investigator manually cross-referencing a name against phones, past FIRs, financial activity, and known associates is slow, error-prone, and does not surface network-level insight (e.g., "these five otherwise unrelated cases share one financial intermediary").
- Existing case-management tools are largely record-keeping systems; they do not perform entity extraction, relationship discovery, semantic search over narrative text, or graph analytics.
- This is a **sensitive domain**: any system that appears to "decide" guilt, encodes bias, or bypasses due process would be actively harmful and undermine public trust. The product's core design constraint is therefore **decision support with mandatory human review**, not automation of judgment.
- For this hackathon, the team has **no lawful access** to CCTNS, ICJS, NCRB, NATGRID, telecom CDR systems, banking systems, or Aadhaar, and must not attempt to obtain, scrape, or simulate access to real records of real people. The entire prototype is built and demonstrated on synthetic, fictional data designed by the team.

---

## 5. Goals and Objectives

**Product goals**

1. Convert fragmented, multi-source, multi-format case data into a unified, queryable knowledge graph with full provenance.
2. Let an investigator search by person, phone, account, vehicle, case, or natural language, and get exact, semantic, and graph-based results in one place.
3. Surface non-obvious relationships and patterns (shared intermediaries, cross-case links, unusual financial or communication behaviour) with a plain-language explanation for each.
4. Keep every AI output labelled as a **lead for human review**, never a conclusion, with full traceability back to source evidence.
5. Enforce strict role-based access control, case-level permissions, and an immutable audit trail suitable for eventual real-world compliance review.
6. Demonstrate an architecture that could, after formal authorization and security certification, be extended toward production data sources — without the hackathon prototype itself touching any such source.

**Hackathon objectives (measurable)**

- Working end-to-end pipeline: synthetic ingestion → NLP extraction → entity resolution → knowledge graph → analytics/alerts → dashboard → report export.
- At least 3 explainable suspicious-pattern rules operating on synthetic data.
- Sub-3-second interactive graph exploration for a demo-scale synthetic dataset (see Section 11 for exact NFR targets).
- A complete, exportable "investigation-support report" clearly labelled as AI-assisted, not a legal conclusion.

---

## 6. Non-Goals

The following are explicitly **out of scope** for this prototype and must not be attempted:

- Integration with real CCTNS, ICJS, NCRB, NATGRID, telecom, banking, Aadhaar, or any other government or regulated data system.
- Use of any leaked, scraped, or real personally identifiable criminal, telecom, banking, or intelligence data.
- Automated determination or labelling of any person as a criminal, suspect, or guilty party.
- Predictive policing based on demographic, religious, caste, ethnic, or other protected attributes.
- Facial recognition or biometric identification of any kind.
- Fully autonomous investigation or case closure without human involvement.
- Nationwide or multi-agency production deployment.
- Legal-grade evidentiary certification of any output (all outputs are analytical leads only).

---

## 7. Users and Stakeholders

Role-based access control (RBAC) governs every screen, API, and data field. No role sees more than it needs.

| Role | Primary Needs | Key Permissions | Restrictions |
|---|---|---|---|
| **Investigating Officer** | Work assigned cases; search entities; view graph/timeline/map; act on alerts | Read/write on assigned cases; create notes; acknowledge/escalate alerts; export reports for own cases | Cannot view cases not assigned to them; cannot alter audit logs; cannot manage users |
| **Senior Investigator / Supervisor** | Oversee a team's cases; approve entity merges; approve escalations | All Investigating Officer permissions across supervised cases; approve entity-resolution merges; reassign cases; approve report release | Cannot manage system-wide roles or infrastructure |
| **Intelligence Analyst** | Cross-case pattern analysis; semantic search across authorized cases | Read across authorized case pools (not case-restricted to one case); run graph analytics; flag cross-case leads | Cannot edit case records; cannot approve legal actions |
| **District-Level Administrator** | Manage users and cases within a district; oversee data quality | Create/deactivate district-level users; assign cases within district; view district audit summaries | Cannot access other districts' case data; cannot alter core system configuration |
| **State-Level Administrator** | Oversee district admins; state-wide reporting; policy configuration | Manage district admins; configure state-level access policy; view state-wide (non-case-content) usage metrics | Cannot bypass case-level access control; cannot view case content outside authorization |
| **Forensic / Data Analyst** | Validate extracted entities/relationships; tune extraction and matching | Access to extraction confidence queues; correct/approve low-confidence NLP and entity-resolution results | Cannot access unrelated case narratives beyond what is needed for validation |
| **System Administrator** | Platform uptime, configuration, integration health, backups | Manage ingestion connectors (mock, in prototype), system configuration, backups, key rotation | No access to case content; access is infrastructure-only, itself logged and auditable |
| **Auditor / Compliance Officer** | Independent oversight of system use and access | Read-only access to full audit trail, access logs, model version history, alert-outcome statistics | Cannot modify any data; cannot access raw case content beyond what audit requires |

**Other stakeholders:** Ministry of Home Affairs (problem owner), hackathon jury/evaluators, academic mentor, and — conceptually, for future production — state police departments, forensic labs, and judicial oversight bodies. None of these stakeholders are represented by real accounts or data in the prototype.

---

## 8. Product Vision

A secure, explainable, investigator-first intelligence workspace that:

- Treats every AI output as a **lead**, never a verdict — always traceable to source evidence, always carrying a confidence label, always awaiting human review.
- Unifies structured records (CDRs, transactions, vehicles) and unstructured narratives (FIRs, surveillance notes) into one connected knowledge graph.
- Lets an investigator move fluidly between exact search, semantic search, and graph exploration without needing to know which underlying database holds the answer.
- Is built, from day one, around access control, provenance, and audit — so that adopting the design for a real (authorized, certified) deployment is a matter of swapping mock connectors for approved ones, not re-architecting the system.

---

## 9. Assumptions and Constraints

**Assumptions**

- All data used in development, testing, and demonstration is synthetic and fictional, created by the team.
- The hackathon demo runs on a single machine or small cloud instance using Docker Compose; it does not need to support real concurrent multi-agency load.
- English-language NLP models are sufficient for the MVP; Hindi/Indic-language support is designed for but not fully implemented in the prototype.
- Neo4j Community Edition and PostgreSQL with pgvector are sufficient for prototype-scale graph and vector workloads.
- No real user accounts belonging to actual officers exist; demo logins are fictional role accounts (e.g., `demo_investigator`, `demo_supervisor`).

**Constraints**

- **Legal/ethical constraint (hard):** no real CCTNS, ICJS, NCRB, telecom, banking, NATGRID, intelligence, Aadhaar, or other restricted data may be used, scraped, or simulated as if real.
- **Labelling constraint (hard):** the system must never output a label declaring someone "a criminal." Only neutral terms are permitted (e.g., "entity of interest," "linked entity," "subject for review," "potentially relevant entity").
- **Human-in-the-loop constraint (hard):** every AI-generated match, relationship, or alert requires human acknowledgement before it can affect any case status.
- Time constraint: hackathon delivery window (typically a few days to a few weeks) limits scope to the MVP defined in Section 23.
- Team constraint: a small student team (assume 6 members) with mixed backend/frontend/ML/security skills.

---

## 10. Functional Requirements

This section specifies the 16 primary product modules. Each module lists functional requirements (FR) with an ID for traceability.

### 10.1 Module 1 — Secure Authentication and Role Management

| ID | Requirement |
|---|---|
| FR-1.1 | System shall support username/password authentication with bcrypt/argon2 password hashing. |
| FR-1.2 | System shall be SSO-ready (SAML2/OIDC connector interface defined, even if only a local IdP is used in the demo). |
| FR-1.3 | System shall support MFA (TOTP) as a configurable, enable-ready feature; MFA may be stubbed in the prototype but the data model and login flow must accommodate it. |
| FR-1.4 | System shall enforce RBAC as defined in Section 7, evaluated on every API call, not just at the UI layer. |
| FR-1.5 | System shall support case-level permission grants (a user may hold a role but still need explicit case assignment to see that case's content). |
| FR-1.6 | System shall support field-level masking (e.g., hide raw phone numbers from roles not authorized to see PII-equivalent synthetic fields). |
| FR-1.7 | System shall enforce configurable session timeout (default: 15 minutes idle for investigator roles, 30 minutes for admin roles). |
| FR-1.8 | System shall log every login, logout, failed login, and device/IP fingerprint. |
| FR-1.9 | System shall lock an account after 5 consecutive failed login attempts, with admin-controlled unlock. |
| FR-1.10 | System shall enforce a configurable password policy (minimum length, complexity, rotation interval, reuse prevention). |

### 10.2 Module 2 — Case and Data Management

| ID | Requirement |
|---|---|
| FR-2.1 | Users with appropriate role shall create a case with case ID, title, category, priority, and status. |
| FR-2.2 | Supervisors/admins shall assign cases to one or more investigating officers. |
| FR-2.3 | System shall let authorized users link data sources (FIR, CDR, transaction file, surveillance note, etc.) to a case. |
| FR-2.4 | System shall maintain case status (e.g., Open, Under Investigation, Under Review, Closed, Reopened) and priority (Low/Medium/High/Critical). |
| FR-2.5 | System shall record data provenance for every record: source system/file, ingestion timestamp, ingesting user or job, and original vs. derived flag. |
| FR-2.6 | System shall version data records — an edit creates a new version, the prior version remains retrievable. |
| FR-2.7 | System shall write an immutable, append-only audit entry for every create/update/delete/view-of-sensitive-field action. |

### 10.3 Module 3 — Automated Data Ingestion

| ID | Requirement |
|---|---|
| FR-3.1 | System shall provide a secure REST API for structured record ingestion (JSON/CSV payloads). |
| FR-3.2 | System shall support batch file import (CSV/PDF/DOCX) via authenticated upload. |
| FR-3.3 | System shall define an SFTP-ready ingestion interface (implemented as a mock/simulated SFTP drop folder in the prototype). |
| FR-3.4 | System shall define a webhook/event-stream ingestion interface (implemented as a mock event publisher in the prototype). |
| FR-3.5 | **Prototype only:** all of the above connect to mock connectors that emit synthetic data — no connector may be pointed at any real production or government system. |
| FR-3.6 | System shall support scheduled ingestion jobs (e.g., poll a mock folder every N minutes) via Celery beat or equivalent. |
| FR-3.7 | System shall validate incoming data against a schema before acceptance; invalid records go to a quarantine queue with a reason code. |
| FR-3.8 | System shall map source-specific fields to the canonical schema (schema mapping config per source type). |
| FR-3.9 | System shall perform duplicate detection at ingestion time (exact-match hashing, plus a queue for probable duplicates from Module 6). |
| FR-3.10 | System shall normalize formats (phone numbers, dates, currency, vehicle plate formats) into canonical representations while retaining the original raw value. |
| FR-3.11 | System shall retry failed ingestion jobs with exponential backoff and route permanently failed items to a dead-letter queue visible to System Administrators. |

**Prototype vs. production integration (explicit separation):**

| Aspect | Prototype (this project) | Future production (out of scope here) |
|---|---|---|
| Data source | Synthetic CSV/JSON/PDF generated by the team | Real CCTNS/ICJS/NCRB/telecom/banking systems |
| Connector | Mock REST endpoints, mock SFTP folder, mock event publisher | Government-approved, security-certified interfaces under formal data-sharing agreements |
| Authorization | None required (no real data) | Requires inter-agency MoU, legal authorization, security audit, data-protection clearance |
| Network | Fully local/sandboxed | Government-controlled, likely air-gapped or dedicated secure network (e.g., NATGRID-class controls) |

### 10.4 Module 4 — Multi-Source Data Processing

| ID | Requirement |
|---|---|
| FR-4.1 | System shall accept and process: FIR/police report text, PDF/scanned documents, CDR records, financial transactions, surveillance notes, social-media intelligence records (synthetic), vehicle records, organization records, location records, and historical case records. |
| FR-4.2 | System shall preserve the original source content immutably (object storage, checksummed) and create a separate processed/analytical copy. |
| FR-4.3 | Every processed record shall carry a pointer back to its original source artifact (evidence reference). |

### 10.5 Module 5 — Document Processing and NLP

| ID | Requirement |
|---|---|
| FR-5.1 | OCR shall convert scanned/PDF documents to text (Tesseract or PaddleOCR), retaining page/region coordinates for evidence highlighting. |
| FR-5.2 | System shall clean extracted text (de-hyphenation, whitespace normalization, OCR-noise correction heuristics). |
| FR-5.3 | System shall detect document language automatically. |
| FR-5.4 | System shall provide a translation-readiness hook (interface defined; MVP ships English-only, non-English routed to a "needs translation" queue). |
| FR-5.5 | System shall perform Named Entity Recognition for persons, organizations, locations, phone numbers, vehicle numbers, account numbers, and dates. |
| FR-5.6 | System shall normalize extracted entities (case-folding, whitespace, common abbreviation expansion) before candidate matching. |
| FR-5.7 | System shall extract candidate relationships between co-occurring entities using dependency-parse/pattern rules and/or a fine-tuned relation-extraction model. |
| FR-5.8 | System shall extract dates/events and link them to entities and documents for the timeline module. |
| FR-5.9 | System shall extract phone-number and vehicle-number patterns using regex + validation libraries tuned to Indian formats. |
| FR-5.10 | System shall extract account/transaction references from financial narratives where present. |
| FR-5.11 | System shall extract location mentions and attempt geocoding against the synthetic gazetteer. |
| FR-5.12 | Every extraction shall carry a confidence score (0–1). |
| FR-5.13 | Extractions below a configurable confidence threshold (default 0.6) shall be routed to a human verification queue and shall not auto-populate the knowledge graph until reviewed. |
| FR-5.14 | Architecture shall support pluggable language models so Hindi and other Indian-language NLP models can be added later without redesign (e.g., via IndicNLP/IndicBERT-compatible pipeline stage). |


### 10.6 Module 6 — Entity Resolution

| ID | Requirement |
|---|---|
| FR-6.1 | System shall identify candidate duplicate entities despite spelling variants, transliteration differences, name-order changes, abbreviations, shared addresses, duplicate phone identifiers, multiple organization name variants, and vehicle-format differences. |
| FR-6.2 | System shall classify every candidate pair into exactly one of: **Confirmed match**, **Probable match**, **Possible match**, **Unresolved match**. |
| FR-6.3 | Matching shall use a blocking step (phonetic keys, shared identifiers) followed by a scoring step (string similarity — Jaro-Winkler/Levenshtein — plus attribute agreement: shared phone, shared address, shared case). |
| FR-6.4 | Thresholds (illustrative, configurable): score ≥ 0.92 with a shared strong identifier → Probable match queued for approval; score ≥ 0.97 with two+ independent shared identifiers may be proposed as Confirmed but **still requires human approval before merge**; below 0.75 → Unresolved (not surfaced as a suggestion). |
| FR-6.5 | System shall **never auto-merge** entities, regardless of confidence score. |
| FR-6.6 | System shall provide a human approval workflow: reviewer sees both candidate records side-by-side with matching evidence, and approves, rejects, or marks "need more data." |
| FR-6.7 | Approved merges shall be reversible by a supervisor, with the merge/unmerge action fully audited. |

### 10.7 Module 7 — Knowledge Graph

**Node types:** Person, Phone, Account, Transaction, Case, FIR, Location, Vehicle, Organization, Event, Document, Device, Communication Record.

**Relationship types:** `MENTIONED_IN`, `USES_PHONE`, `CALLED`, `SENT_SMS_TO`, `OWNS_ACCOUNT`, `TRANSFERRED_TO`, `USED_VEHICLE`, `MEMBER_OF`, `ASSOCIATED_WITH`, `PRESENT_AT`, `OCCURRED_AT`, `CONNECTED_TO`, `REFERENCED_BY`, `SAME_AS_CANDIDATE`.

Every relationship edge carries this metadata (property set):

| Property | Type | Description |
|---|---|---|
| `source` | string | Originating data source/system identifier |
| `timestamp` | datetime | When the underlying event/record occurred |
| `confidence` | float 0–1 | Extraction or matching confidence |
| `case_id` | string | Owning/associated case(s) |
| `evidence_ref` | string | Pointer to source document/record for evidence panel |
| `relationship_type` | enum | One of the types above |
| `provenance` | object | `{ ingested_by, ingested_at, extraction_method, model_version }` |

| ID | Requirement |
|---|---|
| FR-7.1 | System shall persist the graph in Neo4j with the node/relationship schema above. |
| FR-7.2 | Every node and edge write shall include full provenance metadata; edges lacking `evidence_ref` are rejected at write time. |
| FR-7.3 | `SAME_AS_CANDIDATE` edges shall be created for Probable/Possible entity-resolution matches and shall never imply identity until approved (Module 6), at which point the two nodes are merged, not just edge-connected. |
| FR-7.4 | Graph writes shall be transactional per ingestion batch to avoid partial/corrupted graph states. |

### 10.8 Module 8 — Semantic Search and Vector Retrieval

Embeddings are used specifically where **wording varies but meaning is similar** — this is the case vector search is good at, and the case exact/keyword/graph search is bad at.

| Use case | Why vector search helps |
|---|---|
| Similar FIR narratives | Two FIRs describing a similar incident rarely use identical wording |
| Similar intelligence reports | Free-text analyst notes vary in phrasing and structure |
| Similar modus-operandi descriptions | MO patterns are described narratively, not in fixed fields |
| Natural-language investigation queries | Investigators ask "cases involving fraud through fake job offers," not SQL |
| Related documents with different wording | Synonyms, paraphrase, translation drift |
| Semantic discovery across unstructured reports | Surfacing non-obvious thematic links across many reports |

| ID | Requirement |
|---|---|
| FR-8.1 | System shall generate sentence/paragraph embeddings for FIR narratives, surveillance notes, and intelligence report text using a sentence-transformer model. |
| FR-8.2 | System shall store embeddings in PostgreSQL with the `pgvector` extension (prototype); Neo4j vector indexes are noted as an alternative for graph-colocated similarity queries. |
| FR-8.3 | System shall support top-k nearest-neighbour retrieval with a configurable similarity threshold. |
| FR-8.4 | Every vector search result shall return: source document, relevant text excerpt, case ID, similarity score, date, data provenance, and shall be filtered by the requesting user's access control before display. |

**Why vector search must complement, not replace, other search modes:**

- **Exact search** (e.g., an exact phone number or FIR number) needs perfect precision — embeddings can retrieve "close" matches that are wrong; exact/indexed lookups guarantee correctness for identifiers.
- **Keyword search** is needed when the investigator knows a specific term that must appear (e.g., a specific place name); pure semantic search can miss or dilute exact-term relevance.
- **Relational search** (SQL filters: date ranges, case status, amount thresholds) is precise and auditable in a way embeddings are not.
- **Graph traversal** answers structural questions ("who is 2 hops from X") that embeddings cannot answer at all — embeddings compare content, not network structure.

The MVP therefore implements a **hybrid retrieval layer**: a query fan-out to keyword/exact search, vector search, and graph traversal, with results merged and clearly labelled by which mechanism produced them.

### 10.9 Module 9 — Graph Analytics

| ID | Requirement |
|---|---|
| FR-9.1 | System shall compute degree centrality, betweenness centrality, and PageRank per case-scoped or cross-case subgraph, using Neo4j Graph Data Science (or NetworkX for prototype-scale subgraphs). |
| FR-9.2 | System shall run community detection (e.g., Louvain) to surface clusters of tightly connected entities. |
| FR-9.3 | System shall support connected-component analysis to identify isolated vs. networked entities. |
| FR-9.4 | System shall support shortest-path and common-neighbour queries between any two selected entities. |
| FR-9.5 | System shall support temporal graph analysis (filtering/animating the graph by time window). |
| FR-9.6 | System shall support cross-case relationship analysis (shared entities across two or more case IDs), subject to the requesting user's cross-case access rights. |
| FR-9.7 | System shall support "suspicious subgraph" detection — dense, unusually structured, or bridging subgraphs flagged for analyst review. |
| FR-9.8 | **All centrality/analytics outputs shall be labelled "analytical relevance" or "network importance," never "proof of criminality" or similar, anywhere in the UI or reports.** |

### 10.10 Module 10 — Suspicious Pattern and Anomaly Detection

| ID | Pattern | Detection approach |
|---|---|---|
| FR-10.1 | Sudden increase in call frequency | Deterministic rule: rolling-window call count vs. entity's historical baseline (z-score or percentage-change threshold) |
| FR-10.2 | Repeated connections across multiple cases | Deterministic rule: same entity ID appears in ≥ N distinct case subgraphs |
| FR-10.3 | Common phone/account across unrelated cases | Deterministic rule: shared identifier join across case-scoped tables |
| FR-10.4 | Rapid money movement through several accounts | Graph pattern: chain of `TRANSFERRED_TO` edges within a short time window (layering-style pattern) |
| FR-10.5 | Multiple transfers just below a configured threshold | Deterministic rule: transaction amount within X% below a configurable reporting threshold, repeated ≥ N times |
| FR-10.6 | New entities connecting to multiple existing clusters | Graph rule: new node's edges span ≥ N previously distinct communities |
| FR-10.7 | Unusual activity at shared locations | Statistical: co-location frequency exceeding baseline for unrelated entities |
| FR-10.8 | Repeated vehicle appearances | Deterministic rule: same vehicle ID at ≥ N distinct case-linked events |
| FR-10.9 | Unusual changes in communication/transaction behaviour | Statistical anomaly detection (e.g., isolation forest on behavioural features) |
| FR-10.10 | Temporal relationships across communication, travel, financial activity, and incidents | Rule + statistical: event sequences within a configurable time window across categories |

**Hybrid approach:**

- **Deterministic rules** (FR-10.1–10.3, 10.5, 10.6, 10.8) are transparent, fully explainable, and form the MVP's 3+ required rules.
- **Statistical anomaly detection** (FR-10.7, 10.9) flags outliers without requiring labelled training data — appropriate given synthetic data has no real "ground truth" of guilt.
- **Supervised ML** is explicitly reserved for a future phase, and only introduced once appropriately labelled data exists (e.g., analyst-confirmed lead outcomes accumulated over time) — the prototype does not claim a supervised classifier trained on real outcomes.
- **Human feedback** (false-positive marking) is captured from day one so any future model has a genuine, ethically-sourced training signal.

| ID | Requirement |
|---|---|
| FR-10.11 | Every alert shall display: alert type, triggering data, time period, related entities, related cases, confidence, severity, a plain-language explanation, a recommended human-review action, and a false-positive feedback control. |


### 10.11 Module 11 — Investigator Dashboard

| ID | Requirement |
|---|---|
| FR-11.1 | Responsive web dashboard (desktop-first, tablet-usable) with secure login. |
| FR-11.2 | Global search bar supporting person/phone/account/vehicle/case/free-text query, returning a merged exact + semantic + graph result set. |
| FR-11.3 | Case dashboard: list of assigned/authorized cases with status, priority, last activity. |
| FR-11.4 | Entity profile page (see Module 12). |
| FR-11.5 | Interactive graph view (Cytoscape.js) with zoom, filter, expand-on-click, and node/edge detail panel. |
| FR-11.6 | Timeline view (see Module 13). |
| FR-11.7 | Location map view (see Module 14). |
| FR-11.8 | Financial-flow view (Sankey-style or directed graph of transactions). |
| FR-11.9 | Call-network view (graph filtered to Phone/Communication Record nodes). |
| FR-11.10 | Organization-connections view (graph filtered to Organization/Member/Associate nodes). |
| FR-11.11 | Similar-document search panel (vector search results with excerpts). |
| FR-11.12 | Alerts and prioritization panel (see Module 15). |
| FR-11.13 | Evidence panel: shows source document/record for any selected node, edge, or alert. |
| FR-11.14 | Data-source panel: shows which source systems contributed to the current view, with provenance and ingestion timestamps. |
| FR-11.15 | Exportable investigation report (see Module 16). |
| FR-11.16 | Audit history view (per case and, for auditors, system-wide). |
| FR-11.17 | The dashboard's language, icons, and workflows are designed for investigators (domain experts), not data scientists — no exposed model internals, hyperparameters, or raw embedding vectors in the main UI. |

### 10.12 Module 12 — Entity Profile Page

| ID | Requirement |
|---|---|
| FR-12.1 | Display a neutral entity label (e.g., "Entity P0001 — linked entity," never "Suspect X"). |
| FR-12.2 | Display known identifiers (name variants, IDs) with provenance per identifier. |
| FR-12.3 | Display connected phones, accounts, vehicles, organizations, locations, cases, communications, and transactions, each with a link to supporting evidence. |
| FR-12.4 | Display a chronological mini-timeline of the entity's events. |
| FR-12.5 | Display similar reports (vector search scoped to this entity's mentions). |
| FR-12.6 | Display **separate, explainable indicators** (e.g., "Appears in 4 cases," "High betweenness in Case C1002 subgraph," "3 unresolved entity-match candidates") rather than a single unexplained "criminal score." |
| FR-12.7 | Display data confidence per fact shown (e.g., "phone linkage: Probable match, 0.89"). |
| FR-12.8 | Display human review status for every AI-suggested fact about this entity (Reviewed / Pending review / Rejected). |

### 10.13 Module 13 — Timeline Analysis

| ID | Requirement |
|---|---|
| FR-13.1 | Chronological view aggregating calls, messages, transactions, meetings, location events, FIR incidents, vehicle sightings, organization events, and report publication dates. |
| FR-13.2 | Filterable by date range, case, entity, event type, source, and confidence. |
| FR-13.3 | Each timeline event links to its evidence source and provenance. |

### 10.14 Module 14 — Geospatial Analysis

| ID | Requirement |
|---|---|
| FR-14.1 | Map view of case locations, vehicle sightings, and synthetic "tower events" using fictional/generalized coordinates only. |
| FR-14.2 | Shared-location detection: flag when ≥ 2 entities of interest co-occur at the same generalized location within a time window. |
| FR-14.3 | Network clusters displayed by area (spatial clustering overlay). |
| FR-14.4 | Location filters by date, case, and entity. |
| FR-14.5 | Heatmap of event density using non-sensitive synthetic coordinates (generalized to at least a locality/grid-cell level, never a precise real address). |
| FR-14.6 | Time-based location playback (scrub a time slider to replay location events chronologically). |

### 10.15 Module 15 — Alert and Review Workflow

**Status lifecycle:** New → Under Review → (Confirmed Analytical Lead | False Positive | Escalated | Requires More Data) → Closed.

| ID | Requirement |
|---|---|
| FR-15.1 | Alerts are generated automatically by Module 10 rules/models and start in status "New." |
| FR-15.2 | Alerts can be assigned to a specific investigator or analyst. |
| FR-15.3 | Assignee must acknowledge an alert, transitioning it to "Under Review." |
| FR-15.4 | Analyst can escalate an alert to a supervisor. |
| FR-15.5 | Analyst can mark an alert "False Positive" with a mandatory reason field (captured for future model feedback). |
| FR-15.6 | Analyst can attach evidence notes/documents to an alert. |
| FR-15.7 | Supervisor approval is required before an alert is marked "Confirmed Analytical Lead." |
| FR-15.8 | Every state transition is written to the immutable audit trail with actor, timestamp, and reason. |
| FR-15.9 | "Requires More Data" status routes the alert back to the ingestion/analyst queue with a note on what is missing. |

### 10.16 Module 16 — Report Generation

| ID | Requirement |
|---|---|
| FR-16.1 | Generate a structured report containing: case summary, search criteria used, relevant entities, graph summary, key relationships, timeline, financial links, communication links, location links, alerts, supporting evidence references, confidence and limitations section, analyst notes, and audit metadata. |
| FR-16.2 | Every generated report shall display, prominently and unmissably (header and footer): **"AI-assisted analytical report for authorized human review; not a final legal conclusion."** |
| FR-16.3 | Reports exportable as PDF and JSON. |
| FR-16.4 | Report generation itself is an audited action (who generated, when, for which case, with what filters). |


---

## 11. Non-Functional Requirements

| Category | Requirement | Target (prototype) |
|---|---|---|
| Search response time | Exact/keyword search | ≤ 1.0 s (p95) for demo-scale dataset |
| Search response time | Vector semantic search | ≤ 1.5 s (p95) for top-10 retrieval |
| Graph rendering | Interactive graph view | Smooth interaction up to ~500 nodes / ~1500 edges rendered at once; beyond that, server-side filtering/pagination kicks in |
| API response time | Standard CRUD/read endpoints | ≤ 500 ms (p95) |
| Document processing throughput | OCR + NLP pipeline | ≥ 5 documents/minute on prototype hardware (single worker) |
| Concurrent users | Demo/prototype | ≥ 20 concurrent simulated users without degradation |
| Batch ingestion volume | Prototype synthetic load | ≥ 10,000 records per batch job without failure |
| Alert generation latency | From triggering data ingestion to alert creation | ≤ 2 minutes for rule-based alerts |
| Availability target | Prototype demo environment | Best-effort (hackathon); production target for future phase: 99.5% |
| Backup/recovery target | Prototype | Daily backup, restore verified in demo; production target: RPO ≤ 1 hour, RTO ≤ 4 hours |
| Horizontal scaling | Stateless API layer | Designed to scale horizontally behind a load balancer (not required at hackathon scale) |
| Graph partitioning/filtering | Large graphs | Case-scoped and time-scoped subgraph queries by default; full-graph queries require explicit elevated permission |
| Caching | Frequent queries | Redis cache for hot entity profiles and repeated searches |
| Asynchronous processing | Ingestion, OCR, NLP, analytics | Celery + Redis task queue; UI never blocks on long-running jobs |
| Model inference optimization | NLP/embedding inference | Batch inference where possible; GPU optional, CPU-only fallback supported for hackathon hardware |

---

## 12. User Journeys

**Primary end-to-end journey**

1. Authorized officer logs in (RBAC + session established).
2. Officer opens or is assigned a case.
3. System has already (or on-demand) processed authorized synthetic data feeds linked to the case.
4. Officer searches for a person, phone, vehicle, account, or case using the global search bar.
5. System returns a merged result set: exact matches, semantic (vector) matches, and graph-adjacent matches, each labelled by mechanism.
6. Officer opens an entity profile from the results.
7. System displays all connected entities, each with evidence links and confidence.
8. Officer applies time, source, relationship-type, and confidence filters to focus the graph/timeline.
9. System displays any suspicious patterns relevant to this entity/case, each with a plain-language explanation.
10. Officer opens the evidence panel to inspect the underlying source document/record for a pattern or relationship.
11. Officer acknowledges or rejects the associated alert (with mandatory reason if rejecting).
12. Officer adds an analytical note to the case or entity.
13. Officer (or supervisor) generates an investigation-support report, clearly labelled as AI-assisted.
14. Every action above is written to the immutable audit log, viewable later by supervisors/auditors.

---

## 13. User Stories and Acceptance Criteria

**Login**
User Story: As an investigating officer, I want to log in securely, so that I can access only the cases I am authorized to work on.
Acceptance Criteria:
- Given valid credentials, When I submit the login form, Then I am authenticated and shown only cases assigned to me.
- Given 5 consecutive failed attempts, When I try a 6th time, Then my account is locked and an admin notification is logged.

**Search by person**
User Story: As an investigating officer, I want to search for a person by name, so that I can find all records and relationships linked to them.
Acceptance Criteria:
- Given a partial or full name, When I search, Then I see exact-match, probable-match, and semantically-related results, each labelled with its match type and confidence.
- Given a person with no results, When I search, Then I see a clear "no matches found" empty state, not an error.

**Search by phone**
User Story: As an investigating officer, I want to search by phone number, so that I can find every entity and case linked to that number.
Acceptance Criteria:
- Given a valid phone-number format, When I search, Then I see all `USES_PHONE` linked persons and associated cases with evidence references.
- Given a malformed phone number, When I search, Then I receive an inline validation message before the query is submitted.

**Search by case**
User Story: As an investigating officer, I want to search by case ID, so that I can quickly navigate to a specific investigation.
Acceptance Criteria:
- Given a valid case ID I am authorized for, When I search, Then I am taken directly to that case dashboard.
- Given a valid case ID I am NOT authorized for, When I search, Then I see an "access restricted" message, not the case content.

**Search by natural-language query**
User Story: As an intelligence analyst, I want to search using a plain-language description, so that I can find relevant reports without knowing exact keywords.
Acceptance Criteria:
- Given a natural-language query, When I submit it, Then I receive top-k semantically similar documents with excerpt, similarity score, case ID, and source.
- Given a query with no result above the similarity threshold, When I submit it, Then I see a message suggesting keyword search as an alternative.

**View graph**
User Story: As an investigating officer, I want to view an entity's connection graph, so that I can visually understand its relationships.
Acceptance Criteria:
- Given an entity profile, When I open the graph view, Then I see nodes/edges with type-based styling and can click any node for detail.
- Given a graph exceeding the render limit, When I open the graph view, Then I see a filtered default view with an option to expand further.

**Filter graph**
User Story: As an intelligence analyst, I want to filter the graph by time, relationship type, and confidence, so that I can focus on relevant connections.
Acceptance Criteria:
- Given active filters, When I apply them, Then only matching nodes/edges remain visible and the filter state is shown clearly.
- Given I clear all filters, When I do so, Then the full authorized graph view is restored.

**View timeline**
User Story: As an investigating officer, I want to see a chronological timeline for an entity or case, so that I can understand the sequence of events.
Acceptance Criteria:
- Given an entity or case, When I open the timeline, Then events are shown in chronological order with type icons and source links.
- Given a selected date range filter, When applied, Then only events within that range are shown.

**View similar reports**
User Story: As an intelligence analyst, I want to see reports similar to the one I'm reading, so that I can spot related cases.
Acceptance Criteria:
- Given an open FIR/report, When I request similar reports, Then I see a ranked list with similarity scores and excerpts, filtered to my access rights.

**Review alert**
User Story: As an investigating officer, I want to review a generated alert, so that I can decide whether it merits further investigation.
Acceptance Criteria:
- Given a "New" alert assigned to me, When I open it, Then I see triggering data, explanation, related entities/cases, and available actions.
- Given I mark it "False Positive," When I submit, Then a reason is required and the action is audited.

**Assign alert**
User Story: As a senior investigator, I want to assign an alert to a team member, so that review responsibility is clear.
Acceptance Criteria:
- Given an unassigned alert, When I assign it to an officer, Then that officer is notified and the alert status/owner updates accordingly.

**Add analyst note**
User Story: As an intelligence analyst, I want to add a note to an entity or case, so that my observations are recorded for other authorized investigators.
Acceptance Criteria:
- Given an entity or case, When I add a note, Then it is timestamped, attributed to me, and visible to others authorized on that case.

**Export report**
User Story: As a senior investigator, I want to export an investigation-support report, so that I can share findings with authorized stakeholders.
Acceptance Criteria:
- Given a case with sufficient data, When I generate a report, Then it includes the mandatory AI-assisted disclaimer and all required sections (Section 16).
- Given I export as PDF or JSON, When the export completes, Then the action is logged in the audit trail.

**View audit trail**
User Story: As an auditor, I want to view the full audit trail for a case, so that I can verify appropriate access and actions were taken.
Acceptance Criteria:
- Given my auditor role, When I open a case's audit trail, Then I see every action (who, what, when) in immutable, chronological order.
- Given I attempt to edit an audit entry, When I try, Then the system rejects the action (audit logs are append-only).

**Manage user access**
User Story: As a district-level administrator, I want to manage user accounts and role assignments within my district, so that access stays appropriately scoped.
Acceptance Criteria:
- Given a new officer joining my district, When I create their account, Then they receive the correct default role and no case access until explicitly assigned.
- Given I attempt to grant access outside my district, When I try, Then the system blocks the action.

**Process low-confidence extracted entities**
User Story: As a forensic/data analyst, I want to review low-confidence extracted entities, so that only verified information enters the knowledge graph.
Acceptance Criteria:
- Given an extraction below the confidence threshold, When I open the review queue, Then I see the source text, the candidate entity, and options to approve, correct, or reject.
- Given I approve a correction, When I submit, Then the corrected entity (not the raw low-confidence guess) is written to the graph with my approval recorded in provenance.


---

## 14. System Architecture

### 14.1 Prototype Architecture (Hackathon Stack)

| Layer | Technology | Purpose | Optional? |
|---|---|---|---|
| Frontend | React.js / Next.js | Investigator dashboard UI | Core |
| Graph visualization | Cytoscape.js | Interactive network graph rendering | Core |
| Backend API | Python FastAPI | REST API, business logic, auth enforcement | Core |
| Relational database | PostgreSQL | Case/user/entity/transaction structured data, provenance, audit log | Core |
| Vector search | pgvector (PostgreSQL extension) | Embedding storage + nearest-neighbour search for semantic search | Core |
| Graph database | Neo4j (Community Edition) | Knowledge graph storage, traversal, and analytics (via GDS library) | Core |
| Full-text/keyword search | PostgreSQL full-text search (upgradeable to Elasticsearch) | Exact/keyword search complementing vector search | PG full-text: Core; Elasticsearch: Optional (scale-up) |
| NLP | spaCy, Hugging Face Transformers | NER, relation extraction, embeddings | Core |
| OCR | Tesseract (or PaddleOCR for harder scans) | Text extraction from scanned/PDF documents | Core |
| ML / graph analytics | scikit-learn, XGBoost, NetworkX, Neo4j GDS | Anomaly scoring, centrality, community detection | Core (NetworkX/GDS); XGBoost: Optional, only if/when labelled feedback data exists |
| Background processing | Celery + Redis | Async ingestion, OCR, NLP, analytics jobs | Core |
| Object storage | Encrypted local/object storage (e.g., MinIO for prototype) | Immutable original-source document storage | Core |
| Authentication | JWT (prototype), SSO-ready design | Session/auth tokens; production path to SAML2/OIDC | JWT: Core; SSO: Production-readiness only |
| Deployment | Docker Compose | Single-command local/demo deployment | Core |

**Component diagram (textual):**

```
[React/Next.js Dashboard] --HTTPS/JWT--> [FastAPI Backend]
                                              |
        +-------------------------------------+-------------------------------------+
        |                    |                    |                    |             |
   [PostgreSQL]         [pgvector]           [Neo4j]           [Object Storage]  [Redis/Celery]
   (structured,         (embeddings)        (graph +               (raw docs)     (async jobs:
   provenance,                              GDS analytics)                         ingestion, OCR,
   audit log)                                                                      NLP, alerts)
        ^                                                                              |
        |                                                                              v
   [Mock Ingestion Connectors: REST / batch upload / mock-SFTP / mock-webhook] <--- synthetic data only
```

### 14.2 Enterprise-Ready Future Architecture (conceptual — not implemented in prototype)

For a future, authorized, security-certified deployment, the same logical modules would map onto:

- **Zero-trust network segmentation**, with ingestion connectors deployed inside government-controlled network boundaries, never reachable from the public internet.
- **Approved, certified interfaces** to CCTNS/ICJS/NCRB/telecom/banking systems, established only under formal inter-agency agreements and security review — not built or assumed by this project.
- **Managed graph and vector infrastructure** (e.g., Neo4j Enterprise / AuraDS, managed pgvector or a dedicated vector database) sized for national-scale data volumes.
- **Elasticsearch or OpenSearch** replacing PostgreSQL full-text search at scale.
- **HSM-backed key management** and SSO integration with a government identity provider.
- **Formal MLOps** pipeline for any future supervised models, with bias testing, versioning, and a human-oversight board.

This future-state architecture is described here **only to show the design does not need to be re-architected later** — no part of it is built, connected, or claimed as functional in this hackathon deliverable.

---

## 15. Data Architecture

### 15.1 Synthetic Dataset Files

All files below are fictional, generated by the team, and clearly labelled as synthetic in the repository (e.g., a `SYNTHETIC_DATA.md` notice and a `synthetic=true` flag in every record).

| File | Key fields (illustrative) |
|---|---|
| `cases.csv` | `case_id, title, category, priority, status, created_at` |
| `persons.csv` | `person_id, display_name, name_variants, dob_synthetic, address_synthetic` |
| `phones.csv` | `phone_id, msisdn_synthetic, owner_person_id, activation_date` |
| `cdr_records.csv` | `cdr_id, caller_phone_id, callee_phone_id, timestamp, duration_sec, tower_id_synthetic` |
| `accounts.csv` | `account_id, holder_person_id, bank_name_fictional, account_type` |
| `transactions.csv` | `txn_id, from_account_id, to_account_id, amount, timestamp, channel` |
| `vehicles.csv` | `vehicle_id, plate_number_synthetic, owner_person_id, vehicle_type` |
| `organizations.csv` | `organization_id, name, name_variants, registration_type_fictional` |
| `locations.csv` | `location_id, generalized_area, latitude_fictional, longitude_fictional` |
| `fir_reports.csv` | `fir_id, case_id, narrative_text, filed_date, station_fictional` |

**Shared keys:** `case_id`, `person_id`, `phone_id`, `account_id`, `vehicle_id`, `organization_id`, `location_id` — used consistently to join structured tables to graph nodes.

### 15.2 Relational Database Schema (PostgreSQL — core tables, illustrative)

```sql
-- Core case management
CREATE TABLE cases (
  case_id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('Low','Medium','High','Critical')),
  status TEXT CHECK (status IN ('Open','Under Investigation','Under Review','Closed','Reopened')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES users(user_id)
);

CREATE TABLE users (
  user_id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  district TEXT,
  state TEXT,
  mfa_enabled BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE case_assignments (
  case_id UUID REFERENCES cases(case_id),
  user_id UUID REFERENCES users(user_id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (case_id, user_id)
);

CREATE TABLE data_sources (
  source_id UUID PRIMARY KEY,
  case_id UUID REFERENCES cases(case_id),
  source_type TEXT, -- FIR, CDR, TRANSACTION, SURVEILLANCE, SOCIAL_MEDIA, VEHICLE, ORG, LOCATION, HISTORICAL
  original_object_key TEXT, -- pointer to object storage
  ingested_by UUID REFERENCES users(user_id),
  ingested_at TIMESTAMPTZ DEFAULT now(),
  is_synthetic BOOLEAN DEFAULT true
);

CREATE TABLE extraction_results (
  extraction_id UUID PRIMARY KEY,
  source_id UUID REFERENCES data_sources(source_id),
  entity_type TEXT,
  raw_value TEXT,
  normalized_value TEXT,
  confidence NUMERIC(4,3),
  status TEXT CHECK (status IN ('auto_accepted','pending_review','approved','rejected')),
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE entity_resolution_candidates (
  candidate_id UUID PRIMARY KEY,
  entity_a_id UUID,
  entity_b_id UUID,
  match_type TEXT CHECK (match_type IN ('Confirmed','Probable','Possible','Unresolved')),
  score NUMERIC(4,3),
  evidence JSONB,
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  decision TEXT CHECK (decision IN ('approved','rejected','pending'))
);

CREATE TABLE alerts (
  alert_id UUID PRIMARY KEY,
  alert_type TEXT,
  case_id UUID REFERENCES cases(case_id),
  related_entities JSONB,
  confidence NUMERIC(4,3),
  severity TEXT CHECK (severity IN ('Low','Medium','High','Critical')),
  explanation TEXT,
  status TEXT CHECK (status IN ('New','Under Review','Confirmed Analytical Lead','False Positive','Escalated','Closed','Requires More Data')),
  assigned_to UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_log (
  audit_id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(user_id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now()
  -- append-only: no UPDATE/DELETE grants issued on this table
);
```

### 15.3 Graph Database Schema (Neo4j — Cypher, illustrative)

```cypher
// Node constraints
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.person_id IS UNIQUE;
CREATE CONSTRAINT phone_id IF NOT EXISTS FOR (ph:Phone) REQUIRE ph.phone_id IS UNIQUE;
CREATE CONSTRAINT account_id IF NOT EXISTS FOR (a:Account) REQUIRE a.account_id IS UNIQUE;

// Example nodes
(:Person {person_id, display_name, is_synthetic:true})
(:Phone {phone_id, msisdn_synthetic})
(:Account {account_id, bank_name_fictional})
(:Vehicle {vehicle_id, plate_number_synthetic})
(:Organization {organization_id, name})
(:Location {location_id, generalized_area})
(:Case {case_id, title, status})
(:FIR {fir_id, filed_date})
(:Event {event_id, event_type, timestamp})
(:Document {document_id, source_type})
(:Device {device_id})
(:CommunicationRecord {comm_id, channel, timestamp})

// Example relationships with metadata
(:Person)-[:USES_PHONE {source, timestamp, confidence, case_id, evidence_ref}]->(:Phone)
(:Phone)-[:CALLED {source, timestamp, confidence, case_id, evidence_ref, duration_sec}]->(:Phone)
(:Person)-[:OWNS_ACCOUNT {source, confidence, case_id, evidence_ref}]->(:Account)
(:Account)-[:TRANSFERRED_TO {amount, timestamp, confidence, case_id, evidence_ref}]->(:Account)
(:Person)-[:ASSOCIATED_WITH {confidence, case_id, evidence_ref}]->(:Person)
(:Person)-[:SAME_AS_CANDIDATE {score, match_type, reviewed}]->(:Person)
```

### 15.4 Vector Document Schema (pgvector, illustrative)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_embeddings (
  embedding_id UUID PRIMARY KEY,
  source_id UUID REFERENCES data_sources(source_id),
  case_id UUID REFERENCES cases(case_id),
  text_excerpt TEXT,
  embedding VECTOR(384),  -- dimension depends on chosen sentence-transformer model
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON document_embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 15.5 API Data Models, Provenance, Confidence, Audit, Retention (summary)

- **API data models:** see Section 16 for per-endpoint request/response schemas.
- **Entity/relationship taxonomy:** as defined in Section 10.7 (node and relationship type tables).
- **Provenance fields** (attached to every record/edge): `source`, `ingested_by`, `ingested_at`, `extraction_method`, `model_version`, `is_synthetic`.
- **Confidence-score fields:** `confidence NUMERIC(4,3)` on every extraction, match, and alert.
- **Audit-log schema:** as in `audit_log` table above — append-only, immutable.
- **Data-retention metadata:** every case/record carries `retention_category` and `retention_review_date`; synthetic prototype data has no real retention obligation but the field is modeled for production-readiness.
- **Synthetic-data mapping rules:** every generated record includes `is_synthetic = true`; the dataset generation script and a data dictionary are checked into the repository so evaluators can verify no real data was used.


---

## 16. API Specifications

All endpoints require a valid JWT bearer token (except `/auth/login`). All endpoints enforce RBAC + case-level authorization server-side. All error responses follow `{ "error_code": "...", "message": "..." }`.

### 16.1 Authentication

**POST `/api/v1/auth/login`**
- Purpose: authenticate a user and issue a JWT.
- Request: `{ "username": "string", "password": "string", "mfa_code": "string (optional)" }`
- Response: `{ "access_token": "string", "expires_in": 900, "role": "string" }`
- AuthN: none (public endpoint) | AuthZ: n/a
- Validation: username/password required; rate-limited to 10 attempts/minute/IP.
- Errors: `401 invalid_credentials`, `423 account_locked`, `400 mfa_required`
- Example: `{"username":"demo_investigator","password":"********"}`

**POST `/api/v1/auth/logout`** — invalidates current token/session. AuthN: bearer token required.

### 16.2 User and Role Management

**POST `/api/v1/users`**
- Purpose: create a user account (district/state admin only).
- Request: `{ "username", "role", "district", "state" }`
- Response: `{ "user_id", "username", "role", "temp_password_issued": true }`
- AuthZ: `district_admin` (own district only) or `state_admin`.
- Errors: `403 out_of_scope_district`, `409 username_exists`

**GET `/api/v1/users/{user_id}`** — retrieve user profile (self, or admin within scope).

**PATCH `/api/v1/users/{user_id}/role`** — change role (admin only, fully audited).

### 16.3 Case Management

**POST `/api/v1/cases`**
- Request: `{ "title", "category", "priority" }`
- Response: `{ "case_id", "status": "Open", "created_at" }`
- AuthZ: `investigating_officer` and above.

**GET `/api/v1/cases/{case_id}`** — retrieve case detail. AuthZ: assigned user, supervisor, or auditor (read-only).

**POST `/api/v1/cases/{case_id}/assign`**
- Request: `{ "user_id" }` — AuthZ: `supervisor`, `district_admin`.

**POST `/api/v1/cases/{case_id}/sources`** — link a data source to a case. Request: `{ "source_id" }`.

### 16.4 Entity Search

**GET `/api/v1/search/entities?q={query}&type={person|phone|account|vehicle}`**
- Response: `{ "exact_matches": [...], "probable_matches": [...], "semantic_matches": [...] }`, each item carrying `confidence`, `evidence_ref`, `case_id`.
- AuthZ: filtered server-side to caller's authorized cases.
- Errors: `400 invalid_query`, `413 query_too_broad` (rate/volume guard)

### 16.5 Graph Retrieval

**GET `/api/v1/graph/entity/{entity_id}?depth={n}&filters={...}`**
- Purpose: retrieve subgraph around an entity.
- Response: `{ "nodes": [...], "edges": [...] }`, each with metadata (Section 15.3 properties).
- AuthZ: caller must be authorized on every case referenced in the returned subgraph; unauthorized nodes/edges are pruned, not just hidden client-side.
- Validation: `depth` capped at 4 to bound response size.

**GET `/api/v1/graph/analytics/{case_id}?metric={centrality|community|shortest_path}`** — returns analytics results labelled "analytical relevance," never a criminality score.

### 16.6 Timeline Retrieval

**GET `/api/v1/timeline?entity_id={id}|case_id={id}&from={date}&to={date}&type={...}`**
- Response: `{ "events": [ { "event_id","type","timestamp","evidence_ref","confidence","source" } ] }`

### 16.7 Document Upload

**POST `/api/v1/documents/upload`** (multipart)
- Request: file + `{ "case_id", "source_type" }`
- Response: `{ "source_id", "status": "queued_for_processing" }`
- AuthZ: `investigating_officer` and above, on an authorized case.
- Validation: file type allow-list (PDF, DOCX, CSV, JPG, PNG); malware scan required before queuing (see Section 17).
- Errors: `415 unsupported_media_type`, `422 malware_detected`

### 16.8 Ingestion Status

**GET `/api/v1/ingestion/jobs/{job_id}`** — Response: `{ "job_id","status","records_processed","records_failed","errors":[...] }`. AuthZ: `system_admin`, or case owner for case-scoped jobs.

### 16.9 Entity Extraction

**POST `/api/v1/nlp/extract`** (internal/service endpoint, also exposed for manual re-run)
- Request: `{ "source_id" }`
- Response: `{ "extractions": [ {"entity_type","raw_value","normalized_value","confidence"} ] }`
- AuthZ: `forensic_analyst`, `system_admin`.

### 16.10 Relationship Extraction

**POST `/api/v1/nlp/relationships`**
- Request: `{ "source_id" }`
- Response: `{ "relationships": [ {"type","entity_a","entity_b","confidence","evidence_ref"} ] }`

### 16.11 Vector Search

**POST `/api/v1/search/semantic`**
- Request: `{ "query_text", "case_scope": ["case_id", ...] (optional), "top_k": 10 }`
- Response: `{ "results": [ {"source_id","excerpt","similarity_score","case_id","date"} ] }`
- AuthZ: results filtered to caller's authorized case scope before returning.

### 16.12 Alerts

**GET `/api/v1/alerts?status={...}&case_id={...}`** — list alerts, filtered by access.

**POST `/api/v1/alerts/{alert_id}/acknowledge`** — Request: `{}` — transitions to "Under Review."

**POST `/api/v1/alerts/{alert_id}/resolve`** — Request: `{ "resolution": "False Positive|Confirmed Analytical Lead|Escalated|Requires More Data", "reason": "string" }`

### 16.13 Human Review

**GET `/api/v1/review/queue?type={extraction|entity_resolution}`** — items pending human review, scoped to `forensic_analyst`/`supervisor` roles.

**POST `/api/v1/review/{item_id}/decision`** — Request: `{ "decision": "approve|reject|needs_more_data", "notes": "string" }`

### 16.14 Reports

**POST `/api/v1/reports/generate`**
- Request: `{ "case_id", "sections": [...] (optional subset) }`
- Response: `{ "report_id", "download_url", "generated_at" }`
- Every generated report body embeds the mandatory disclaimer (FR-16.2).

### 16.15 Audit Logs

**GET `/api/v1/audit?case_id={...}&from={date}&to={date}`** — AuthZ: `auditor`, `supervisor` (own cases), `state_admin`. Read-only; no write/delete endpoint exists for this resource by design.

---

## 17. UI/UX Requirements

**Navigation structure:** Left sidebar — Cases | Search | Alerts | Reports | Audit (role-dependent) | Admin (admin roles only). Top bar — global search, user/role indicator, session timer.

**Screen list:** Login, Case Dashboard, Case Detail, Entity Profile, Graph Explorer, Timeline, Location Map, Financial-Flow View, Call-Network View, Organization-Connections View, Similar-Document Search, Alert Queue, Alert Detail, Review Queue (entity resolution / low-confidence extraction), Report Builder/Export, Audit Trail, User & Role Admin (admin roles).

**Dashboard wireframe description (Case Detail):** Header (case ID, status, priority, assigned officers) → left column (linked data sources, key entities) → center (tabbed: Graph / Timeline / Map / Financial / Calls) → right column (active alerts, recent audit events, evidence panel).

**Search experience:** Single search bar with a type toggle (Person/Phone/Account/Vehicle/Case/Free-text); results grouped by match mechanism (Exact / Probable / Semantic) with a visible confidence badge on each result.

**Graph interaction rules:** Click to expand a node's neighbours (bounded by depth cap); hover for a quick-info tooltip; right-click for "open profile," "add to report," "hide node." Edge thickness/style reflects confidence, not "risk."

**Colour system:** Neutral base palette (slate/blue-grey); colour is used for **status and confidence only** (e.g., grey = unreviewed, blue = reviewed, amber = pending review), never for "guilt" signaling. No red/black "danger" colouring tied to a person.

**Risk-indicator design:** Multiple small, labelled indicator chips (e.g., "In 3 cases," "High betweenness — Case C1002," "2 pending reviews") — never a single combined score or gauge.

**Accessibility:** WCAG 2.1 AA target — sufficient colour contrast, keyboard navigation for all interactive elements, screen-reader labels for graph summary stats (not the visual graph itself, which is supplemented by a text summary panel).

**Empty / loading / error states:** Empty — neutral, actionable message (e.g., "No matches found. Try broadening filters."); Loading — skeleton loaders, no blocking spinners over the whole page; Error — plain-language message plus a retry action, never a raw stack trace.

**Confidence display:** Always shown as a labelled badge (e.g., "Probable match · 0.89") next to the fact it qualifies, never hidden in a tooltip only.

**Evidence display:** Every fact/relationship/alert has a visible "View evidence" action opening the source document/record excerpt with provenance.

**Data-source labels:** Every panel footer shows which source(s) fed it (e.g., "Source: CDR_2024_synthetic, FIR_0001").

**Language discipline (mandatory across all UI/reports):** use "Analytical lead," "Potential relationship," "Requires review," "High-priority pattern," "Low-confidence match" — never accusatory or conclusive language ("suspect," "criminal," "guilty," "confirmed crime").


---

## 18. Security Requirements

| Area | Requirement |
|---|---|
| Transport security | TLS 1.2+/HTTPS enforced everywhere; HSTS enabled |
| Encryption at rest | Database and object storage encrypted (AES-256 or provider-managed equivalent) |
| Access control | RBAC + case-level + field-level, enforced server-side on every request |
| MFA | TOTP-based MFA, enable-ready (see FR-1.3) |
| Field-level masking | Sensitive synthetic fields masked for roles without explicit need |
| Secret management | Secrets/API keys stored in a vault (e.g., HashiCorp Vault or cloud KMS equivalent), never in source control |
| API authentication | JWT with short expiry + refresh tokens; signature verification on every request |
| Rate limiting | Per-user and per-IP rate limits on auth and search endpoints |
| Input validation | Strict schema validation on all inputs; reject unknown fields |
| SQL injection protection | Parameterized queries/ORM only; no dynamic string-built SQL |
| Prompt injection protection | Any NLP/LLM component treats document text as untrusted data, never as instructions; extraction prompts are template-locked and outputs are schema-validated before use |
| Malware scanning | All uploaded documents scanned before processing (e.g., ClamAV integration) |
| Secure logging | Logs exclude raw secrets/PII-equivalent synthetic identifiers where not needed; structured, tamper-evident logging |
| Immutable audit trails | Audit log table is append-only at the database-permission level (no UPDATE/DELETE grants) |
| Export monitoring | All report/data exports are logged with actor, scope, and destination |
| Session management | Configurable timeout, secure cookie/token handling, forced logout on role change |
| Data backup and recovery | Scheduled backups, periodic restore drills |
| Network segmentation | Backend services segmented from public-facing components; database not internet-exposed |
| Zero-trust readiness | Service-to-service auth (mTLS-ready) even within the trusted network |
| Least-privilege access | Every service account scoped to only the permissions it needs |
| Key rotation | Documented rotation schedule for signing keys and DB credentials |
| Incident response | Documented runbook: detection → containment → notification → root-cause → remediation |

---

## 19. Privacy and Responsible-AI Requirements

| Area | Requirement |
|---|---|
| Synthetic data use | All prototype data is synthetic/fictional; a `SYNTHETIC_DATA.md` notice and `is_synthetic` flags make this unambiguous throughout the system |
| Purpose limitation | Data collected/processed only for the stated investigative case purpose; no repurposing without new authorization |
| Data minimization | Only fields necessary for investigative value are modeled; no unnecessary sensitive-attribute fields |
| Consent and authorization | Production deployment requires lawful-access authorization per case (e.g., warrant/legal basis) — modeled as a required `authorization_ref` field on case creation, even though not exercised with real data here |
| Lawful access | Access control and audit design assume that any real deployment must map to a specific lawful-access basis per record |
| Human-in-the-loop review | No AI output (match, relationship, alert) affects case status without human acknowledgement (Sections 10.6, 10.10, 10.15) |
| Explainability | Every alert/relationship carries a plain-language explanation, not just a score |
| Bias testing | Extraction and matching components tested for name-origin and script bias (e.g., performance parity across common Indian naming conventions) before being trusted, with results documented in the testing report |
| Multilingual model evaluation | English NLP performance measured on the synthetic test set; Hindi/Indic support explicitly marked "not implemented in prototype, architecture-ready" |
| False-positive management | Every alert has a false-positive feedback path (FR-10.11, FR-15.5) captured for future improvement |
| Model monitoring | Model version stamped on every extraction/alert (`model_version` field) to support later drift analysis |
| Model versioning | Extraction/matching/anomaly models are versioned; historical outputs remain attributable to the model version that produced them |
| Data retention | `retention_category` / `retention_review_date` fields modeled on every record (Section 15.5) |
| Secure deletion | Deletion requests (e.g., for demo cleanup) perform verifiable removal from primary stores and search indexes |
| Evidence provenance | Every fact traces to a source document/record — no orphan claims |
| No automated criminal labelling | Enforced at the UI/report layer (Section 17) and the data-model layer (neutral entity labels only, Section 12) |
| No demographic-only predictive policing | The anomaly/pattern models (Section 10.10) use behavioural/network features only; religion, caste, ethnicity, and similar protected attributes are excluded from the feature set entirely, not just down-weighted |
| No unjustified protected-trait risk features | Same as above — protected traits are not present in the synthetic schema's analytical feature set at all |
| Right to audit model outcomes | Auditor role (Section 7) has read access to alert outcomes and model version history |
| Review/appeal workflow | The alert lifecycle (Section 10.15) already includes supervisor approval and "Requires More Data," providing a structured internal review path before anything is "confirmed" |

---

## 20. MVP Scope (Hackathon Deliverable)

**In scope for MVP:**

1. Secure demo login (role-based, fictional accounts).
2. Synthetic data ingestion (CSV/JSON via mock connectors).
3. FIR text processing (OCR-ready pipeline, NER on fictional FIR narratives).
4. Entity extraction (persons, phones, vehicles, locations, orgs from synthetic FIRs).
5. CDR and transaction loading into PostgreSQL and the graph.
6. Neo4j relationship graph construction from ingested synthetic data.
7. Investigator search (exact + basic semantic).
8. Interactive graph visualization (Cytoscape.js).
9. Basic timeline view.
10. Key network-node analysis (degree/betweenness/PageRank on demo graph).
11. Three explainable suspicious-pattern rules (from Section 10.10, e.g., FR-10.2, FR-10.4, FR-10.5).
12. Similar-document vector search (pgvector over synthetic FIR/report narratives).
13. Alert queue with the full status lifecycle.
14. Human review status tracking (entity resolution + low-confidence extraction queues, at least minimally functional).
15. PDF or JSON report export with mandatory disclaimer.
16. Audit logging across all the above actions.

**Explicitly NOT attempted in the MVP:**

- Real government API integration (CCTNS/ICJS/NCRB/NATGRID or any other).
- Real telecom, banking, Aadhaar, or intelligence data of any kind.
- Full autonomous investigation or case closure without human sign-off.
- Facial recognition or any biometric identification.
- Automated criminal prediction or scoring.
- Nationwide or production-scale deployment.
- Full multilingual (Hindi/Indic) NLP pipeline (architecture only, per FR-5.14).
- Supervised ML anomaly models (deferred until genuine, ethically-sourced labelled feedback exists — Section 10.10).

---

## 21. Implementation Roadmap and Future Roadmap

### 21.1 Hackathon Build Roadmap (Phase 1–10)

| Phase | Objectives | Deliverables | Dependencies | Key Risks | Est. Effort | Exit Criteria |
|---|---|---|---|---|---|---|
| **1. Research & Requirements** | Confirm scope, finalize this PRD, define synthetic-data ethics guardrails | Approved PRD, role/permission matrix, risk register v1 | None | Scope creep | 1–2 days | PRD reviewed and signed off by team + mentor |
| **2. Synthetic Data & Schema** | Design and generate all synthetic CSVs; finalize relational, graph, and vector schemas | `cases.csv` … `fir_reports.csv`, DDL scripts, data dictionary, `SYNTHETIC_DATA.md` | Phase 1 | Unrealistic or inconsistent synthetic data | 2–3 days | Sample dataset loads cleanly; schema passes review |
| **3. Backend & Database** | Stand up FastAPI service, PostgreSQL, auth, RBAC skeleton | Running API skeleton, auth endpoints, case CRUD, Docker Compose base | Phase 2 | Auth/RBAC design flaws found late | 3–4 days | Login + case CRUD pass integration tests |
| **4. NLP & Entity Extraction** | Build OCR → NER → normalization → confidence pipeline | Working extraction pipeline on synthetic FIRs, review queue for low-confidence items | Phase 3 | Poor extraction quality on synthetic text style | 3–5 days | Precision/recall meets Section 23 targets on test set |
| **5. Graph Construction** | Load extracted + structured entities/relationships into Neo4j | Populated knowledge graph, Cypher query library | Phase 4 | Schema mismatches between relational and graph layers | 2–3 days | Sample entity's full subgraph retrievable via API |
| **6. Vector Search** | Generate embeddings, set up pgvector, build semantic search endpoint | `/search/semantic` working end-to-end | Phase 4 | Embedding model too slow/heavy for hackathon hardware | 2 days | Precision@k meets target on labelled similarity pairs |
| **7. Graph Analytics & Alerts** | Implement centrality/community detection; implement 3+ pattern rules; alert lifecycle | Analytics endpoints, alert generation + review workflow | Phases 5–6 | Rule false-positive rate too high | 3–4 days | 3 rules demonstrably fire correctly on synthetic scenarios |
| **8. Frontend Dashboard** | Build all core screens (Section 17), Cytoscape graph, timeline, map | Functional dashboard covering MVP scope (Section 20) | Phases 3–7 (incremental) | UI complexity underestimated | 5–7 days | All MVP user stories (Section 13) pass acceptance criteria |
| **9. Security & Audit** | Harden auth, finalize RBAC enforcement, implement audit log, run security tests | Audit log fully wired, security test report | Phases 3–8 | Late-discovered access-control gaps | 2–3 days | Access-control test suite (Section 22) passes 100% |
| **10. Testing & Presentation** | Full regression pass, ground-truth evaluation, demo rehearsal | Test report with metrics (Section 23), demo script rehearsed | All prior phases | Demo-day technical failure | 2–3 days | Demo runs end-to-end twice without failure; metrics documented |

*(Effort estimates assume a 6-person team working in parallel across phases where dependencies allow; phases 3–9 substantially overlap in practice.)*

### 21.2 Post-Hackathon Roadmap (conceptual)

| Phase | Focus |
|---|---|
| Near-term (0–3 months) | Hindi/Indic NLP integration; Elasticsearch upgrade; expanded rule library; UI polish and accessibility audit |
| Mid-term (3–9 months) | Formal security audit (penetration testing, threat modeling); supervised anomaly model using accumulated, ethically-labelled feedback; SSO integration |
| Long-term (9+ months, contingent on authorization) | Engagement with relevant authorities on lawful, authorized, security-certified integration pathways for approved data sources — strictly subject to legal authorization, inter-agency agreement, and government security review; **not something this team can build, promise, or assume access to** |


---

## 22. Testing Strategy

| Test type | Focus |
|---|---|
| Unit testing | Individual functions: normalization, regex extractors, scoring logic (pytest) |
| API testing | Every endpoint in Section 16: happy path, auth failure, validation failure (pytest + httpx / Postman collection) |
| Integration testing | Full pipeline: ingestion → NLP → graph write → search retrieval |
| Graph-query testing | Cypher query correctness against known synthetic fixture graphs |
| NLP evaluation | Precision/recall/F1 for NER and relation extraction against a hand-labelled synthetic ground-truth set |
| OCR evaluation | Character/word error rate on a synthetic scanned-document test set |
| Vector-search evaluation | Retrieval precision@k against known similar/dissimilar synthetic document pairs |
| Security testing | Auth bypass attempts, injection attempts, rate-limit verification (OWASP ZAP or similar) |
| Access-control testing | Verify every role sees exactly its authorized scope, including negative tests (role X must NOT see Y) |
| Performance testing | Load testing against NFR targets (Section 11) using a tool such as Locust |
| Data-quality testing | Schema validation, duplicate-detection accuracy on the synthetic dataset |
| Adversarial testing | Attempt prompt-injection via malicious document text; attempt to trigger auto-merge or auto-labelling bypasses |
| Bias and fairness testing | Name/script variation testing for NER and entity resolution (Section 19) |
| Human usability testing | Task-completion walkthroughs with mentors/peers acting as investigators |
| Disaster recovery testing | Backup restore drill; verify RPO/RTO assumptions for the prototype environment |

**Synthetic ground-truth test set:** the team creates a labelled subset (e.g., 50–100 fictional FIRs/reports with manually annotated entities, relationships, and known duplicate/non-duplicate entity pairs) to compute:

- **Precision** = TruePositives / (TruePositives + FalsePositives)
- **Recall** = TruePositives / (TruePositives + FalseNegatives)
- **F1-score** = 2 × (Precision × Recall) / (Precision + Recall)
- **False-positive rate** = FalsePositives / (FalsePositives + TrueNegatives)
- **Retrieval precision (precision@k)** = relevant results in top-k / k, measured against labelled similar-document pairs
- **Entity-linking accuracy** = correctly resolved matches / total labelled match pairs (separately for Confirmed/Probable/Possible tiers)
- **Alert accuracy** = analyst-confirmed leads / total alerts generated, tracked per rule

---

## 23. Success Metrics

| Metric | Target (illustrative, hackathon demo) |
|---|---|
| Reduction in manual cross-referencing time (demo scenario, before/after) | ≥ 60% reduction |
| Entity-extraction precision / recall | ≥ 0.85 / ≥ 0.80 on synthetic test set |
| Relationship-extraction accuracy | ≥ 0.75 on synthetic test set |
| Duplicate-entity resolution accuracy | ≥ 0.90 for Confirmed-tier candidates |
| Search response time | Meets NFR targets in Section 11 |
| Graph-query response time | Meets NFR targets in Section 11 |
| Alert precision | ≥ 0.70 analyst-confirmed on synthetic scenarios |
| False-positive rate | ≤ 0.30 on synthetic scenarios (tracked per rule, tightened over time) |
| % of alerts with explanations | 100% (mandatory, FR-10.11) |
| % of results with evidence references | 100% (mandatory, no orphan claims) |
| Report-generation time | ≤ 10 seconds for a demo-scale case |
| User task-completion rate (usability testing) | ≥ 90% of test tasks completed without assistance |
| Audit-log completeness | 100% of state-changing actions logged |
| Data-ingestion success rate | ≥ 95% of well-formed synthetic records ingested without manual intervention |

---

## 24. Risks and Mitigations

| Risk | Probability | Impact | Risk Level | Mitigation | Owner | Monitoring Indicator |
|---|---|---|---|---|---|---|
| Unauthorized data access | Low | High | Medium | RBAC + case-level access enforced server-side; access-control test suite | Cybersecurity Engineer | Failed-authorization attempt rate |
| Data leakage (export/report) | Low | High | Medium | Export monitoring/audit; disclaimer + access checks before export | Cybersecurity Engineer | Export audit log review |
| False positives in alerts | Medium | Medium | Medium | Explainable rules, false-positive feedback loop, human review before "confirmed" | NLP/ML Engineer | False-positive rate per rule |
| Biased models | Medium | High | High | Exclude protected attributes from features; bias testing on name/script variation | NLP/ML Engineer | Bias-test pass/fail per release |
| Incorrect entity matching | Medium | Medium | Medium | Tiered match confidence, mandatory human approval, reversible merges | Data Engineer | Entity-linking accuracy metric |
| Poor OCR quality | Medium | Low | Low | Confidence thresholding, human verification queue for low-confidence OCR/NER | Data Engineer | OCR word-error-rate |
| Multilingual limitations | High (known, scoped out) | Low (MVP is English-only) | Low | Explicit "needs translation" queue; architecture designed for future Indic support | NLP/ML Engineer | % documents routed to translation queue |
| Graph overload (too many nodes/edges) | Medium | Medium | Medium | Depth caps, case-scoped default queries, server-side pruning by access rights | Graph/DB Engineer | Graph-query latency (p95) |
| Missing source data | Medium | Medium | Medium | "Requires More Data" alert status; clear provenance gaps shown in UI | Data Engineer | % alerts marked "Requires More Data" |
| API/connector unavailability (mock) | Low | Low | Low | Retry with backoff, dead-letter queue, admin alerting | System Admin/Backend Dev | Ingestion job failure rate |
| Integration delays (team coordination) | Medium | Medium | Medium | Modular architecture, mocked interfaces between teams from day one | Product Manager | Sprint burndown vs. plan |
| Prompt injection (malicious document text) | Low | Medium | Low | Treat document content as untrusted data, not instructions; schema-validated NLP outputs | Cybersecurity Engineer | Adversarial test suite pass rate |
| Insider misuse | Low | High | Medium | Least privilege, full audit trail, auditor role with independent oversight | Cybersecurity Engineer | Audit-log anomaly review |
| Overreliance on AI by investigators | Medium | High | High | Mandatory human-review gates; disclaimers on every AI output and report; UI language discipline | Product Manager / UX Designer | % alerts confirmed vs. auto-trusted (should be 0% auto-trusted) |
| Misinterpretation of centrality scores as guilt | Medium | High | High | Explicit "analytical relevance" labelling; UI copy review; training/documentation for demo/evaluators | UX Designer / Product Manager | UI copy audit checklist completion |
| Data-quality errors in synthetic dataset | Medium | Low | Low | Schema validation at ingestion, data-quality test suite | Data Engineer | Ingestion validation failure rate |

---

## 25. Team Responsibilities

| Role | Responsibilities |
|---|---|
| **Product Manager** | Owns PRD, scope, prioritization, demo narrative, stakeholder communication, risk register upkeep |
| **UI/UX Designer** | Navigation/screen design, colour/labelling discipline (Section 17), accessibility, usability testing |
| **Frontend Developer** | React/Next.js dashboard, Cytoscape.js graph integration, timeline/map views |
| **Backend Developer** | FastAPI services, API implementation (Section 16), auth/session management |
| **Data Engineer** | Synthetic dataset design/generation, ingestion pipeline, PostgreSQL schema, data quality |
| **NLP/ML Engineer** | OCR, NER, relation extraction, embeddings, anomaly-detection rules, bias testing |
| **Graph/Database Engineer** | Neo4j schema, Cypher queries, graph analytics (GDS/NetworkX), performance tuning |
| **Cybersecurity Engineer** | RBAC enforcement, encryption, secret management, security testing, audit-log integrity |
| **QA/Documentation Lead** | Test plans and execution (Section 22), ground-truth test set curation, PRD/README maintenance, demo rehearsal |

---

## 26. Demo Script (5–7 minutes)

1. **Login** as `demo_investigator` — show role-based landing page.
2. **Open case `FIR_0001`** (fully synthetic) — show case dashboard with linked sources.
3. **Search for `P001`** (fictional entity) — show exact + probable + semantic results with confidence badges.
4. **Show connected phones, accounts, vehicles, organizations, locations, and cases** on the entity profile.
5. **Expand the graph** — click through 2 hops, show evidence panel for one edge.
6. **Show centrality/bridge-node analysis** — labelled "network importance," not guilt.
7. **Run a natural-language query** (e.g., "cases involving fraudulent job-offer schemes") — show semantic results.
8. **Display similar synthetic FIR reports** via vector search, with excerpts and similarity scores.
9. **Show a suspicious transaction or call-frequency alert** with its plain-language explanation.
10. **Open source evidence** for that alert (original synthetic document/record).
11. **Approve or reject the analytical lead** — show the mandatory reason field and audit write.
12. **Generate an investigation-support report** — show the mandatory AI-assisted disclaimer.
13. **Show audit history** for the case — every action just performed, immutably logged.
14. **Closing note:** explain that real, authorized integrations (CCTNS/ICJS/NCRB/etc.) would require formal government authorization, inter-agency agreements, and security certification — none of which this prototype has, uses, or claims to have.

---

## 27. Glossary

| Term | Definition |
|---|---|
| CDR | Call Detail Record — metadata about a phone call (parties, time, duration), fictional in this project |
| FIR | First Information Report — the initial police record of a reported offence, fictional in this project |
| NER | Named Entity Recognition — NLP technique to identify names of people, places, organizations, etc. in text |
| Entity Resolution | The process of determining whether two records refer to the same real-world entity |
| Knowledge Graph | A network data structure of entities (nodes) and their relationships (edges), each with metadata |
| pgvector | A PostgreSQL extension enabling storage and nearest-neighbour search over vector embeddings |
| Embedding | A numeric vector representation of text capturing semantic meaning, used for similarity search |
| Centrality | A graph-analytics measure of a node's structural importance in a network (not a measure of guilt) |
| Community Detection | Graph algorithm technique for finding clusters of densely connected nodes |
| RBAC | Role-Based Access Control |
| Provenance | Metadata tracing a piece of data back to its source, ingestion time, and processing history |
| Confidence Score | A numeric estimate (0–1) of how reliable an automated extraction or match is |
| Analytical Lead | A neutral term for an AI-surfaced pattern or relationship requiring human review — not an accusation |
| Synthetic Data | Entirely fictional data created for development/testing, containing no real personal information |
| MVP | Minimum Viable Product — the smallest feature set that demonstrates the core value proposition |
| NFR | Non-Functional Requirement — a quality attribute (performance, security, availability) rather than a feature |

---

*End of document. All names, IDs, phone numbers, financial records, FIR numbers, and coordinates used as examples throughout this PRD are fictional and were created solely to illustrate the system design.*
