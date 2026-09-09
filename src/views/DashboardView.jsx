import React, { useMemo } from 'react';
import {
  FileText,
  Users,
  Network,
  Lightbulb,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  GitMerge,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { T } from '../data/mockData';
import { getCaseStats, getLeadsForCase, getDuplicateForCase } from '../data/graphFromDataset';

export default function DashboardView({
  leads,
  onOpenLead,
  onSelectEntity,
  showDup,
  setShowDup,
  pendingMatches,
  onOpenResolution,
  activeCase,
  currentRole,
}) {
  const stats = useMemo(() => getCaseStats(activeCase), [activeCase]);
  const caseLeads = useMemo(() => getLeadsForCase(activeCase, leads), [activeCase, leads]);
  const reviewLeads = caseLeads.filter((l) => l.status === "review");
  const caseDup = useMemo(() => getDuplicateForCase(activeCase), [activeCase]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1180 }}>
      {/* Case Header Banner */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 600 }}>
            Investigation Command Center
          </div>
          <div style={{ color: T.textDim, fontSize: 13, marginTop: 3 }}>
            Active Case: <strong style={{ color: T.signal }}>{activeCase}</strong> · Operational Role: <strong style={{ color: currentRole.color }}>{currentRole.name}</strong> ({currentRole.user})
          </div>
        </div>
        <div style={{
          fontSize: 11,
          color: T.textFaint,
          background: T.panel,
          border: `1px solid ${T.border}`,
          padding: "6px 12px",
          borderRadius: 6,
          fontFamily: "var(--mono)",
        }}>
          CONFIDENTIAL LAW ENFORCEMENT INTELLIGENCE
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
        <KpiCard
          label="Evidence Items"
          value={stats.evidenceItems.toLocaleString()}
          sub={`${stats.cdrCount} CDR · ${stats.txnCount} Txn`}
          icon={FileText}
        />
        <KpiCard
          label="Entities"
          value={stats.entities.toLocaleString()}
          sub={`${stats.personsCount} Pers · ${stats.phonesCount} Ph · ${stats.accountsCount} Acc`}
          icon={Users}
        />
        <KpiCard
          label="Relationships"
          value={stats.relationships.toLocaleString()}
          sub="Direct Case Edges"
          icon={Network}
        />
        <KpiCard
          label="AI Leads"
          value={caseLeads.length}
          sub={`${reviewLeads.length} triage pending`}
          icon={Lightbulb}
          accent={T.flag}
        />
        <KpiCard
          label="Pending Reviews"
          value={reviewLeads.length}
          sub="Human-in-the-loop"
          icon={AlertTriangle}
          accent={T.flag}
        />
        <KpiCard
          label="Active Cases"
          value={stats.activeCases.toLocaleString()}
          sub="Jurisdictions active"
          icon={ShieldCheck}
          accent={T.signal}
        />
      </div>

      {/* Main Grid: Leads Preview + Duplicate Resolution Alert */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {/* Leads awaiting review */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 0.6 }}>
              AI Findings Awaiting Human Triage
            </span>
            <button
              onClick={onOpenLead}
              style={{ background: "none", border: "none", color: T.signal, fontSize: 12, display: "flex", alignItems: "center", gap: 3, cursor: "pointer" }}
            >
              View all ({reviewLeads.length}) <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reviewLeads.slice(0, 3).map((l) => (
              <div
                key={l.id}
                onClick={onOpenLead}
                className="navbtn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  background: T.panelAlt,
                  borderRadius: 8,
                  border: `1px solid ${T.borderSoft}`,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{l.title}</span>
                  <span style={{ fontSize: 11.5, color: T.textFaint }}>{l.entity}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: T.flagDim,
                    color: T.flag,
                    fontFamily: "var(--mono)",
                  }}>
                    {l.confidence}% Conf.
                  </span>
                  <ChevronRight size={14} color={T.textFaint} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duplicate Resolution Banner & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {showDup && pendingMatches > 0 && (
            <div style={{
              background: T.panel,
              border: `1px solid ${T.flag}66`,
              borderRadius: 10,
              padding: 16,
              boxShadow: `0 4px 18px ${T.flag}15`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: T.flag }}>
                <GitMerge size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Duplicate Entities Flagged ({pendingMatches})</span>
              </div>
              <p style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5, marginBottom: 12 }}>
                High similarity detected between <strong>{caseDup.a}</strong> and <strong>{caseDup.b}</strong> ({caseDup.confidence}% match confidence on {caseDup.detail}).
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={onOpenResolution}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 12px",
                    borderRadius: 6,
                    background: T.signalDim,
                    color: T.signal,
                    border: `1px solid ${T.signal}55`,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Inspect Candidate Match <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => setShowDup(false)}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 6,
                    background: "transparent",
                    color: T.textFaint,
                    fontSize: 12,
                  }}
                >
                  Dismiss Banner
                </button>
              </div>
            </div>
          )}

          {/* Quick System Status Card */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 0.6 }}>
              Responsible AI Guardrail Checklist
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10, fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.ok }}>
                <span>✓</span> <span>Neutral nomenclature active (no automated guilt labels)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.ok }}>
                <span>✓</span> <span>Human-in-the-loop required for entity merges</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.ok }}>
                <span>✓</span> <span>Append-only SHA-256 audit logging enabled</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, color: T.ok }}>
                <span>✓</span> <span>Legal advisory disclaimers attached to all exports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent, sub }) {
  return (
    <div
      style={{
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: T.textDim, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
          {label}
        </span>
        <Icon size={15} color={accent || T.textFaint} />
      </div>
      <span style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 600, color: T.text }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: 11, color: T.textFaint, marginTop: -2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sub}
        </span>
      )}
    </div>
  );
}
