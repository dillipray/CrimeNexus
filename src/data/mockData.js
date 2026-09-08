import { Users, Phone, Car, MapPin, Building2, CreditCard } from 'lucide-react';

export const T = {
  bg: "#0E161F",
  panel: "#141F2B",
  panelAlt: "#1A2733",
  raised: "#1E2C39",
  border: "#28394A",
  borderSoft: "#1F2E3C",
  text: "#E6EDF4",
  textDim: "#93A6B8",
  textFaint: "#5D7086",
  signal: "#3FC1C9",
  signalDim: "#1F5B60",
  flag: "#E8A33D",
  flagDim: "#5C4419",
  danger: "#E0645A",
  dangerDim: "#5B2620",
  ok: "#7FB77E",
  okDim: "#2E4A2C",
  violet: "#B98CCE",
  violetDim: "#453357",
};

export const ENTITY_STYLE = {
  PERSON: { color: T.signal, dim: T.signalDim, icon: Users, label: "Person" },
  PHONE: { color: "#5B8DEF", dim: "#20304F", icon: Phone, label: "Phone" },
  VEHICLE: { color: T.violet, dim: T.violetDim, icon: Car, label: "Vehicle" },
  LOCATION: { color: T.flag, dim: T.flagDim, icon: MapPin, label: "Location" },
  ORG: { color: T.ok, dim: T.okDim, icon: Building2, label: "Organization" },
  ACCOUNT: { color: "#E8A33D", dim: "#5C4419", icon: CreditCard, label: "Account" },
};

export const REL_STYLE = {
  communication: { color: "#5B8DEF", label: "Communication (CDR)" },
  financial: { color: T.ok, label: "Financial transaction" },
  vehicle_association: { color: T.violet, label: "Vehicle association" },
  location_observation: { color: T.flag, label: "Location observation" },
  organization_association: { color: "#8CA3B8", label: "Organization association" },
  fir_co_mention: { color: T.signal, label: "FIR co-mention" },
  owns_phone: { color: "#5B8DEF", label: "Phone ownership" },
  account_ownership: { color: "#E8A33D", label: "Account ownership" },
};

// Sourced from Section 15.1 Synthetic Dataset (cases.csv, persons.csv, phones.csv, vehicles.csv, locations.csv, organizations.csv)
export const ENTITIES = {
  P009: { id: "P009", type: "PERSON", name: "Aditya Singh", x: 280, y: 140, sub: "Subject · FIR_0001 · Nagpur" },
  P001: { id: "P001", type: "PERSON", name: "Person Alpha", x: 150, y: 260, sub: "Subject · FIR_0017 / FIR_0001" },
  P040: { id: "P040", type: "PERSON", name: "Person Omega", x: 620, y: 240, sub: "Associate · FIR_0001" },
  P003: { id: "P003", type: "PERSON", name: "Person Charlie", x: 260, y: 360, sub: "Associate · Kolkata" },
  P055: { id: "P055", type: "PERSON", name: "Rahul Singh", x: 740, y: 140, sub: "Subject · FIR_0002" },
  PH1: { id: "PHONE_0009", type: "PHONE", name: "PHONE_FAKE_0009", x: 210, y: 195, sub: "Registered to Aditya Singh" },
  PH2: { id: "PHONE_0001", type: "PHONE", name: "PHONE_FAKE_0001", x: 260, y: 240, sub: "Registered to Person Alpha" },
  PH3: { id: "PHONE_0040", type: "PHONE", name: "PHONE_FAKE_0040", x: 680, y: 195, sub: "Registered to Person Omega" },
  V1: { id: "VEH_003", type: "VEHICLE", name: "JH-00-XX-0003 (car)", x: 620, y: 380, sub: "Observed · FIR_0001" },
  L1: { id: "LOC_0401", type: "LOCATION", name: "Synthetic Transport Hub 4-1", x: 750, y: 410, sub: "Nagpur, Maharashtra" },
  L2: { id: "LOC_0101", type: "LOCATION", name: "Synthetic Warehouse 1-1", x: 420, y: 290, sub: "Khordha, Odisha" },
  O1: { id: "ORG_011", type: "ORG", name: "Synthetic Logistics Group 11", x: 440, y: 110, sub: "Affiliation · FIR_0001" },
  A1: { id: "ACCT_0070", type: "ACCOUNT", name: "ACCT_0070 (Bank)", x: 330, y: 440, sub: "Synthetic Bank · Sender" },
  A2: { id: "ACCT_0073", type: "ACCOUNT", name: "ACCT_0073 (Bank)", x: 530, y: 440, sub: "Synthetic Bank · Beneficiary" },
};

// Sourced from Section 15.1 Synthetic Dataset (cdr_records.csv, transactions.csv, fir_reports.csv)
export const RELATIONSHIPS = [
  { id: "R1", a: "P009", b: "PH1", type: "communication", evidence: "CDR_000001", confidence: 95, count: 18, first: "12 Jul", last: "22 Jul" },
  { id: "R2", a: "PH1", b: "P001", type: "communication", evidence: "CDR_000001", confidence: 92, count: 14, first: "12 Jul", last: "22 Jul" },
  { id: "R3", a: "P009", b: "P001", type: "fir_co_mention", evidence: "FIR_0001", confidence: 88, count: 4, first: "07 Jul", last: "07 Jul" },
  { id: "R4", a: "P009", b: "O1", type: "organization_association", evidence: "FIR_0001", confidence: 85, count: 1, first: "07 Jul", last: "07 Jul" },
  { id: "R5", a: "P001", b: "O1", type: "organization_association", evidence: "FIR_0001", confidence: 85, count: 1, first: "07 Jul", last: "07 Jul" },
  { id: "R6", a: "P009", b: "L1", type: "location_observation", evidence: "FIR_0001", confidence: 80, count: 2, first: "07 Jul", last: "12 Jul" },
  { id: "R7", a: "P001", b: "L1", type: "location_observation", evidence: "FIR_0001", confidence: 80, count: 2, first: "07 Jul", last: "12 Jul" },
  { id: "R8", a: "P009", b: "V1", type: "vehicle_association", evidence: "FIR_0001", confidence: 85, count: 1, first: "07 Jul", last: "07 Jul" },
  { id: "R9", a: "A1", b: "A2", type: "financial", evidence: "TXN_000001", confidence: 90, count: 3, first: "08 Jul", last: "15 Jul", amount: "₹4,50,000" },
  { id: "R10", a: "P009", b: "A1", type: "financial", evidence: "ACCT_0070", confidence: 98, count: 1, first: "07 Jul", last: "07 Jul" },
  { id: "R11", a: "P040", b: "PH3", type: "communication", evidence: "CDR_000002", confidence: 90, count: 8, first: "15 Jul", last: "20 Jul" },
  { id: "R12", a: "P009", b: "P040", type: "fir_co_mention", evidence: "FIR_0001", confidence: 88, count: 1, first: "07 Jul", last: "07 Jul" },
  { id: "R13", a: "P040", b: "L1", type: "location_observation", evidence: "LOC_0401", confidence: 80, count: 1, first: "07 Jul", last: "07 Jul" },
];

// Sourced from FIR_0001 narratives and transaction/telephony records
export const TIMELINE = [
  { time: "07 Jul · 09:15", type: "fir_co_mention", title: "FIR Registered", detail: "Aditya Singh and Person Alpha named in FIR_0001 (Nagpur)", evidence: "FIR_0001" },
  { time: "07 Jul · 10:30", type: "location_observation", title: "Physical Rendezvous", detail: "Aditya Singh met Person Alpha near Synthetic Transport Hub 4-1", evidence: "LOC_0401" },
  { time: "07 Jul · 11:00", type: "vehicle_association", title: "Vehicle Sighting", detail: "Vehicle JH-00-XX-0003 observed stationed outside Transport Hub", evidence: "VEH_003" },
  { time: "07 Jul · 11:45", type: "organization_association", title: "Corporate Link", detail: "Both subjects confirmed affiliated with Synthetic Logistics Group 11", evidence: "ORG_011" },
  { time: "08 Jul · 14:20", type: "financial", title: "High-Value Transfer", detail: "Expedited transfer from ACCT_0070 to ACCT_0073, ₹4,50,000", evidence: "TXN_000001" },
  { time: "12 Jul · 18:05", type: "communication", title: "Encrypted CDR Surge", detail: "14 phone exchanges detected between PHONE_FAKE_0009 and PHONE_FAKE_0001", evidence: "CDR_000001" },
  { time: "15 Jul · 16:30", type: "financial", title: "Follow-up Remittance", detail: "Second layer transfer to ACCT_0073, ₹1,50,000 (NEFT)", evidence: "TXN_000002" },
  { time: "22 Jul · 20:10", type: "communication", title: "Telephony Handshake", detail: "Communication logged with Person Omega (+91 PHONE_FAKE_0040)", evidence: "CDR_000002" },
];

// Sourced from cdr_records.csv
export const COMM_FREQ = [
  { day: "12 Jul", "PHONE_FAKE_0009": 5, "PHONE_FAKE_0001": 4, "PHONE_FAKE_0040": 1 },
  { day: "13 Jul", "PHONE_FAKE_0009": 3, "PHONE_FAKE_0001": 2, "PHONE_FAKE_0040": 2 },
  { day: "14 Jul", "PHONE_FAKE_0009": 4, "PHONE_FAKE_0001": 5, "PHONE_FAKE_0040": 1 },
  { day: "15 Jul", "PHONE_FAKE_0009": 6, "PHONE_FAKE_0001": 6, "PHONE_FAKE_0040": 3 },
  { day: "16 Jul", "PHONE_FAKE_0009": 2, "PHONE_FAKE_0001": 1, "PHONE_FAKE_0040": 0 },
  { day: "17 Jul", "PHONE_FAKE_0009": 5, "PHONE_FAKE_0001": 3, "PHONE_FAKE_0040": 2 },
  { day: "18 Jul", "PHONE_FAKE_0009": 7, "PHONE_FAKE_0001": 6, "PHONE_FAKE_0040": 4 },
];

// Sourced from transactions.csv
export const TRANSACTIONS = [
  { id: "TXN_000001", from: "ACCT_0070 (Aditya Singh)", to: "ACCT_0073 (Beneficiary)", amount: 450000, date: "08 Jul" },
  { id: "TXN_000002", from: "ACCT_0070 (Aditya Singh)", to: "ACCT_0073 (Beneficiary)", amount: 150000, date: "15 Jul" },
  { id: "TXN_000003", from: "ACCT_0071 (Synthetic Bank)", to: "ACCT_0038 (Counterparty)", amount: 240000, date: "18 Jul" },
  { id: "TXN_000004", from: "ACCT_0036 (Synthetic Bank)", to: "ACCT_0066 (Beneficiary)", amount: 1250000, date: "20 Jul" },
  { id: "TXN_000005", from: "ACCT_0072 (Synthetic Bank)", to: "ACCT_0017 (Counterparty)", amount: 320000, date: "22 Jul" },
];

// Section 15.1 AI Leads (FR-10 Rules)
export const LEADS_INIT = [
  {
    id: "LEAD-01",
    title: "Bridge Entity Connects Transport Hub and Financial Cluster",
    entity: "Aditya Singh (P009)",
    confidence: 91,
    status: "review",
    evidence: ["FIR_0001", "TXN_000001", "ORG_011"],
    text: "Aditya Singh acts as a central hub linking Synthetic Logistics Group 11, physical rendezvous at Transport Hub 4-1, and immediate outbound transactions to ACCT_0073.",
    trace: [
      "Detected pattern: high Brandes betweenness centrality in FIR_0001 case graph",
      "Relationship: financial originator from ACCT_0070 (TXN_000001)",
      "Relationship: FIR co-mention with Person Alpha (FIR_0001)",
      "Source records: FIR_0001, TXN_000001, ORG_011",
    ],
  },
  {
    id: "LEAD-02",
    title: "Cross-Case Linkage Detected Across Nagpur and Raipur",
    entity: "Person Alpha (P001)",
    confidence: 87,
    status: "review",
    evidence: ["FIR_0001", "FIR_0017", "CDR_000001"],
    text: "Person Alpha appears in FIR_0001 (Nagpur) as well as primary suspect in FIR_0017 (Raipur), demonstrating inter-state syndication.",
    trace: [
      "Detected pattern: cross-case entity linkage across state jurisdictions",
      "Relationship: named in FIR_0001 (Nagpur) and FIR_0017 (Raipur)",
      "Relationship: persistent telephony contact with PHONE_FAKE_0009",
      "Source records: FIR_0001, FIR_0017, CDR_000001",
    ],
  },
  {
    id: "LEAD-03",
    title: "Expedited Fund Structuring & Rapid Transfer",
    entity: "ACCT_0070 ↔ ACCT_0073",
    confidence: 82,
    status: "review",
    evidence: ["TXN_000001", "TXN_000002"],
    text: "Repeated transfers exceeding ₹4,50,000 executed within 24 hours of documented physical meeting at Transport Hub 4-1.",
    trace: [
      "Detected pattern: structuring / rapid fund movement immediately post rendezvous",
      "Relationship: NEFT outflow (TXN_000001)",
      "Relationship: NEFT outflow (TXN_000002)",
      "Source records: TXN_000001, TXN_000002, LOC_0401",
    ],
  },
  {
    id: "LEAD-04",
    title: "Co-Location Observation at Transport Hub",
    entity: "Aditya Singh & Person Alpha",
    confidence: 79,
    status: "dismissed",
    evidence: ["LOC_0401", "VEH_003"],
    text: "Both individuals confirmed on CCTV perimeter at Synthetic Transport Hub 4-1 alongside vehicle JH-00-XX-0003.",
    trace: [
      "Detected pattern: physical spatio-temporal co-presence",
      "Relationship: location observation (LOC_0401)",
      "Relationship: vehicle correlation (VEH_003)",
      "Source records: LOC_0401, VEH_003",
    ],
  },
];

// Entity Resolution candidate pairs from persons.csv
export const RESOLUTION_QUEUE = [
  {
    id: "MATCH-01",
    a: "Aditya Singh",
    b: "A. Singh (Nagpur Log)",
    confidence: 93,
    status: "pending",
    reasons: ["High phonological similarity", "Associated with same vehicle JH-00-XX-0003", "Same district (Nagpur)"],
    aAttrs: { Source: "FIR_0001", Phone: "PHONE_FAKE_0009", District: "Nagpur, Maharashtra" },
    bAttrs: { Source: "LOC_0401 observation", Phone: "PHONE_FAKE_0009", District: "Nagpur, Maharashtra" },
  },
  {
    id: "MATCH-02",
    a: "Person Alpha",
    b: "P. Alpha (FIR_0017 record)",
    confidence: 88,
    status: "pending",
    reasons: ["Identical MSISDN association", "Same corporate affiliation (Synthetic Logistics Group 11)"],
    aAttrs: { Source: "FIR_0001", Phone: "PHONE_FAKE_0001", Role: "subject" },
    bAttrs: { Source: "FIR_0017", Phone: "PHONE_FAKE_0001", Role: "primary_subject" },
  },
  {
    id: "MATCH-03",
    a: "Rahul Singh",
    b: "R. Singh (FIR_0002)",
    confidence: 74,
    status: "pending",
    reasons: ["Similar name token", "Shared bank institution branch"],
    aAttrs: { Source: "FIR_0002", District: "Nagpur", Organization: "Synthetic Services Group 3" },
    bAttrs: { Source: "ACCT_0026 record", District: "Nagpur", Organization: "Synthetic Services Group 3" },
  },
];
