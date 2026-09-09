import React, { useState } from 'react';
import { GitBranch, FileText, Search, ShieldCheck, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import { T, ENTITY_STYLE } from '../data/mockData';

export const ROLES = [
  { id: "investigating_officer", name: "Investigating Officer", user: "R. Basu", color: T.signal },
  { id: "senior_investigator", name: "Senior Investigator", user: "P. Sharma", color: T.ok },
  { id: "intelligence_analyst", name: "Intelligence Analyst", user: "M. Chakraborty", color: "#5B8DEF" },
  { id: "forensic_analyst", name: "Forensic Analyst", user: "A. Sen", color: T.violet },
  { id: "auditor", name: "Auditor", user: "K. Varma", color: T.flag },
  { id: "admin", name: "System Admin", user: "Admin", color: T.textDim },
];

export const CASES = [
  { id: "CASE-2026-001", label: "CASE-2026-001 (Nagpur - Commercial Fraud)", district: "Nagpur" },
  { id: "FIR_0001", label: "FIR_0001 (Nagpur Hub Syndicate)", district: "Nagpur" },
  { id: "FIR_0002", label: "FIR_0002 (Nagpur Service Group)", district: "Nagpur" },
  { id: "FIR_0007", label: "FIR_0007 (Nagpur Extortion Network)", district: "Nagpur" },
];

export default function TopBar({
  activeCase,
  setActiveCase,
  currentRole,
  setCurrentRole,
  search,
  setSearch,
  searchResults,
  onSelectEntity,
  onSearchEnter,
  backendConnected,
  casesList = CASES,
  dbStatus = { postgres: 'offline', neo4j: 'offline' },
}) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);

  return (
    <div
      style={{
        height: 56,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 18,
        background: T.panel,
        flexShrink: 0,
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: T.signalDim,
            border: `1px solid ${T.signal}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <GitBranch size={15} color={T.signal} />
        </div>
        <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 15, letterSpacing: 0.4 }}>
          NEXUS INTEL
        </span>
      </div>

      {/* Case Selector Dropdown */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setCaseMenuOpen(!caseMenuOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 11px",
            background: T.panelAlt,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          <FileText size={13} color={T.textFaint} />
          <span style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{activeCase}</span>
          <span style={{ fontSize: 10.5, color: T.ok, background: T.okDim, padding: "1px 6px", borderRadius: 3, fontWeight: 600 }}>
            ACTIVE
          </span>
          <ChevronDown size={13} color={T.textDim} />
        </button>

        {caseMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: 38,
              left: 0,
              width: 320,
              maxHeight: 320,
              overflowY: "auto",
              background: T.raised,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}`, textTransform: "uppercase" }}>
              Select Investigation Case ({casesList.length})
            </div>
            {casesList.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveCase(c.id);
                  setCaseMenuOpen(false);
                }}
                className="navbtn"
                style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                  color: activeCase === c.id ? T.signal : T.text,
                  borderBottom: `1px solid ${T.borderSoft}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{c.label || c.id}</span>
                {activeCase === c.id && <span style={{ fontSize: 10, color: T.signal, fontWeight: 700 }}>ACTIVE</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backend & Dual Database Status Indicator Pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Backend API Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 20,
            background: backendConnected ? T.okDim : T.panelAlt,
            border: `1px solid ${backendConnected ? T.ok + "44" : T.border}`,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: 0.3,
            color: backendConnected ? T.ok : T.textDim,
          }}
          title={backendConnected ? "Connected to live FastAPI engine" : "Operating in standalone client-side mock mode"}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: backendConnected ? T.ok : T.flag,
            }}
          />
          {backendConnected ? "FASTAPI" : "CLIENT"}
        </div>

        {/* PostgreSQL Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 20,
            background: dbStatus?.postgres === "connected" ? T.okDim : T.panelAlt,
            border: `1px solid ${dbStatus?.postgres === "connected" ? T.ok + "44" : T.border}`,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: 0.3,
            color: dbStatus?.postgres === "connected" ? T.ok : T.textFaint,
          }}
          title={dbStatus?.postgres === "connected" ? "PostgreSQL Relational DB: Connected" : "PostgreSQL: Offline (using Section 15.1 Synthetic Dataset)"}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: dbStatus?.postgres === "connected" ? T.ok : T.textFaint,
            }}
          />
          POSTGRES
        </div>

        {/* Neo4j Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 20,
            background: dbStatus?.neo4j === "connected" ? T.okDim : T.panelAlt,
            border: `1px solid ${dbStatus?.neo4j === "connected" ? T.ok + "44" : T.border}`,
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: 0.3,
            color: dbStatus?.neo4j === "connected" ? T.ok : T.textFaint,
          }}
          title={dbStatus?.neo4j === "connected" ? "Neo4j Graph Database: Connected" : "Neo4j: Offline (using NetworkX Graph Analytics)"}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: dbStatus?.neo4j === "connected" ? T.ok : T.textFaint,
            }}
          />
          NEO4J
        </div>
      </div>

      {/* Global Search */}
      <div style={{ position: "relative", flex: 1, maxWidth: 420 }}>
        <Search size={14} color={T.textFaint} style={{ position: "absolute", left: 10, top: 9 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && search.trim()) {
              onSearchEnter(search);
              setSearch("");
            }
          }}
          placeholder="Search entities, CDRs, vehicles, accounts... (Enter for deep search)"
          style={{
            width: "100%",
            background: T.panelAlt,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: "7px 10px 7px 32px",
            color: T.text,
            fontSize: 13,
            outline: "none",
          }}
        />

        {searchResults && searchResults.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: 36,
              left: 0,
              right: 0,
              background: T.raised,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              overflow: "hidden",
              zIndex: 60,
              boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
            }}
          >
            {searchResults.map(([key, e]) => {
              const S = ENTITY_STYLE[e.type] || ENTITY_STYLE.PERSON;
              return (
                <div
                  key={key}
                  onClick={() => {
                    onSelectEntity(key);
                    setSearch("");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderBottom: `1px solid ${T.borderSoft}`, cursor: "pointer" }}
                  className="navbtn"
                >
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

      {/* RBAC Role Switcher */}
      <div style={{ position: "relative", marginLeft: "auto" }}>
        <button
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 10px",
            borderRadius: 6,
            background: T.panelAlt,
            border: `1px solid ${currentRole.color}44`,
            cursor: "pointer",
          }}
        >
          <ShieldCheck size={14} color={currentRole.color} />
          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{currentRole.name}</span>
            <span style={{ fontSize: 10.5, color: T.textFaint }}>{currentRole.user}</span>
          </div>
          <ChevronDown size={13} color={T.textDim} />
        </button>

        {roleMenuOpen && (
          <div
            style={{
              position: "absolute",
              top: 42,
              right: 0,
              width: 240,
              background: T.raised,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: T.textFaint, borderBottom: `1px solid ${T.borderSoft}`, textTransform: "uppercase" }}>
              Switch Operational Role
            </div>
            {ROLES.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  setCurrentRole(r);
                  setRoleMenuOpen(false);
                }}
                className="navbtn"
                style={{
                  padding: "9px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  borderBottom: `1px solid ${T.borderSoft}`,
                }}
              >
                <div>
                  <div style={{ fontSize: 12.5, color: currentRole.id === r.id ? r.color : T.text, fontWeight: currentRole.id === r.id ? 600 : 400 }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.textFaint }}>User: {r.user}</div>
                </div>
                {currentRole.id === r.id && <CheckCircle2 size={13} color={r.color} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
