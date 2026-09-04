import React, { useState } from 'react';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Info,
  ArrowRight,
  Eye,
  StickyNote,
} from 'lucide-react';
import { T } from '../data/mockData';
import { updateAlertStatus } from '../services/api';

export default function LeadsView({
  leads,
  setLeads,
  expandedTrace,
  setExpandedTrace,
  onSelectEntity,
  currentRole,
}) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [noteInputs, setNoteInputs] = useState({});

  const filtered = leads.filter(
    (l) => filterStatus === "all" || l.status === filterStatus
  );

  const handleStatusChange = async (leadId, newStatus) => {
    const note = noteInputs[leadId] || "";
    // Update local state
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus, investigator_notes: note } : l))
    );
    // Sync with backend API
    await updateAlertStatus(leadId, newStatus, note, currentRole.user, currentRole.name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 940 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>AI Investigation Leads & Pattern Alerts</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            Algorithmic anomaly detections requiring authorized investigator triage. Every finding provides an explainability trace.
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "review", "resolved", "dismissed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              style={{
                padding: "5px 11px",
                borderRadius: 6,
                fontSize: 12,
                textTransform: "capitalize",
                fontWeight: 600,
                background: filterStatus === st ? T.panelAlt : "transparent",
                color: filterStatus === st ? T.signal : T.textDim,
                border: `1px solid ${filterStatus === st ? T.signal : T.border}`,
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map((l) => {
          const isExpanded = expandedTrace === l.id;
          const isPending = l.status === "review";

          return (
            <div
              key={l.id}
              style={{
                background: T.panel,
                border: `1px solid ${isPending ? T.flag + "55" : T.border}`,
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: T.flag, fontWeight: 700 }}>
                      {l.id}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: isPending ? T.flagDim : T.okDim,
                        color: isPending ? T.flag : T.ok,
                        textTransform: "uppercase",
                      }}
                    >
                      {l.status}
                    </span>
                    <span style={{ fontSize: 11.5, color: T.textFaint, fontFamily: "var(--mono)" }}>
                      {l.confidence}% Confidence
                    </span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{l.title}</div>
                  <div style={{ fontSize: 13, color: T.signal, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                    Entity: <strong>{l.entity}</strong>
                    <button
                      onClick={() => onSelectEntity("P1")}
                      style={{ color: T.signal, fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 2 }}
                    >
                      <Eye size={12} /> View on Graph
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: T.textDim, lineHeight: 1.5, marginTop: 10 }}>
                {l.text}
              </div>

              {/* Evidence IDs */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: T.textFaint, fontWeight: 600 }}>EVIDENCE RECORDS:</span>
                {l.evidence.map((ev, ei) => (
                  <span
                    key={ei}
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: T.signal,
                      background: T.signalDim,
                      border: `1px solid ${T.signal}33`,
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    {ev}
                  </span>
                ))}
              </div>

              {/* Expandable Reasoning Trace Button */}
              <div style={{ marginTop: 12 }}>
                <button
                  onClick={() => setExpandedTrace(isExpanded ? null : l.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: T.signal,
                    background: T.panelAlt,
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: `1px solid ${T.borderSoft}`,
                  }}
                >
                  <Info size={13} />
                  {isExpanded ? "Hide reasoning trace" : "Why am I seeing this? (Explainability trace)"}
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 8,
                      background: T.panelAlt,
                      border: `1px solid ${T.borderSoft}`,
                      borderRadius: 8,
                      padding: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase" }}>
                      Algorithmic Detection Steps
                    </div>
                    {l.trace.map((step, si) => (
                      <div key={si} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: T.text }}>
                        <span style={{ color: T.signal, fontWeight: 700, fontFamily: "var(--mono)" }}>{si + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Leads */}
              {isPending && (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
                  <input
                    value={noteInputs[l.id] || ""}
                    onChange={(e) => setNoteInputs({ ...noteInputs, [l.id]: e.target.value })}
                    placeholder="Enter investigator triage justification note..."
                    style={{
                      flex: 1,
                      minWidth: 260,
                      background: T.panelAlt,
                      border: `1px solid ${T.borderSoft}`,
                      borderRadius: 6,
                      padding: "6px 10px",
                      fontSize: 12,
                      color: T.text,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => handleStatusChange(l.id, "resolved")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: T.okDim,
                      color: T.ok,
                      border: `1px solid ${T.ok}55`,
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={13} /> Confirm Lead
                  </button>
                  <button
                    onClick={() => handleStatusChange(l.id, "dismissed")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: T.panelAlt,
                      color: T.textDim,
                      border: `1px solid ${T.border}`,
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <XCircle size={13} /> False Positive / Dismiss
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
