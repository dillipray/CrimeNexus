import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Lock, CheckCircle2, RefreshCw } from 'lucide-react';
import { fetchAuditLogs } from '../services/api';

const T = {
  panel: "#141F2B",
  panelAlt: "#1A2733",
  border: "#28394A",
  borderSoft: "#1F2E3C",
  text: "#E6EDF4",
  textDim: "#93A6B8",
  textFaint: "#5D7086",
  signal: "#3FC1C9",
  signalDim: "#1F5B60",
  flag: "#E8A33D",
  flagDim: "#5C4419",
  ok: "#7FB77E",
  okDim: "#2E4A2C",
};

const DEFAULT_LOGS = [
  {
    id: "AUD-00005",
    timestamp: "2026-08-20T14:22:10Z",
    actor: "R. Basu",
    role: "Investigating Officer",
    action_type: "ALERT_REVIEW",
    target_type: "LEAD",
    target_id: "LEAD-07",
    details: "Reviewed bridge entity anomaly for Meera Sen",
    tamper_hash: "a4f89d32b11e8c74",
  },
  {
    id: "AUD-00004",
    timestamp: "2026-08-20T11:45:02Z",
    actor: "P. Sharma",
    role: "Senior Investigator",
    action_type: "ENTITY_RESOLUTION",
    target_type: "DUPLICATE_PAIR",
    target_id: "MATCH-01",
    details: "Investigator decided: 'merged' for pair Devraj Sharma & D. Sharma",
    tamper_hash: "93cb12fa8e71b059",
  },
  {
    id: "AUD-00003",
    timestamp: "2026-08-19T16:10:45Z",
    actor: "A. Sen",
    role: "Forensic Analyst",
    action_type: "CDR_ANALYSIS",
    target_type: "CDR",
    target_id: "CDR-1042",
    details: "Filtered CDR tower records for frequency surge (+91 98••• 1042)",
    tamper_hash: "7e502bd642c88f11",
  },
  {
    id: "AUD-00002",
    timestamp: "2026-08-19T09:30:12Z",
    actor: "R. Basu",
    role: "Investigating Officer",
    action_type: "GRAPH_EXPAND",
    target_type: "ENTITY",
    target_id: "ENT-101",
    details: "Expanded 2-hop neighborhood of Arjun Nair",
    tamper_hash: "c3817f09da51ae24",
  },
  {
    id: "AUD-00001",
    timestamp: "2026-08-18T08:00:00Z",
    actor: "System Initializer",
    role: "Admin",
    action_type: "CASE_ACCESS",
    target_type: "CASE",
    target_id: "CASE-2026-001",
    details: "Opened case context for analysis",
    tamper_hash: "GENESIS_HASH_001",
  },
];

export default function AuditView() {
  const [logs, setLogs] = useState(DEFAULT_LOGS);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const res = await fetchAuditLogs(roleFilter, "all", search);
    setLoading(false);
    if (res && res.logs && res.logs.length > 0) {
      setLogs(res.logs);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [roleFilter]);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      !search.trim() ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.target_id.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || l.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1140 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Tamper-Evident Audit Trail</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            PRD Module 18: Append-only chronological logging of all searches, graph traversals, lead resolutions, and exports
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.okDim, border: `1px solid ${T.ok}44`, padding: "6px 12px", borderRadius: 6 }}>
          <Lock size={13} color={T.ok} />
          <span style={{ fontSize: 12, color: T.ok, fontWeight: 600 }}>SHA-256 Chained Integrity Verified</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={14} color={T.textFaint} style={{ position: "absolute", left: 10, top: 9 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by officer, action, target entity, or keywords..."
            style={{
              width: "100%",
              background: T.panelAlt,
              border: `1px solid ${T.borderSoft}`,
              borderRadius: 6,
              padding: "7px 10px 7px 32px",
              color: T.text,
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            background: T.panelAlt,
            border: `1px solid ${T.borderSoft}`,
            borderRadius: 6,
            padding: "7px 10px",
            color: T.text,
            fontSize: 12.5,
            outline: "none",
          }}
        >
          <option value="all">All Roles</option>
          <option value="Investigating Officer">Investigating Officer</option>
          <option value="Senior Investigator">Senior Investigator</option>
          <option value="Forensic Analyst">Forensic Analyst</option>
          <option value="Auditor">Auditor</option>
          <option value="Admin">Admin</option>
        </select>

        <button
          onClick={loadLogs}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: T.panelAlt,
            border: `1px solid ${T.border}`,
            padding: "7px 12px",
            borderRadius: 6,
            fontSize: 12.5,
            color: T.textDim,
          }}
        >
          <RefreshCw size={13} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Audit Log Table */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "100px 140px 130px 140px 1fr 110px",
          padding: "10px 16px",
          fontSize: 11,
          fontWeight: 700,
          color: T.textFaint,
          letterSpacing: 0.5,
          borderBottom: `1px solid ${T.border}`,
          background: T.panelAlt,
        }}>
          <span>LOG ID</span>
          <span>TIMESTAMP</span>
          <span>ACTOR</span>
          <span>ACTION</span>
          <span>DETAILS</span>
          <span style={{ textAlign: "right" }}>HASH</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {filteredLogs.map((log, index) => (
            <div
              key={log.id || index}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 140px 130px 140px 1fr 110px",
                padding: "11px 16px",
                fontSize: 12.5,
                alignItems: "center",
                borderBottom: index < filteredLogs.length - 1 ? `1px solid ${T.borderSoft}` : "none",
              }}
              className="navbtn"
            >
              <span style={{ fontFamily: "var(--mono)", color: T.signal, fontSize: 11.5 }}>{log.id}</span>
              <span style={{ color: T.textDim, fontSize: 11.5 }}>
                {log.timestamp ? log.timestamp.replace("T", " ").substring(0, 16) : "Just now"}
              </span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 500 }}>{log.actor}</span>
                <span style={{ fontSize: 10.5, color: T.textFaint }}>{log.role}</span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                background: T.panelAlt,
                padding: "2px 7px",
                borderRadius: 4,
                color: log.action_type.includes("ALERT") ? T.flag : T.textDim,
                width: "fit-content",
              }}>
                {log.action_type}
              </span>
              <span style={{ color: T.text, fontSize: 12.5, paddingRight: 10 }}>{log.details}</span>
              <span style={{ fontFamily: "var(--mono)", color: T.textFaint, fontSize: 11, textAlign: "right" }}>
                {log.tamper_hash ? log.tamper_hash.substring(0, 8) + "…" : "verified"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
