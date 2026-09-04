import { Users, Phone, Car, MapPin, Building2 } from 'lucide-react';

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
  ACCOUNT: { color: "#E8A33D", dim: "#5C4419", icon: Building2, label: "Account" },
};

export const REL_STYLE = {
  communication: { color: "#5B8DEF", label: "Communication" },
  financial: { color: T.ok, label: "Financial transaction" },
  vehicle_association: { color: T.violet, label: "Vehicle association" },
  location_observation: { color: T.flag, label: "Location observation" },
  organization_association: { color: "#8CA3B8", label: "Organization association" },
  fir_co_mention: { color: T.signal, label: "FIR co-mention" },
};

export const ENTITIES = {
  P1: { id: "ENT-101", type: "PERSON", name: "Arjun Nair", x: 255, y: 130, sub: "5 sources · 92% avg confidence" },
  P2: { id: "ENT-102", type: "PERSON", name: "Meera Sen", x: 140, y: 250, sub: "4 sources · 85% avg confidence" },
  P3: { id: "ENT-103", type: "PERSON", name: "Devraj Sharma", x: 620, y: 250, sub: "5 sources · 88% avg confidence" },
  P4: { id: "ENT-104", type: "PERSON", name: "Kavita Rao", x: 255, y: 340, sub: "3 sources · 74% avg confidence" },
  P5: { id: "ENT-105", type: "PERSON", name: "Sanjay Iyer", x: 740, y: 135, sub: "3 sources · 83% avg confidence" },
  PH1: { id: "ENT-201", type: "PHONE", name: "+91 98••• 1042", x: 195, y: 188, sub: "Registered · CDR-1042" },
  PH2: { id: "ENT-202", type: "PHONE", name: "+91 98••• 1119", x: 255, y: 232, sub: "Registered · CDR-1119" },
  PH3: { id: "ENT-203", type: "PHONE", name: "+91 98••• 1223", x: 680, y: 188, sub: "Registered · CDR-1223" },
  V1: { id: "ENT-301", type: "VEHICLE", name: "KA-04 White Sedan", x: 620, y: 375, sub: "Owner match pending · VEH-202" },
  L1: { id: "ENT-401", type: "LOCATION", name: "Warehouse, Sector 12", x: 745, y: 420, sub: "3 observations · LOC-118" },
  L2: { id: "ENT-402", type: "LOCATION", name: "Cafe Meridian", x: 400, y: 285, sub: "2 observations · LOC-203" },
  O1: { id: "ENT-501", type: "ORG", name: "Silverline Logistics Pvt Ltd", x: 430, y: 105, sub: "Registered entity · ORG-011" },
};

export const RELATIONSHIPS = [
  { id: "R1", a: "P1", b: "PH1", type: "communication", evidence: "CDR-1042", confidence: 92, count: 14, first: "12 Aug", last: "18 Aug" },
  { id: "R2", a: "PH1", b: "P2", type: "communication", evidence: "CDR-1042", confidence: 92, count: 14, first: "12 Aug", last: "18 Aug" },
  { id: "R3", a: "P1", b: "PH2", type: "communication", evidence: "CDR-1119", confidence: 78, count: 6, first: "14 Aug", last: "19 Aug" },
  { id: "R4", a: "PH2", b: "P4", type: "communication", evidence: "CDR-1119", confidence: 78, count: 6, first: "14 Aug", last: "19 Aug" },
  { id: "R5", a: "P3", b: "PH3", type: "communication", evidence: "CDR-1223", confidence: 88, count: 11, first: "13 Aug", last: "20 Aug" },
  { id: "R6", a: "PH3", b: "P5", type: "communication", evidence: "CDR-1223", confidence: 88, count: 11, first: "13 Aug", last: "20 Aug" },
  { id: "R7", a: "P2", b: "P3", type: "financial", evidence: "TXN-311", confidence: 81, count: 3, first: "16 Aug", last: "20 Aug", amount: "₹4,50,000" },
  { id: "R8", a: "P3", b: "V1", type: "vehicle_association", evidence: "VEH-202", confidence: 95, count: 1, first: "17 Aug", last: "17 Aug" },
  { id: "R9", a: "V1", b: "L1", type: "location_observation", evidence: "LOC-118", confidence: 90, count: 3, first: "17 Aug", last: "20 Aug" },
  { id: "R10", a: "P1", b: "L2", type: "location_observation", evidence: "LOC-203", confidence: 70, count: 2, first: "15 Aug", last: "18 Aug" },
  { id: "R11", a: "P4", b: "L2", type: "location_observation", evidence: "LOC-204", confidence: 66, count: 2, first: "15 Aug", last: "18 Aug" },
  { id: "R12", a: "P2", b: "O1", type: "organization_association", evidence: "ORG-011", confidence: 85, count: 1, first: "05 Aug", last: "05 Aug" },
  { id: "R13", a: "P5", b: "O1", type: "organization_association", evidence: "ORG-012", confidence: 83, count: 1, first: "06 Aug", last: "06 Aug" },
];

export const TIMELINE = [
  { time: "05 Aug · 09:10", type: "organization_association", title: "Organization link recorded", detail: "Meera Sen associated with Silverline Logistics Pvt Ltd", evidence: "ORG-011" },
  { time: "06 Aug · 14:40", type: "organization_association", title: "Organization link recorded", detail: "Sanjay Iyer associated with Silverline Logistics Pvt Ltd", evidence: "ORG-012" },
  { time: "12 Aug · 10:02", type: "communication", title: "Communication", detail: "Arjun Nair ↔ Meera Sen via +91 98•••1042", evidence: "CDR-1042" },
  { time: "14 Aug · 11:35", type: "communication", title: "Communication", detail: "Arjun Nair ↔ Kavita Rao via +91 98•••1119", evidence: "CDR-1119" },
  { time: "15 Aug · 12:15", type: "location_observation", title: "Location observation", detail: "Arjun Nair observed at Cafe Meridian", evidence: "LOC-203" },
  { time: "15 Aug · 12:20", type: "location_observation", title: "Location observation", detail: "Kavita Rao observed at Cafe Meridian", evidence: "LOC-204" },
  { time: "16 Aug · 16:05", type: "financial", title: "Financial transaction", detail: "Meera Sen → Devraj Sharma, ₹1,50,000", evidence: "TXN-311" },
  { time: "17 Aug · 08:50", type: "vehicle_association", title: "Vehicle association", detail: "Devraj Sharma linked to KA-04 White Sedan", evidence: "VEH-202" },
  { time: "17 Aug · 09:30", type: "location_observation", title: "Vehicle observation", detail: "KA-04 White Sedan observed at Warehouse, Sector 12", evidence: "LOC-118" },
  { time: "20 Aug · 17:45", type: "financial", title: "Financial transaction", detail: "Meera Sen → Devraj Sharma, ₹1,00,000", evidence: "TXN-311" },
];

export const COMM_FREQ = [
  { day: "12 Aug", "CDR-1042": 3, "CDR-1119": 0, "CDR-1223": 1 },
  { day: "13 Aug", "CDR-1042": 2, "CDR-1119": 0, "CDR-1223": 2 },
  { day: "14 Aug", "CDR-1042": 1, "CDR-1119": 2, "CDR-1223": 1 },
  { day: "15 Aug", "CDR-1042": 2, "CDR-1119": 1, "CDR-1223": 2 },
  { day: "16 Aug", "CDR-1042": 3, "CDR-1119": 0, "CDR-1223": 1 },
  { day: "17 Aug", "CDR-1042": 1, "CDR-1119": 1, "CDR-1223": 2 },
  { day: "18 Aug", "CDR-1042": 2, "CDR-1119": 2, "CDR-1223": 2 },
];

export const TRANSACTIONS = [
  { id: "TXN-311a", from: "Meera Sen", to: "Devraj Sharma", amount: 150000, date: "16 Aug" },
  { id: "TXN-311b", from: "Meera Sen", to: "Devraj Sharma", amount: 100000, date: "18 Aug" },
  { id: "TXN-311c", from: "Meera Sen", to: "Devraj Sharma", amount: 200000, date: "20 Aug" },
  { id: "TXN-322", from: "Silverline Logistics", to: "Meera Sen", amount: 320000, date: "14 Aug" },
  { id: "TXN-330", from: "Silverline Logistics", to: "Sanjay Iyer", amount: 280000, date: "15 Aug" },
];

export const LEADS_INIT = [
  {
    id: "LEAD-07",
    title: "Entity connects two otherwise separate groups",
    entity: "Meera Sen",
    confidence: 84,
    status: "review",
    evidence: ["TXN-311", "CDR-1042", "ORG-011"],
    text: "Meera Sen appears to connect two otherwise separate communication and financial groups in this case.",
    trace: [
      "Detected pattern: bridge node between two clusters",
      "Relationship: financial transaction to Devraj Sharma (TXN-311)",
      "Relationship: communication with Arjun Nair (CDR-1042)",
      "Source records: TXN-311, CDR-1042, ORG-011",
    ],
  },
  {
    id: "LEAD-12",
    title: "Unusual increase in new communication relationships",
    entity: "Arjun Nair",
    confidence: 86,
    status: "review",
    evidence: ["CDR-1042", "CDR-1119"],
    text: "An unusual increase in new communication relationships was detected and may warrant review.",
    trace: [
      "Detected pattern: rise in distinct contacts over a short window",
      "Relationship: communication with Meera Sen (CDR-1042)",
      "Relationship: communication with Kavita Rao (CDR-1119)",
      "Source records: CDR-1042, CDR-1119",
    ],
  },
  {
    id: "LEAD-15",
    title: "Unusual transaction pattern",
    entity: "Meera Sen ↔ Silverline Logistics",
    confidence: 73,
    status: "review",
    evidence: ["TXN-311", "TXN-322"],
    text: "A repeated pattern of similarly structured transfers was detected between Meera Sen and known counterparties and may warrant review.",
    trace: [
      "Detected pattern: repeated transfers of similar size, short intervals",
      "Relationship: financial transaction (TXN-311)",
      "Relationship: financial transaction (TXN-322)",
      "Source records: TXN-311, TXN-322",
    ],
  },
  {
    id: "LEAD-19",
    title: "Shared location observation",
    entity: "Arjun Nair & Kavita Rao",
    confidence: 66,
    status: "dismissed",
    evidence: ["LOC-203", "LOC-204"],
    text: "Both entities were observed at Cafe Meridian on the same day. Reviewed and assessed as low significance.",
    trace: [
      "Detected pattern: co-location within same time window",
      "Relationship: location observation (LOC-203)",
      "Relationship: location observation (LOC-204)",
      "Source records: LOC-203, LOC-204",
    ],
  },
];

export const RESOLUTION_QUEUE = [
  {
    id: "MATCH-01",
    a: "Devraj Sharma",
    b: "D. Sharma",
    confidence: 91,
    status: "pending",
    reasons: ["Similar name", "Same vehicle (KA-04 White Sedan)", "Same phone contact pattern"],
    aAttrs: { Source: "VEH-202", Phone: "+91 98•••1223", Vehicle: "KA-04 White Sedan" },
    bAttrs: { Source: "LOC-118 witness log", Phone: "+91 98•••1223", Vehicle: "KA-04 White Sedan" },
  },
  {
    id: "MATCH-02",
    a: "Meera Sen",
    b: "M. Sen",
    confidence: 76,
    status: "pending",
    reasons: ["Similar name", "Same organization affiliation", "Overlapping transaction window"],
    aAttrs: { Source: "ORG-011", Phone: "+91 98•••1042", Organization: "Silverline Logistics" },
    bAttrs: { Source: "TXN-322 counterparty field", Phone: "Not captured", Organization: "Silverline Logistics" },
  },
  {
    id: "MATCH-03",
    a: "Kavita Rao",
    b: "K. Rao (Cafe Meridian log)",
    confidence: 58,
    status: "pending",
    reasons: ["Similar name", "Shared location observation"],
    aAttrs: { Source: "CDR-1119", Phone: "+91 98•••1119", Location: "Cafe Meridian" },
    bAttrs: { Source: "LOC-204 manual entry", Phone: "Not captured", Location: "Cafe Meridian" },
  },
];
