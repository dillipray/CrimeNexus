import React, { useState } from 'react';
import {
  Fingerprint,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  GitMerge,
  ArrowRightLeft,
  ShieldCheck,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { T } from '../data/mockData';
import { resolveDuplicate } from '../services/api';

export default function ResolutionView({ matches, setMatchStatus, onSelectEntity, currentRole }) {
  const [expandedMatch, setExpandedMatch] = useState("MATCH-01");
  const [justificationInput, setJustificationInput] = useState({});

  const handleDecision = async (matchId, decision) => {
    const just = justificationInput[matchId] || "Investigator manual attribute confirmation";

    // Trigger visual confetti on merge
    if (decision === "merged") {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#3FC1C9', '#7FB77E', '#B98CCE'],
        });
      } catch (e) {}
    }

    // Update local state
    setMatchStatus(matchId, decision);

    // Call API
    await resolveDuplicate(matchId, decision, just, currentRole.user, currentRole.name);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 940 }}>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>
          Entity Resolution & De-Duplication Queue
        </div>
        <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
          Human-in-the-loop review. Entities are never merged automatically. All merge decisions are reversible and cryptographically logged.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {matches.map((m) => {
          const isExpanded = expandedMatch === m.id;
          const isPending = m.status === "pending";

          return (
            <div
              key={m.id}
              style={{
                background: T.panel,
                border: `1px solid ${isPending ? T.border : m.status === "merged" ? T.ok + "66" : T.borderSoft}`,
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: T.textFaint }}>{m.id}</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: isPending ? T.flagDim : m.status === "merged" ? T.okDim : T.panelAlt,
                      color: isPending ? T.flag : m.status === "merged" ? T.ok : T.textFaint,
                      textTransform: "uppercase",
                    }}>
                      {m.status}
                    </span>
                    <span style={{ fontSize: 12, fontFamily: "var(--mono)", color: T.ok }}>
                      {m.confidence}% Match Confidence
                    </span>
                  </div>

                  {/* Candidate Pair Display */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 600, marginTop: 6 }}>
                    <span style={{ color: T.text }}>{m.a}</span>
                    <ArrowRightLeft size={14} color={T.signal} />
                    <span style={{ color: T.signal }}>{m.b}</span>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedMatch(isExpanded ? null : m.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    color: T.signal,
                    background: T.panelAlt,
                    padding: "5px 10px",
                    borderRadius: 6,
                    border: `1px solid ${T.borderSoft}`,
                  }}
                >
                  {isExpanded ? "Hide Comparison" : "Compare Attributes"}
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
              </div>

              {/* Matched Reasons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: T.textFaint, fontWeight: 600 }}>MATCH CRITERIA:</span>
                {m.reasons.map((r, ri) => (
                  <span
                    key={ri}
                    style={{
                      fontSize: 11,
                      color: T.textDim,
                      background: T.panelAlt,
                      padding: "2px 7px",
                      borderRadius: 4,
                      border: `1px solid ${T.borderSoft}`,
                    }}
                  >
                    {r}
                  </span>
                ))}
              </div>

              {/* Side-by-Side Comparison Container */}
              {isExpanded && (
                <div style={{ marginTop: 14, background: T.panelAlt, border: `1px solid ${T.borderSoft}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8, borderBottom: `1px solid ${T.border}`, paddingBottom: 4 }}>
                        ENTITY A: {m.a.toUpperCase()}
                      </div>
                      {Object.entries(m.aAttrs).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                          <span style={{ color: T.textFaint }}>{k}</span>
                          <span style={{ color: T.text, fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.signal, marginBottom: 8, borderBottom: `1px solid ${T.border}`, paddingBottom: 4 }}>
                        ENTITY B: {m.b.toUpperCase()}
                      </div>
                      {Object.entries(m.bAttrs).map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0" }}>
                          <span style={{ color: T.textFaint }}>{k}</span>
                          <span style={{ color: T.signal, fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons for Pending Matches */}
              {isPending && (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
                  <input
                    value={justificationInput[m.id] || ""}
                    onChange={(e) => setJustificationInput({ ...justificationInput, [m.id]: e.target.value })}
                    placeholder="Enter reason for merge / rejection decision..."
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
                    onClick={() => handleDecision(m.id, "merged")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: T.okDim,
                      color: T.ok,
                      border: `1px solid ${T.ok}55`,
                      padding: "7px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <GitMerge size={13} /> Confirm Merge
                  </button>
                  <button
                    onClick={() => handleDecision(m.id, "rejected")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: T.panelAlt,
                      color: T.textDim,
                      border: `1px solid ${T.border}`,
                      padding: "7px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                  >
                    <XCircle size={13} /> Not a Match (Reject)
                  </button>
                </div>
              )}

              {!isPending && (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${T.borderSoft}`, paddingTop: 12 }}>
                  <span style={{ fontSize: 12, color: T.textFaint }}>
                    Decision: <strong style={{ color: m.status === 'merged' ? T.ok : T.flag, textTransform: 'uppercase' }}>{m.status}</strong> by {currentRole?.user || "Investigator"}
                  </span>
                  <button
                    onClick={() => handleDecision(m.id, "pending")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: T.panelAlt,
                      color: T.signal,
                      border: `1px solid ${T.border}`,
                      padding: "5px 12px",
                      borderRadius: 6,
                      fontSize: 11.5,
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={12} /> Revert Decision (Re-open)
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
