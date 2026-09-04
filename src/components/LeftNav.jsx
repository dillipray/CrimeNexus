import React from 'react';
import {
  LayoutDashboard,
  Network,
  Clock,
  Lightbulb,
  MessageSquare,
  Wallet,
  MapPin,
  Search,
  Fingerprint,
  Activity,
  UploadCloud,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { T } from '../data/mockData';

export const NAV_GROUPS = [
  {
    label: "Investigate",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "graph", label: "Network Graph", icon: Network },
      { id: "timeline", label: "Timeline", icon: Clock },
      { id: "leads", label: "AI Leads", icon: Lightbulb },
      { id: "comms", label: "Communication", icon: MessageSquare },
      { id: "financial", label: "Financial Flow", icon: Wallet },
      { id: "map", label: "Geospatial Map", icon: MapPin },
    ],
  },
  {
    label: "Tools & Governance",
    items: [
      { id: "search", label: "Global Search", icon: Search },
      { id: "resolution", label: "Entity Resolution", icon: Fingerprint },
      { id: "analytics", label: "Network Analytics", icon: Activity },
      { id: "ingestion", label: "Document Ingestion", icon: UploadCloud },
      { id: "reports", label: "Reports & PDF Export", icon: ClipboardList },
      { id: "audit", label: "Audit Trail", icon: ShieldCheck },
    ],
  },
];

export default function LeftNav({ currentTab, setTab, pendingLeadsCount, pendingMatchesCount }) {
  return (
    <div
      style={{
        width: 210,
        borderRight: `1px solid ${T.border}`,
        background: T.panel,
        display: "flex",
        flexDirection: "column",
        padding: "14px 8px",
        flexShrink: 0,
        gap: 2,
      }}
    >
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} style={{ marginTop: gi === 0 ? 0 : 12 }}>
          <div
            style={{
              padding: "4px 12px 6px",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: T.textFaint,
            }}
          >
            {group.label}
          </div>
          {group.items.map((n) => {
            const active = currentTab === n.id;
            return (
              <button
                key={n.id}
                onClick={() => setTab(n.id)}
                className="navbtn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: active ? T.panelAlt : "transparent",
                  color: active ? T.text : T.textDim,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  textAlign: "left",
                  borderLeft: active ? `2px solid ${T.signal}` : "2px solid transparent",
                  width: "100%",
                }}
              >
                <n.icon size={15} color={active ? T.signal : T.textFaint} />
                <span>{n.label}</span>
                {n.id === "leads" && pendingLeadsCount > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10.5,
                      background: T.flagDim,
                      color: T.flag,
                      borderRadius: 8,
                      padding: "1px 6px",
                      fontWeight: 700,
                    }}
                  >
                    {pendingLeadsCount}
                  </span>
                )}
                {n.id === "resolution" && pendingMatchesCount > 0 && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10.5,
                      background: T.flagDim,
                      color: T.flag,
                      borderRadius: 8,
                      padding: "1px 6px",
                      fontWeight: 700,
                    }}
                  >
                    {pendingMatchesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}

      <div
        style={{
          marginTop: "auto",
          padding: "10px 12px",
          fontSize: 11,
          color: T.textFaint,
          lineHeight: 1.5,
          borderTop: `1px solid ${T.borderSoft}`,
        }}
      >
        Decision-support system for authorized human review. All findings require human validation.
      </div>
    </div>
  );
}
