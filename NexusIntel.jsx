import React, { useState, useMemo } from "react";
import {
  LayoutDashboard, Network, Clock, Lightbulb, MessageSquare, Wallet,
  Search, ShieldCheck, X, ChevronRight, ChevronDown, AlertTriangle,
  CheckCircle2, XCircle, FileText, Users, Phone, Car, MapPin, Building2,
  Landmark, ArrowRight, Eye, StickyNote, Radio, GitBranch, Info,
  Fingerprint, Activity, ClipboardList, Download, Loader2, GitMerge,
  ArrowRightLeft, LayoutGrid,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

/* ---------------------------------------------------------------------- */
/* DESIGN TOKENS                                                          */
/* ---------------------------------------------------------------------- */
const T = {
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

const ENTITY_STYLE = {
  PERSON: { color: T.signal, dim: T.signalDim, icon: Users, label: "Person" },
  PHONE: { color: "#5B8DEF", dim: "#20304F", icon: Phone, label: "Phone" },
  VEHICLE: { color: T.violet, dim: T.violetDim, icon: Car, label: "Vehicle" },
  LOCATION: { color: T.flag, dim: T.flagDim, icon: MapPin, label: "Location" },
  ORG: { color: T.ok, dim: T.okDim, icon: Building2, label: "Organization" },
};

const REL_STYLE = {
  communication: { color: "#5B8DEF", label: "Communication" },
  financial: { color: T.ok, label: "Financial transaction" },
  vehicle_association: { color: T.violet, label: "Vehicle association" },
  location_observation: { color: T.flag, label: "Location observation" },
  organization_association: { color: "#8CA3B8", label: "Organization association" },
};

/* ---------------------------------------------------------------------- */
/* SYNTHETIC DEMO DATA — CASE-2026-001 (fictional, for demonstration)     */
/* ---------------------------------------------------------------------- */
const ENTITIES = {
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

const RELATIONSHIPS = [
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

const TIMELINE = [
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

const COMM_FREQ = [
  { day: "12 Aug", "CDR-1042": 3, "CDR-1119": 0, "CDR-1223": 1 },
  { day: "13 Aug", "CDR-1042": 2, "CDR-1119": 0, "CDR-1223": 2 },
  { day: "14 Aug", "CDR-1042": 1, "CDR-1119": 2, "CDR-1223": 1 },
  { day: "15 Aug", "CDR-1042": 2, "CDR-1119": 1, "CDR-1223": 2 },
  { day: "16 Aug", "CDR-1042": 3, "CDR-1119": 0, "CDR-1223": 1 },
  { day: "17 Aug", "CDR-1042": 1, "CDR-1119": 1, "CDR-1223": 2 },
  { day: "18 Aug", "CDR-1042": 2, "CDR-1119": 2, "CDR-1223": 2 },
];

const TRANSACTIONS = [
  { id: "TXN-311a", from: "Meera Sen", to: "Devraj Sharma", amount: 150000, date: "16 Aug" },
  { id: "TXN-311b", from: "Meera Sen", to: "Devraj Sharma", amount: 100000, date: "18 Aug" },
  { id: "TXN-311c", from: "Meera Sen", to: "Devraj Sharma", amount: 200000, date: "20 Aug" },
  { id: "TXN-322", from: "Silverline Logistics", to: "Meera Sen", amount: 320000, date: "14 Aug" },
  { id: "TXN-330", from: "Silverline Logistics", to: "Sanjay Iyer", amount: 280000, date: "15 Aug" },
];

const LEADS_INIT = [
  {
    id: "LEAD-07", title: "Entity connects two otherwise separate groups",
    entity: "Meera Sen", confidence: 84, status: "review",
    evidence: ["TXN-311", "CDR-1042", "ORG-011"],
    text: "Meera Sen appears to connect two otherwise separate communication and financial groups in this case.",
    trace: ["Detected pattern: bridge node between two clusters", "Relationship: financial transaction to Devraj Sharma (TXN-311)", "Relationship: communication with Arjun Nair (CDR-1042)", "Source records: TXN-311, CDR-1042, ORG-011"],
  },
  {
    id: "LEAD-12", title: "Unusual increase in new communication relationships",
    entity: "Arjun Nair", confidence: 86, status: "review",
    evidence: ["CDR-1042", "CDR-1119"],
    text: "An unusual increase in new communication relationships was detected and may warrant review.",
    trace: ["Detected pattern: rise in distinct contacts over a short window", "Relationship: communication with Meera Sen (CDR-1042)", "Relationship: communication with Kavita Rao (CDR-1119)", "Source records: CDR-1042, CDR-1119"],
  },
  {
    id: "LEAD-15", title: "Unusual transaction pattern",
    entity: "Meera Sen ↔ Silverline Logistics", confidence: 73, status: "review",
    evidence: ["TXN-311", "TXN-322"],
    text: "A repeated pattern of similarly structured transfers was detected between Meera Sen and known counterparties and may warrant review.",
    trace: ["Detected pattern: repeated transfers of similar size, short intervals", "Relationship: financial transaction (TXN-311)", "Relationship: financial transaction (TXN-322)", "Source records: TXN-311, TXN-322"],
  },
  {
    id: "LEAD-19", title: "Shared location observation",
    entity: "Arjun Nair & Kavita Rao", confidence: 66, status: "dismissed",
    evidence: ["LOC-203", "LOC-204"],
    text: "Both entities were observed at Cafe Meridian on the same day. Reviewed and assessed as low significance.",
    trace: ["Detected pattern: co-location within same time window", "Relationship: location observation (LOC-203)", "Relationship: location observation (LOC-204)", "Source records: LOC-203, LOC-204"],
  },
];

const DUPLICATE_MATCH = {
  a: "Devraj Sharma", b: "D. Sharma", confidence: 91,
  reasons: ["Similar name", "Same vehicle (KA-04 White Sedan)", "Same phone contact pattern"],
};

const RESOLUTION_QUEUE = [
  {
    id: "MATCH-01", a: "Devraj Sharma", b: "D. Sharma", confidence: 91, status: "pending",
    reasons: ["Similar name", "Same vehicle (KA-04 White Sedan)", "Same phone contact pattern"],
    aAttrs: { Source: "VEH-202", Phone: "+91 98•••1223", Vehicle: "KA-04 White Sedan" },
    bAttrs: { Source: "LOC-118 witness log", Phone: "+91 98•••1223", Vehicle: "KA-04 White Sedan" },
  },
  {
    id: "MATCH-02", a: "Meera Sen", b: "M. Sen", confidence: 76, status: "pending",
    reasons: ["Similar name", "Same organization affiliation", "Overlapping transaction window"],
    aAttrs: { Source: "ORG-011", Phone: "+91 98•••1042", Organization: "Silverline Logistics" },
    bAttrs: { Source: "TXN-322 counterparty field", Phone: "Not captured", Organization: "Silverline Logistics" },
  },
  {
    id: "MATCH-03", a: "Kavita Rao", b: "K. Rao (Cafe Meridian log)", confidence: 58, status: "pending",
    reasons: ["Similar name", "Shared location observation"],
    aAttrs: { Source: "CDR-1119", Phone: "+91 98•••1119", Location: "Cafe Meridian" },
    bAttrs: { Source: "LOC-204 manual entry", Phone: "Not captured", Location: "Cafe Meridian" },
  },
];

/* ---------------------------------------------------------------------- */
/* SMALL UI PRIMITIVES                                                    */
/* ---------------------------------------------------------------------- */
function Badge({ children, color, dim }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px",
      borderRadius: 4, fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
      color, background: dim, border: `1px solid ${color}33`, whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function ConfidenceBar({ value }) {
  const color = value >= 85 ? T.ok : value >= 70 ? T.flag : T.textDim;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 4, background: T.borderSoft, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color }} />
      </div>
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: T.textDim }}>{value}%</span>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }) {
  return (
    <div style={{
      background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: T.textDim, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{label}</span>
        <Icon size={16} color={accent || T.textFaint} />
      </div>
      <span style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 600, color: T.text }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: T.textFaint, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function EvidenceChip({ id }) {
  return (
    <span style={{
      fontFamily: "var(--mono)", fontSize: 11, color: T.signal, background: T.signalDim,
      border: `1px solid ${T.signal}33`, borderRadius: 4, padding: "2px 7px",
    }}>{id}</span>
  );
}

/* ---------------------------------------------------------------------- */
/* NAV                                                                    */
/* ---------------------------------------------------------------------- */
const NAV_GROUPS = [
  {
    label: "Investigate",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "graph", label: "Network graph", icon: Network },
      { id: "timeline", label: "Timeline", icon: Clock },
      { id: "leads", label: "AI leads", icon: Lightbulb },
      { id: "comms", label: "Communication", icon: MessageSquare },
      { id: "financial", label: "Financial", icon: Wallet },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "search", label: "Global search", icon: Search },
      { id: "resolution", label: "Entity resolution", icon: Fingerprint },
      { id: "analytics", label: "Network analytics", icon: Activity },
      { id: "reports", label: "Reports", icon: ClipboardList },
    ],
  },
];
const NAV = NAV_GROUPS.flatMap((g) => g.items);

/* ---------------------------------------------------------------------- */
/* MAIN APP                                                               */
/* ---------------------------------------------------------------------- */
export default function NexusIntel() {
  const [tab, setTab] = useState("dashboard");
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [relFilter, setRelFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState(LEADS_INIT);
  const [expandedTrace, setExpandedTrace] = useState(null);
  const [showDup, setShowDup] = useState(true);
  const [resolutions, setResolutions] = useState(RESOLUTION_QUEUE);
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return Object.entries(ENTITIES).filter(([, e]) => e.name.toLowerCase().includes(q)).slice(0, 6);
  }, [search]);

  const visibleRels = useMemo(
    () => RELATIONSHIPS.filter((r) => relFilter === "all" || r.type === relFilter),
    [relFilter]
  );

  const pendingReview = leads.filter((l) => l.status === "review").length;
  const pendingMatches = resolutions.filter((m) => m.status === "pending").length;

  function selectEntity(key) {
    setSelectedNode(key);
    setSelectedEdge(null);
    setTab("graph");
  }

  function setLeadStatus(id, status) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  function setMatchStatus(id, status) {
    setResolutions((rs) => rs.map((m) => (m.id === id ? { ...m, status } : m)));
  }

  function runSearch(q) {
    setSearchQuery(q);
    setTab("search");
  }

  return (
    <div style={{
      "--display": "'Space Grotesk', sans-serif",
      "--mono": "'IBM Plex Mono', monospace",
      fontFamily: "'Inter', sans-serif",
      background: T.bg, color: T.text, minHeight: "100vh", display: "flex",
      flexDirection: "column", fontSize: 14,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        button { font-family: inherit; cursor: pointer; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .navbtn { transition: background .12s, color .12s; }
        .navbtn:hover { background: ${T.panelAlt}; }
        .node { cursor: pointer; }
        .node:hover circle.ring { stroke-opacity: 1 !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
        .tabpane { animation: fadeIn .18s ease-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin .8s linear infinite; }
      `}</style>

      {/* ---------------- TOP BAR ---------------- */}
      <div style={{
        height: 56, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center",
        padding: "0 20px", gap: 24, background: T.panel, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, background: T.signalDim,
            border: `1px solid ${T.signal}55`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <GitBranch size={14} color={T.signal} />
          </div>
          <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>NEXUS INTEL</span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
          background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 6,
        }}>
          <FileText size={13} color={T.textFaint} />
          <span style={{ fontSize: 12.5, color: T.textDim }}>CASE-2026-001</span>
          <span style={{ fontSize: 11, color: T.ok, background: T.okDim, padding: "1px 7px", borderRadius: 3, fontWeight: 600 }}>ACTIVE</span>
        </div>

        <div style={{ position: "relative", flex: 1, maxWidth: 380 }}>
          <Search size={14} color={T.textFaint} style={{ position: "absolute", left: 10, top: 9 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) { runSearch(search); setSearch(""); }
            }}
            placeholder="Search entities, phones, vehicles, evidence… (Enter for full results)"
            style={{
              width: "100%", background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 6,
              padding: "7px 10px 7px 30px", color: T.text, fontSize: 13, outline: "none",
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: "absolute", top: 36, left: 0, right: 0, background: T.raised,
              border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", zIndex: 30,
              boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
            }}>
              {searchResults.map(([key, e]) => {
                const S = ENTITY_STYLE[e.type];
                return (
                  <div key={key} onClick={() => { selectEntity(key); setSearch(""); }}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderBottom: `1px solid ${T.borderSoft}` }}
                    className="navbtn">
                    <S.icon size={14} color={S.color} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: 13 }}>{e.name}</span>
                      <span style={{ fontSize: 11, color: T.textFaint }}>{S.label} · {e.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <ShieldCheck size={14} color={T.textDim} />
          <span style={{ fontSize: 12.5, color: T.textDim }}>Investigator · R. Basu</span>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* ---------------- LEFT NAV ---------------- */}
        <div style={{
          width: 190, borderRight: `1px solid ${T.border}`, background: T.panel,
          display: "flex", flexDirection: "column", padding: "14px 8px", flexShrink: 0, gap: 2,
        }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label} style={{ marginTop: gi === 0 ? 0 : 14 }}>
              <div style={{ padding: "4px 12px 6px", fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: T.textFaint }}>
                {group.label}
              </div>
              {group.items.map((n) => {
                const active = tab === n.id;
                return (
                  <button key={n.id} onClick={() => setTab(n.id)} className="navbtn"
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 7,
                      border: "none", background: active ? T.panelAlt : "transparent",
                      color: active ? T.text : T.textDim, fontSize: 13, fontWeight: active ? 600 : 500,
                      textAlign: "left", borderLeft: active ? `2px solid ${T.signal}` : "2px solid transparent",
                      width: "100%",
                    }}>
                    <n.icon size={15} color={active ? T.signal : T.textFaint} />
                    {n.label}
                    {n.id === "leads" && pendingReview > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 10.5, background: T.flagDim, color: T.flag, borderRadius: 8, padding: "1px 6px", fontWeight: 700 }}>
                        {pendingReview}
                      </span>
                    )}
                    {n.id === "resolution" && pendingMatches > 0 && (
                      <span style={{ marginLeft: "auto", fontSize: 10.5, background: T.flagDim, color: T.flag, borderRadius: 8, padding: "1px 6px", fontWeight: 700 }}>
                        {pendingMatches}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{ marginTop: "auto", padding: "10px 12px", fontSize: 11, color: T.textFaint, lineHeight: 1.5 }}>
            Decision-support only. AI findings require investigator review before action.
          </div>
        </div>

        {/* ---------------- MAIN CONTENT ---------------- */}
        <div style={{ flex: 1, overflow: "auto", padding: 22, minWidth: 0 }}>
          <div key={tab} className="tabpane">
            {tab === "dashboard" && (
              <Dashboard leads={leads} onOpenLead={() => setTab("leads")} onSelectEntity={selectEntity}
                showDup={showDup} setShowDup={setShowDup} pendingMatches={pendingMatches}
                onOpenResolution={() => setTab("resolution")} />
            )}
            {tab === "graph" && (
              <GraphView
                selectedNode={selectedNode} setSelectedNode={setSelectedNode}
                selectedEdge={selectedEdge} setSelectedEdge={setSelectedEdge}
                relFilter={relFilter} setRelFilter={setRelFilter} visibleRels={visibleRels}
                onSelectEntity={selectEntity}
              />
            )}
            {tab === "timeline" && <TimelineView />}
            {tab === "leads" && (
              <LeadsView leads={leads} expandedTrace={expandedTrace} setExpandedTrace={setExpandedTrace}
                setLeadStatus={setLeadStatus} onSelectEntity={selectEntity} />
            )}
            {tab === "comms" && <CommsView />}
            {tab === "financial" && <FinancialView />}
            {tab === "search" && <SearchView initialQuery={searchQuery} onSelectEntity={selectEntity} />}
            {tab === "resolution" && <ResolutionView matches={resolutions} setMatchStatus={setMatchStatus} onSelectEntity={selectEntity} />}
            {tab === "analytics" && <AnalyticsView onSelectEntity={selectEntity} />}
            {tab === "reports" && <ReportsView leads={leads} resolutions={resolutions} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD                                                              */
/* ---------------------------------------------------------------------- */
function Dashboard({ leads, onOpenLead, onSelectEntity, showDup, setShowDup, pendingMatches, onOpenResolution }) {
  const reviewLeads = leads.filter((l) => l.status === "review");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1180 }}>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 600 }}>Investigation command center</div>
        <div style={{ color: T.textDim, fontSize: 13, marginTop: 3 }}>CASE-2026-001 · Fictional demonstration data</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        <KpiCard label="Evidence items" value="248" icon={FileText} />
        <KpiCard label="Entities" value="1,842" icon={Users} />
        <KpiCard label="Relationships" value="5,620" icon={Network} />
        <KpiCard label="AI leads" value={leads.length} icon={Lightbulb} accent={T.flag} />
        <KpiCard label="Pending reviews" value={reviewLeads.length} icon={AlertTriangle} accent={T.flag} />
        <KpiCard label="Active cases" value="6" icon={ShieldCheck} accent={T.signal} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <SectionLabel>AI findings awaiting review</SectionLabel>
            <button onClick={onOpenLead} style={{ background: "none", border: "none", color: T.signal, fontSize: 12, display: "flex", alignItems: "center", gap: 3 }}>
              View all <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewLeads.map((l) => (
              <div key={l.id} onClick={onOpenLead} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "10px 12px", background: T.panelAlt, borderRadius: 8, border: `1px solid ${T.borderSoft}`, cursor: "pointer",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{l.title}</span>
                  <span style={{ fontSize: 12, color: T.textFaint }}>{l.entity}</span>
                </div>
                <ConfidenceBar value={l.confidence} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {showDup && (
            <div style={{ background: T.flagDim, border: `1px solid ${T.flag}55`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={14} color={T.flag} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: T.flag, letterSpacing: 0.3 }}>POTENTIAL ENTITY MATCH</span>
              </div>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--mono)" }}>{DUPLICATE_MATCH.a}</span> may be the same person as <span style={{ fontFamily: "var(--mono)" }}>{DUPLICATE_MATCH.b}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                {DUPLICATE_MATCH.reasons.map((r) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textDim }}>
                    <CheckCircle2 size={12} color={T.ok} /> {r}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: pendingMatches > 1 ? 10 : 0 }}>
                <ConfidenceBar value={DUPLICATE_MATCH.confidence} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowDup(false)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, borderRadius: 6, padding: "5px 10px", fontSize: 12 }}>Dismiss</button>
                  <button onClick={onOpenResolution} style={{ background: T.flag, border: "none", color: "#241804", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600 }}>Review match</button>
                </div>
              </div>
              {pendingMatches > 1 && (
                <button onClick={onOpenResolution} style={{
                  width: "100%", background: "none", border: `1px dashed ${T.flag}66`, borderRadius: 6,
                  padding: "6px 8px", fontSize: 11.5, color: T.flag,
                }}>
                  +{pendingMatches - 1} more potential match{pendingMatches - 1 > 1 ? "es" : ""} in queue
                </button>
              )}
            </div>
          )}

          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <SectionLabel>Recent investigator actions</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["R. Basu", "reviewed AI lead LEAD-19", "2h ago"],
                ["R. Basu", "ran pattern analysis on Case-2026-001", "3h ago"],
                ["A. Fernandes", "imported evidence batch (12 records)", "5h ago"],
                ["R. Basu", "opened entity ENT-101", "6h ago"],
              ].map(([who, what, when], i) => (
                <div key={i} style={{ fontSize: 12.5, color: T.textDim, display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span><span style={{ color: T.text }}>{who}</span> {what}</span>
                  <span style={{ color: T.textFaint, flexShrink: 0 }}>{when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* NETWORK GRAPH VIEW                                                     */
/* ---------------------------------------------------------------------- */
function GraphView({ selectedNode, setSelectedNode, selectedEdge, setSelectedEdge, relFilter, setRelFilter, visibleRels, onSelectEntity }) {
  const nodeKeys = useMemo(() => {
    const keys = new Set();
    visibleRels.forEach((r) => { keys.add(r.a); keys.add(r.b); });
    return keys;
  }, [visibleRels]);

  return (
    <div style={{ display: "flex", gap: 16, maxWidth: 1180, height: "calc(100vh - 130px)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Investigation network</span>
          <span style={{ fontSize: 12, color: T.textFaint }}>Showing 13 of 5,620 relationships in this case</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", ...Object.keys(REL_STYLE)].map((rt) => (
              <button key={rt} onClick={() => setRelFilter(rt)} style={{
                fontSize: 11.5, padding: "5px 10px", borderRadius: 6,
                border: `1px solid ${relFilter === rt ? T.signal : T.border}`,
                background: relFilter === rt ? T.signalDim : "transparent",
                color: relFilter === rt ? T.signal : T.textDim, fontWeight: 500,
              }}>
                {rt === "all" ? "All types" : REL_STYLE[rt].label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, position: "relative", overflow: "hidden" }}>
          <svg viewBox="0 0 900 480" style={{ width: "100%", height: "100%" }}>
            {visibleRels.map((r) => {
              const a = ENTITIES[r.a], b = ENTITIES[r.b];
              const style = REL_STYLE[r.type];
              const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
              const active = selectedEdge === r.id;
              return (
                <g key={r.id} onClick={() => { setSelectedEdge(r.id); setSelectedNode(null); }} className="node">
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={style.color}
                    strokeWidth={active ? 2.6 : 1.4} strokeOpacity={active ? 0.95 : 0.45} />
                  <rect x={mx - 26} y={my - 8} width={52} height={16} rx={3} fill={T.panel} stroke={style.color} strokeOpacity={0.5} />
                  <text x={mx} y={my + 4} textAnchor="middle" fontFamily="var(--mono)" fontSize={9} fill={style.color}>{r.evidence}</text>
                </g>
              );
            })}
            {Object.entries(ENTITIES).filter(([k]) => nodeKeys.has(k)).map(([key, e]) => {
              const S = ENTITY_STYLE[e.type];
              const active = selectedNode === key;
              return (
                <g key={key} className="node" onClick={() => { setSelectedNode(key); setSelectedEdge(null); }}
                  transform={`translate(${e.x},${e.y})`}>
                  <circle className="ring" r={19} fill="none" stroke={S.color} strokeWidth={2} strokeOpacity={active ? 1 : 0.35} />
                  <circle r={13} fill={S.dim} stroke={S.color} strokeWidth={1.3} />
                  <SvgIcon Icon={S.icon} color={S.color} />
                  <text y={34} textAnchor="middle" fontSize={11} fill={active ? T.text : T.textDim} fontWeight={active ? 600 : 500}>
                    {e.name.length > 20 ? e.name.slice(0, 19) + "…" : e.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ position: "absolute", left: 14, bottom: 14, display: "flex", gap: 10, flexWrap: "wrap", maxWidth: 340 }}>
            {Object.entries(ENTITY_STYLE).map(([k, s]) => (
              <div key={k} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: T.textDim }}>
                <span style={{ width: 8, height: 8, borderRadius: 8, background: s.color, display: "inline-block" }} />
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* right side panel */}
      <div style={{ width: 300, flexShrink: 0, overflow: "auto" }}>
        {selectedNode && <EntityPanel entityKey={selectedNode} onSelectEntity={onSelectEntity} onClose={() => setSelectedNode(null)} />}
        {selectedEdge && <EdgePanel relId={selectedEdge} onClose={() => setSelectedEdge(null)} />}
        {!selectedNode && !selectedEdge && (
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, color: T.textFaint, fontSize: 12.5, lineHeight: 1.6 }}>
            <Info size={15} color={T.textFaint} style={{ marginBottom: 8 }} />
            Select a node to view its entity profile, or select a connection to see the supporting evidence behind it.
          </div>
        )}
      </div>
    </div>
  );
}

function SvgIcon({ Icon, color }) {
  return (
    <foreignObject x={-8} y={-8} width={16} height={16} style={{ pointerEvents: "none" }}>
      <div style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={12} color={color} />
      </div>
    </foreignObject>
  );
}

function EntityPanel({ entityKey, onSelectEntity, onClose }) {
  const e = ENTITIES[entityKey];
  const S = ENTITY_STYLE[e.type];
  const rels = RELATIONSHIPS.filter((r) => r.a === entityKey || r.b === entityKey);
  const connected = [...new Set(rels.map((r) => (r.a === entityKey ? r.b : r.a)))];
  const evidenceIds = [...new Set(rels.map((r) => r.evidence))];

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <SectionLabel>Entity profile</SectionLabel>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textFaint }}><X size={15} /></button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: S.dim, border: `1px solid ${S.color}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <S.icon size={16} color={S.color} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{e.name}</div>
          <div style={{ fontSize: 11, color: T.textFaint, fontFamily: "var(--mono)" }}>{e.id} · {S.label}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textDim, marginBottom: 14 }}>{e.sub}</div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, marginBottom: 6 }}>CONNECTIONS ({connected.length})</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
        {connected.map((k) => {
          const ce = ENTITIES[k]; const CS = ENTITY_STYLE[ce.type];
          return (
            <div key={k} onClick={() => onSelectEntity(k)} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "6px 8px", borderRadius: 6, cursor: "pointer",
            }} className="navbtn">
              <CS.icon size={12} color={CS.color} />
              <span style={{ fontSize: 12.5 }}>{ce.name}</span>
              <ChevronRight size={12} color={T.textFaint} style={{ marginLeft: "auto" }} />
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, marginBottom: 6 }}>EVIDENCE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {evidenceIds.map((ev) => <EvidenceChip key={ev} id={ev} />)}
      </div>
    </div>
  );
}

function EdgePanel({ relId, onClose }) {
  const r = RELATIONSHIPS.find((x) => x.id === relId);
  const style = REL_STYLE[r.type];
  const a = ENTITIES[r.a], b = ENTITIES[r.b];
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <SectionLabel>Why does this connection exist?</SectionLabel>
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.textFaint }}><X size={15} /></button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 10, flexWrap: "wrap" }}>
        <span>{a.name}</span><ArrowRight size={12} color={T.textFaint} /><span>{b.name}</span>
      </div>
      <Badge color={style.color} dim={`${style.color}22`}>{style.label}</Badge>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14, fontSize: 12.5 }}>
        <Row label="Source record" value={<EvidenceChip id={r.evidence} />} />
        <Row label="Observed interactions" value={r.count} />
        <Row label="First observed" value={r.first} />
        <Row label="Last observed" value={r.last} />
        {r.amount && <Row label="Amount" value={r.amount} />}
        <Row label="Confidence" value={<ConfidenceBar value={r.confidence} />} />
      </div>
      <button style={{
        marginTop: 14, width: "100%", background: T.panelAlt, border: `1px solid ${T.border}`,
        borderRadius: 7, padding: "8px 10px", color: T.textDim, fontSize: 12.5, display: "flex",
        alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <Eye size={13} /> View source record
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ color: T.textFaint }}>{label}</span>
      <span style={{ color: T.text }}>{value}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* TIMELINE VIEW                                                          */
/* ---------------------------------------------------------------------- */
function TimelineView() {
  const [filter, setFilter] = useState("all");
  const items = TIMELINE.filter((t) => filter === "all" || t.type === filter);
  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Investigation timeline</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 16 }}>Chronological reconstruction from all authorized data sources · 05 Aug – 20 Aug 2026</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {["all", ...Object.keys(REL_STYLE)].map((rt) => (
          <button key={rt} onClick={() => setFilter(rt)} style={{
            fontSize: 11.5, padding: "5px 10px", borderRadius: 6,
            border: `1px solid ${filter === rt ? T.signal : T.border}`,
            background: filter === rt ? T.signalDim : "transparent",
            color: filter === rt ? T.signal : T.textDim, fontWeight: 500,
          }}>
            {rt === "all" ? "All events" : REL_STYLE[rt].label}
          </button>
        ))}
      </div>
      <div style={{ position: "relative", paddingLeft: 22 }}>
        <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1.5, background: T.border }} />
        {items.map((t, i) => {
          const style = REL_STYLE[t.type];
          return (
            <div key={i} style={{ position: "relative", marginBottom: 22 }}>
              <div style={{
                position: "absolute", left: -22, top: 3, width: 10, height: 10, borderRadius: 10,
                background: style.color, border: `2px solid ${T.bg}`,
              }} />
              <div style={{ fontSize: 11, color: T.textFaint, fontFamily: "var(--mono)", marginBottom: 3 }}>{t.time}</div>
              <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 13px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 2 }}>{t.detail}</div>
                </div>
                <EvidenceChip id={t.evidence} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* AI LEADS VIEW                                                          */
/* ---------------------------------------------------------------------- */
function LeadsView({ leads, expandedTrace, setExpandedTrace, setLeadStatus, onSelectEntity }) {
  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Evidence-backed AI investigation leads</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 18, lineHeight: 1.6, maxWidth: 640 }}>
        These are analytical observations, not conclusions. Every lead must be reviewed by an investigator before any action is taken.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {leads.map((l) => {
          const statusMeta = {
            review: { label: "Needs review", color: T.flag, dim: T.flagDim, Icon: AlertTriangle },
            reviewed: { label: "Reviewed", color: T.ok, dim: T.okDim, Icon: CheckCircle2 },
            dismissed: { label: "Dismissed", color: T.textFaint, dim: T.borderSoft, Icon: XCircle },
          }[l.status];
          const open = expandedTrace === l.id;
          return (
            <div key={l.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.textFaint, marginBottom: 3 }}>{l.id}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{l.title}</div>
                  <div onClick={() => onSelectEntity(Object.keys(ENTITIES).find((k) => ENTITIES[k].name === l.entity) || null)}
                    style={{ fontSize: 12.5, color: T.signal, marginTop: 2, cursor: "pointer", display: "inline-block" }}>
                    {l.entity}
                  </div>
                </div>
                <Badge color={statusMeta.color} dim={statusMeta.dim}>
                  <statusMeta.Icon size={11} /> {statusMeta.label}
                </Badge>
              </div>

              <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.55, marginBottom: 10 }}>{l.text}</div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {l.evidence.map((ev) => <EvidenceChip key={ev} id={ev} />)}
                </div>
                <ConfidenceBar value={l.confidence} />
              </div>

              <button onClick={() => setExpandedTrace(open ? null : l.id)} style={{
                marginTop: 12, background: "none", border: "none", color: T.textDim, fontSize: 12,
                display: "flex", alignItems: "center", gap: 5, padding: 0,
              }}>
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Why am I seeing this?
              </button>

              {open && (
                <div style={{ marginTop: 10, padding: "12px 14px", background: T.panelAlt, borderRadius: 8, border: `1px solid ${T.borderSoft}` }}>
                  {l.trace.map((step, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: i === l.trace.length - 1 ? 0 : 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 5, background: T.signal, marginTop: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, color: T.textDim }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {l.status === "review" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <ActionBtn onClick={() => setLeadStatus(l.id, "reviewed")} icon={CheckCircle2} label="Mark reviewed" color={T.ok} />
                  <ActionBtn onClick={() => setLeadStatus(l.id, "dismissed")} icon={XCircle} label="Dismiss" color={T.textDim} />
                  <ActionBtn onClick={() => {}} icon={StickyNote} label="Add note" color={T.textDim} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon: Icon, label, color }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "6px 11px",
      borderRadius: 6, border: `1px solid ${T.border}`, background: T.panelAlt, color,
    }}>
      <Icon size={13} /> {label}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* COMMUNICATION ANALYSIS                                                 */
/* ---------------------------------------------------------------------- */
function CommsView() {
  const pairs = [
    { a: "Arjun Nair", b: "Meera Sen", record: "CDR-1042", count: 14, trend: "Stable" },
    { a: "Devraj Sharma", b: "Sanjay Iyer", record: "CDR-1223", count: 11, trend: "Increasing" },
    { a: "Arjun Nair", b: "Kavita Rao", record: "CDR-1119", count: 6, trend: "New" },
  ];
  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Communication analysis</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 18 }}>Synthetic CDR data · 12 Aug – 18 Aug 2026</div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <SectionLabel>Communication frequency by record</SectionLabel>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COMM_FREQ} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderSoft} vertical={false} />
              <XAxis dataKey="day" stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={{ stroke: T.border }} />
              <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} width={24} />
              <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="CDR-1042" fill="#5B8DEF" radius={[2, 2, 0, 0]} />
              <Bar dataKey="CDR-1119" fill={T.violet} radius={[2, 2, 0, 0]} />
              <Bar dataKey="CDR-1223" fill={T.flag} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <SectionLabel>Frequent communication pairs</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr 0.8fr", padding: "6px 4px", fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
            <span>PAIR</span><span>RECORD</span><span>INTERACTIONS</span><span>TREND</span>
          </div>
          {pairs.map((p, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 0.8fr 0.8fr", padding: "10px 4px", fontSize: 13, alignItems: "center", borderBottom: i < pairs.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <span>{p.a} ↔ {p.b}</span>
              <EvidenceChip id={p.record} />
              <span>{p.count}</span>
              <Badge color={p.trend === "Increasing" ? T.flag : p.trend === "New" ? T.signal : T.textDim} dim={T.panelAlt}>{p.trend}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* FINANCIAL ANALYSIS                                                     */
/* ---------------------------------------------------------------------- */
function FinancialView() {
  const chartData = TRANSACTIONS.map((t) => ({ date: t.date, amount: t.amount, label: t.id }));
  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Financial relationship analysis</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 18 }}>Synthetic transaction records · 05 Aug – 20 Aug 2026</div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <SectionLabel>Transaction amounts over time</SectionLabel>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderSoft} vertical={false} />
              <XAxis dataKey="date" stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={{ stroke: T.border }} />
              <YAxis stroke={T.textFaint} fontSize={11} tickLine={false} axisLine={false} width={44}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: T.raised, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Amount"]} />
              <Line type="monotone" dataKey="amount" stroke={T.ok} strokeWidth={2} dot={{ r: 4, fill: T.ok }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <SectionLabel>Transaction ledger (repeated counterparties)</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.2fr 1.2fr 1fr 0.8fr", padding: "6px 4px", fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
            <span>RECORD</span><span>FROM</span><span>TO</span><span>AMOUNT</span><span>DATE</span>
          </div>
          {TRANSACTIONS.map((t, i) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "0.9fr 1.2fr 1.2fr 1fr 0.8fr", padding: "10px 4px", fontSize: 13, alignItems: "center", borderBottom: i < TRANSACTIONS.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
              <EvidenceChip id={t.id} />
              <span>{t.from}</span>
              <span>{t.to}</span>
              <span style={{ fontFamily: "var(--mono)" }}>₹{t.amount.toLocaleString("en-IN")}</span>
              <span style={{ color: T.textDim }}>{t.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* GLOBAL SEARCH                                                          */
/* ---------------------------------------------------------------------- */
function SearchView({ initialQuery, onSelectEntity }) {
  const [q, setQ] = useState(initialQuery || "");
  const query = q.trim().toLowerCase();

  const entityHits = useMemo(() => {
    if (!query) return [];
    return Object.entries(ENTITIES).filter(([, e]) => e.name.toLowerCase().includes(query));
  }, [query]);

  const evidenceHits = useMemo(() => {
    if (!query) return [];
    return RELATIONSHIPS.filter((r) => r.evidence.toLowerCase().includes(query));
  }, [query]);

  const eventHits = useMemo(() => {
    if (!query) return [];
    return TIMELINE.filter((t) => t.detail.toLowerCase().includes(query) || t.evidence.toLowerCase().includes(query));
  }, [query]);

  const totalHits = entityHits.length + evidenceHits.length + eventHits.length;

  function chainFor(key) {
    const direct = RELATIONSHIPS.filter((r) => r.a === key || r.b === key);
    const chain = [ENTITIES[key].name];
    const seen = new Set([key]);
    direct.slice(0, 3).forEach((r) => {
      const other = r.a === key ? r.b : r.a;
      if (!seen.has(other)) { chain.push(ENTITIES[other].name); seen.add(other); }
    });
    return chain;
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Global investigation search</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 16 }}>Search across entities, evidence records, and timeline events in this case</div>

      <div style={{ position: "relative", maxWidth: 460, marginBottom: 20 }}>
        <Search size={14} color={T.textFaint} style={{ position: "absolute", left: 10, top: 11 }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Devraj, CDR-1042, warehouse…"
          style={{
            width: "100%", background: T.panel, border: `1px solid ${T.border}`, borderRadius: 7,
            padding: "9px 12px 9px 32px", color: T.text, fontSize: 13.5, outline: "none",
          }}
        />
      </div>

      {!query && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
          {Object.entries(ENTITY_STYLE).map(([type, s]) => {
            const count = Object.values(ENTITIES).filter((e) => e.type === type).length;
            return (
              <div key={type} onClick={() => setQ(s.label.toLowerCase())} style={{
                background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, cursor: "pointer",
              }} className="navbtn">
                <s.icon size={16} color={s.color} />
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>{count}</div>
                <div style={{ fontSize: 11.5, color: T.textFaint }}>{s.label}{count !== 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>
      )}

      {query && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 12, color: T.textFaint }}>{totalHits} result{totalHits !== 1 ? "s" : ""} for "{q}"</div>

          {entityHits.length > 0 && (
            <div>
              <SectionLabel>Entities</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entityHits.map(([key, e]) => {
                  const S = ENTITY_STYLE[e.type];
                  return (
                    <div key={key} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 13px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div onClick={() => onSelectEntity(key)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                          <S.icon size={14} color={S.color} />
                          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{e.name}</span>
                          <span style={{ fontSize: 11, color: T.textFaint, fontFamily: "var(--mono)" }}>{e.id}</span>
                        </div>
                        <ChevronRight size={13} color={T.textFaint} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        {chainFor(key).map((name, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && <ArrowRight size={11} color={T.textFaint} />}
                            <span style={{ fontSize: 11.5, color: i === 0 ? T.text : T.textDim, fontWeight: i === 0 ? 600 : 400 }}>{name}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {evidenceHits.length > 0 && (
            <div>
              <SectionLabel>Evidence records</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {evidenceHits.map((r) => (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px" }}>
                    <EvidenceChip id={r.evidence} />
                    <span style={{ fontSize: 12.5, color: T.textDim }}>{REL_STYLE[r.type].label} between {ENTITIES[r.a].name} and {ENTITIES[r.b].name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {eventHits.length > 0 && (
            <div>
              <SectionLabel>Timeline events</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {eventHits.map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px" }}>
                    <span style={{ fontSize: 11, color: T.textFaint, fontFamily: "var(--mono)", minWidth: 92 }}>{t.time}</span>
                    <span style={{ fontSize: 12.5, color: T.textDim }}>{t.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalHits === 0 && (
            <div style={{ color: T.textFaint, fontSize: 13, padding: "20px 0" }}>No matches in the current case dataset.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ENTITY RESOLUTION                                                      */
/* ---------------------------------------------------------------------- */
function ResolutionView({ matches, setMatchStatus, onSelectEntity }) {
  const [expanded, setExpanded] = useState(matches[0]?.id || null);
  const pending = matches.filter((m) => m.status === "pending").length;

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Entity resolution queue</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 18, maxWidth: 620, lineHeight: 1.6 }}>
        Potential duplicate entities detected across sources. Matches are never merged automatically — every merge requires investigator confirmation.
      </div>
      <div style={{ fontSize: 12, color: T.textFaint, marginBottom: 14 }}>{pending} pending of {matches.length} total</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {matches.map((m) => {
          const open = expanded === m.id;
          const statusMeta = {
            pending: { label: "Pending review", color: T.flag, dim: T.flagDim, Icon: AlertTriangle },
            merged: { label: "Confirmed match", color: T.ok, dim: T.okDim, Icon: GitMerge },
            rejected: { label: "Not a match", color: T.textFaint, dim: T.borderSoft, Icon: XCircle },
          }[m.status];
          return (
            <div key={m.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: T.textFaint, marginBottom: 4 }}>{m.id}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500 }}>
                    <Fingerprint size={14} color={T.textDim} />
                    <span>{m.a}</span><ArrowRightLeft size={12} color={T.textFaint} /><span>{m.b}</span>
                  </div>
                </div>
                <Badge color={statusMeta.color} dim={statusMeta.dim}><statusMeta.Icon size={11} /> {statusMeta.label}</Badge>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                {m.reasons.map((r) => (
                  <div key={r} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textDim }}>
                    <CheckCircle2 size={12} color={T.ok} /> {r}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <ConfidenceBar value={m.confidence} />
                <button onClick={() => setExpanded(open ? null : m.id)} style={{ background: "none", border: "none", color: T.textDim, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
                  {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Compare attributes
                </button>
              </div>

              {open && (
                <div style={{ marginTop: 12, background: T.panelAlt, border: `1px solid ${T.borderSoft}`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, marginBottom: 6 }}>{m.a.toUpperCase()}</div>
                      {Object.entries(m.aAttrs).map(([k, v]) => <Row key={k} label={k} value={v} />)}
                    </div>
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, marginBottom: 6 }}>{m.b.toUpperCase()}</div>
                      {Object.entries(m.bAttrs).map(([k, v]) => <Row key={k} label={k} value={v} />)}
                    </div>
                  </div>
                </div>
              )}

              {m.status === "pending" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <ActionBtn onClick={() => setMatchStatus(m.id, "merged")} icon={GitMerge} label="Confirm merge" color={T.ok} />
                  <ActionBtn onClick={() => setMatchStatus(m.id, "rejected")} icon={XCircle} label="Not a match" color={T.textDim} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* NETWORK ANALYTICS (real degree / betweenness / closeness / components) */
/* ---------------------------------------------------------------------- */
function computeGraphMetrics(excludeEdgeId) {
  const nodes = Object.keys(ENTITIES);
  const edges = RELATIONSHIPS.filter((r) => r.id !== excludeEdgeId);
  const adj = Object.fromEntries(nodes.map((n) => [n, []]));
  edges.forEach((r) => { adj[r.a].push(r.b); adj[r.b].push(r.a); });

  const degree = Object.fromEntries(nodes.map((n) => [n, adj[n].length]));

  function bfsDist(src) {
    const dist = { [src]: 0 };
    const queue = [src];
    while (queue.length) {
      const cur = queue.shift();
      adj[cur].forEach((nb) => {
        if (!(nb in dist)) { dist[nb] = dist[cur] + 1; queue.push(nb); }
      });
    }
    return dist;
  }

  const closeness = {};
  nodes.forEach((n) => {
    const dist = bfsDist(n);
    const reachable = Object.values(dist).filter((d) => d > 0);
    const sum = reachable.reduce((a, b) => a + b, 0);
    closeness[n] = reachable.length > 0 ? +(reachable.length / sum || 0).toFixed(3) : 0;
  });

  // Brandes' algorithm (unweighted betweenness)
  const betweenness = Object.fromEntries(nodes.map((n) => [n, 0]));
  nodes.forEach((s) => {
    const stack = [];
    const pred = Object.fromEntries(nodes.map((n) => [n, []]));
    const sigma = Object.fromEntries(nodes.map((n) => [n, 0]));
    const dist = Object.fromEntries(nodes.map((n) => [n, -1]));
    sigma[s] = 1; dist[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift();
      stack.push(v);
      adj[v].forEach((w) => {
        if (dist[w] < 0) { queue.push(w); dist[w] = dist[v] + 1; }
        if (dist[w] === dist[v] + 1) { sigma[w] += sigma[v]; pred[w].push(v); }
      });
    }
    const delta = Object.fromEntries(nodes.map((n) => [n, 0]));
    while (stack.length) {
      const w = stack.pop();
      pred[w].forEach((v) => { delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]); });
      if (w !== s) betweenness[w] += delta[w];
    }
  });
  nodes.forEach((n) => { betweenness[n] = +(betweenness[n] / 2).toFixed(1); });

  // connected components
  const seen = new Set();
  const components = [];
  nodes.forEach((n) => {
    if (seen.has(n)) return;
    const comp = []; const queue = [n]; seen.add(n);
    while (queue.length) {
      const cur = queue.shift(); comp.push(cur);
      adj[cur].forEach((nb) => { if (!seen.has(nb)) { seen.add(nb); queue.push(nb); } });
    }
    components.push(comp);
  });

  return { degree, closeness, betweenness, components };
}

function AnalyticsView({ onSelectEntity }) {
  const base = useMemo(() => computeGraphMetrics(null), []);
  const topBridge = useMemo(() => {
    return RELATIONSHIPS.reduce((max, r) => (base.betweenness[r.a] + base.betweenness[r.b] > max.score
      ? { id: r.id, score: base.betweenness[r.a] + base.betweenness[r.b] } : max), { id: null, score: -1 });
  }, [base]);
  const split = useMemo(() => computeGraphMetrics(topBridge.id), [topBridge]);

  const ranked = Object.keys(ENTITIES)
    .map((k) => ({ key: k, name: ENTITIES[k].name, degree: base.degree[k], betweenness: base.betweenness[k], closeness: base.closeness[k] }))
    .sort((a, b) => b.betweenness - a.betweenness || b.degree - a.degree);

  const bridgeEntity = ranked[0];

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Network analytics</div>
      <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 18, maxWidth: 640, lineHeight: 1.6 }}>
        Structural metrics computed from the current relationship graph. High centrality indicates a structurally important position in the network — it is not evidence of wrongdoing.
      </div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, marginBottom: 16 }}>
        <SectionLabel>Entities ranked by betweenness centrality</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.9fr 0.9fr", padding: "6px 4px", fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
            <span>ENTITY</span><span>DEGREE</span><span>BETWEENNESS</span><span>CLOSENESS</span>
          </div>
          {ranked.map((r, i) => {
            const S = ENTITY_STYLE[ENTITIES[r.key].type];
            return (
              <div key={r.key} onClick={() => onSelectEntity(r.key)} style={{
                display: "grid", gridTemplateColumns: "1.6fr 0.8fr 0.9fr 0.9fr", padding: "9px 4px", fontSize: 13,
                alignItems: "center", borderBottom: i < ranked.length - 1 ? `1px solid ${T.borderSoft}` : "none", cursor: "pointer",
              }} className="navbtn">
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}><S.icon size={12} color={S.color} />{r.name}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{r.degree}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{r.betweenness}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{r.closeness}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <SectionLabel>Community structure</SectionLabel>
        <div style={{ fontSize: 12.5, color: T.textDim, marginBottom: 12, lineHeight: 1.6 }}>
          Removing the highest-betweenness connection ({topBridge.id ? RELATIONSHIPS.find((r) => r.id === topBridge.id)?.evidence : "—"}) splits the network into
          {" "}{split.components.length} groups, suggesting <span style={{ color: T.text }}>{bridgeEntity?.name}</span> plays a bridging role between otherwise separate clusters.
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {split.components.map((comp, i) => (
            <div key={i} style={{ flex: "1 1 200px", background: T.panelAlt, border: `1px solid ${T.borderSoft}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, marginBottom: 8 }}>GROUP {String.fromCharCode(65 + i)} · {comp.length} entities</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {comp.map((k) => {
                  const S = ENTITY_STYLE[ENTITIES[k].type];
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                      <S.icon size={11} color={S.color} /> {ENTITIES[k].name}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* REPORT GENERATION                                                      */
/* ---------------------------------------------------------------------- */
function ReportsView({ leads, resolutions }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [note, setNote] = useState("");

  function generate() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 900);
  }

  const sections = [
    { title: "Case information", tag: "OBSERVED", body: "CASE-2026-001 · Active · Opened 05 Aug 2026 · Assigned investigator: R. Basu" },
    { title: "Evidence inventory", tag: "OBSERVED", body: "248 evidence items across CDR, transaction, vehicle, and location records (synthetic demonstration set)." },
    { title: "Extracted entities", tag: "AI", body: `${Object.keys(ENTITIES).length} entities extracted for this view: 5 persons, 3 phones, 2 vehicles, 2 locations, 1 organization.` },
    { title: "Entity relationships", tag: "AI", body: `${RELATIONSHIPS.length} relationships discovered, each backed by a source evidence record.` },
    { title: "Network analysis", tag: "AI", body: "Meera Sen identified as the highest-betweenness entity, bridging two otherwise separate clusters." },
    { title: "Timeline", tag: "AI", body: `${TIMELINE.length} events reconstructed chronologically from 05 Aug to 20 Aug 2026.` },
    { title: "Communication analysis", tag: "AI", body: "Three active communication pairs identified; CDR-1223 shows an increasing trend." },
    { title: "Financial analysis", tag: "AI", body: "Repeated transfers between Meera Sen and Devraj Sharma flagged as an unusual transaction pattern." },
    { title: "AI investigation leads", tag: "AI", body: `${leads.length} leads generated, ${leads.filter((l) => l.status === "review").length} currently pending review.` },
    { title: "Entity resolution", tag: "AI", body: `${resolutions.length} potential duplicate matches identified, ${resolutions.filter((m) => m.status === "merged").length} confirmed.` },
    { title: "Investigator observations", tag: "REVIEW", body: null },
  ];

  const tagMeta = {
    OBSERVED: { label: "Observed evidence", color: T.textDim, dim: T.panelAlt },
    AI: { label: "AI analysis", color: T.flag, dim: T.flagDim },
    REVIEW: { label: "Investigator review", color: T.signal, dim: T.signalDim },
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4, gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Investigation report</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>CASE-2026-001 · Sections clearly separate observed evidence, AI analysis, and investigator review</div>
        </div>
        <button onClick={generate} disabled={generating} style={{
          display: "flex", alignItems: "center", gap: 7, background: T.signalDim, border: `1px solid ${T.signal}55`,
          color: T.signal, borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600, flexShrink: 0,
        }}>
          {generating ? <Loader2 size={14} className="spin" /> : <ClipboardList size={14} />}
          {generating ? "Generating…" : generated ? "Regenerate report" : "Generate report"}
        </button>
      </div>

      {!generated && !generating && (
        <div style={{ marginTop: 20, padding: 24, textAlign: "center", color: T.textFaint, fontSize: 13, border: `1px dashed ${T.border}`, borderRadius: 10 }}>
          No report generated yet for this session. Click "Generate report" to compile the current case data.
        </div>
      )}

      {generated && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
          {sections.map((s) => {
            const meta = tagMeta[s.tag];
            return (
              <div key={s.title} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 15 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{s.title}</span>
                  <Badge color={meta.color} dim={meta.dim}>{meta.label}</Badge>
                </div>
                {s.body && <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.6 }}>{s.body}</div>}
                {s.title === "Investigator observations" && (
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add investigator notes for this report…"
                    rows={3}
                    style={{
                      width: "100%", background: T.panelAlt, border: `1px solid ${T.borderSoft}`, borderRadius: 6,
                      padding: 10, color: T.text, fontSize: 12.5, outline: "none", resize: "vertical", fontFamily: "inherit",
                    }}
                  />
                )}
              </div>
            );
          })}
          <button disabled style={{
            marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            background: "none", border: `1px solid ${T.border}`, color: T.textFaint, borderRadius: 7,
            padding: "9px 14px", fontSize: 12.5, cursor: "not-allowed",
          }}>
            <Download size={13} /> Export as PDF (requires backend document service)
          </button>
        </div>
      )}
    </div>
  );
}
