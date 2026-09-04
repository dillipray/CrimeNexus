import React, { useState } from 'react';
import {
  T,
  ENTITY_STYLE,
  REL_STYLE,
  ENTITIES,
  RELATIONSHIPS,
} from '../data/mockData';
import {
  X,
  Eye,
  FileText,
  Phone,
  Car,
  MapPin,
  Building2,
  Users,
  GitBranch,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function GraphView({
  selectedNode,
  setSelectedNode,
  selectedEdge,
  setSelectedEdge,
  relFilter,
  setRelFilter,
  onSelectEntity,
}) {
  const [zoom, setZoom] = useState(1);

  const visibleRels = RELATIONSHIPS.filter(
    (r) => relFilter === "all" || r.type === relFilter
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, height: "calc(100vh - 120px)" }}>
      {/* Top Filter Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Interactive Network Graph</div>
          <div style={{ fontSize: 12, color: T.textDim }}>
            Visualizing multi-hop entity relationships and evidence links. Click any node or link to inspect details.
          </div>
        </div>

        {/* Relationship Filter Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setRelFilter("all")}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11.5,
              fontWeight: 600,
              background: relFilter === "all" ? T.panelAlt : "transparent",
              color: relFilter === "all" ? T.signal : T.textDim,
              border: `1px solid ${relFilter === "all" ? T.signal : T.border}`,
            }}
          >
            All Links ({RELATIONSHIPS.length})
          </button>
          {Object.entries(REL_STYLE).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => setRelFilter(type)}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 500,
                background: relFilter === type ? T.panelAlt : "transparent",
                color: relFilter === type ? meta.color : T.textFaint,
                border: `1px solid ${relFilter === type ? meta.color : T.borderSoft}`,
              }}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas + Inspector Drawer */}
      <div style={{ display: "flex", flex: 1, position: "relative", background: "#090E14", border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
        {/* SVG Network Graph */}
        <svg
          style={{ width: "100%", height: "100%", cursor: "grab" }}
          viewBox="0 0 920 540"
          onClick={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={T.signal} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Render Relationships / Edges */}
          {visibleRels.map((r) => {
            const nodeA = ENTITIES[r.a];
            const nodeB = ENTITIES[r.b];
            if (!nodeA || !nodeB) return null;
            const isSelected = selectedEdge === r.id;
            const style = REL_STYLE[r.type] || { color: T.textFaint };

            return (
              <g key={r.id} onClick={(e) => { e.stopPropagation(); setSelectedEdge(r.id); setSelectedNode(null); }} style={{ cursor: "pointer" }}>
                <line
                  x1={nodeA.x}
                  y1={nodeA.y}
                  x2={nodeB.x}
                  y2={nodeB.y}
                  stroke={style.color}
                  strokeWidth={isSelected ? 3.5 : 1.8}
                  strokeOpacity={isSelected ? 1 : 0.65}
                  strokeDasharray={r.type === "communication" ? "none" : r.type === "financial" ? "4,3" : "none"}
                />
                {/* Midpoint badge */}
                <circle
                  cx={(nodeA.x + nodeB.x) / 2}
                  cy={(nodeA.y + nodeB.y) / 2}
                  r={6}
                  fill={T.panel}
                  stroke={style.color}
                  strokeWidth={1.5}
                />
              </g>
            );
          })}

          {/* Render Entities / Nodes */}
          {Object.entries(ENTITIES).map(([key, e]) => {
            const isSelected = selectedNode === key;
            const S = ENTITY_STYLE[e.type] || ENTITY_STYLE.PERSON;
            return (
              <g
                key={key}
                transform={`translate(${e.x}, ${e.y})`}
                onClick={(e_evt) => {
                  e_evt.stopPropagation();
                  setSelectedNode(key);
                  setSelectedEdge(null);
                }}
                className="node"
              >
                {/* Glow ring on selection */}
                <circle
                  className="ring"
                  r={isSelected ? 26 : 22}
                  fill={T.panel}
                  stroke={S.color}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeOpacity={isSelected ? 1 : 0.7}
                  filter={isSelected ? "url(#glow)" : "none"}
                />
                {/* Entity icon circle */}
                <circle r={14} fill={S.dim} />

                {/* Node Label */}
                <text
                  y={34}
                  textAnchor="middle"
                  fill={isSelected ? T.text : T.textDim}
                  fontSize={11.5}
                  fontWeight={isSelected ? 600 : 500}
                  fontFamily="var(--body)"
                >
                  {e.name}
                </text>
                <text
                  y={46}
                  textAnchor="middle"
                  fill={T.textFaint}
                  fontSize={9.5}
                  fontFamily="var(--mono)"
                >
                  {e.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Sliding Node Inspector Drawer */}
        {selectedNode && (
          <EntityDrawer
            entityKey={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSelectEntity={onSelectEntity}
          />
        )}

        {/* Sliding Edge Inspector Drawer */}
        {selectedEdge && (
          <EdgeDrawer
            edgeId={selectedEdge}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </div>
    </div>
  );
}

function EntityDrawer({ entityKey, onClose, onSelectEntity }) {
  const entity = ENTITIES[entityKey];
  if (!entity) return null;
  const S = ENTITY_STYLE[entity.type] || ENTITY_STYLE.PERSON;

  // Find relationships for this entity
  const connected = RELATIONSHIPS.filter((r) => r.a === entityKey || r.b === entityKey);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        background: "rgba(20, 31, 43, 0.95)",
        backdropFilter: "blur(10px)",
        borderLeft: `1px solid ${T.border}`,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        zIndex: 30,
        overflowY: "auto",
        boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <S.icon size={16} color={S.color} />
          <span style={{ fontSize: 11, fontWeight: 700, color: S.color, textTransform: "uppercase" }}>
            {S.label}
          </span>
        </div>
        <button onClick={onClose} style={{ color: T.textFaint }}><X size={16} /></button>
      </div>

      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{entity.name}</div>
        <div style={{ fontSize: 11.5, color: T.textFaint, fontFamily: "var(--mono)", marginTop: 2 }}>
          {entity.id} · {entity.sub}
        </div>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 0.5 }}>
        Connected Relationships ({connected.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {connected.map((r) => {
          const otherKey = r.a === entityKey ? r.b : r.a;
          const other = ENTITIES[otherKey];
          const style = REL_STYLE[r.type] || { label: r.type, color: T.textDim };

          return (
            <div
              key={r.id}
              onClick={() => onSelectEntity(otherKey)}
              style={{
                padding: "8px 10px",
                background: T.panelAlt,
                borderRadius: 6,
                border: `1px solid ${T.borderSoft}`,
                cursor: "pointer",
                fontSize: 12,
              }}
              className="navbtn"
            >
              <div style={{ display: "flex", justifyContent: "space-between", color: style.color, fontWeight: 600 }}>
                <span>{style.label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 11 }}>{r.confidence}% Conf.</span>
              </div>
              <div style={{ color: T.text, marginTop: 3 }}>Linked to: <strong>{other?.name}</strong></div>
              <div style={{ color: T.textFaint, fontSize: 11, marginTop: 2 }}>Evidence: {r.evidence}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", fontSize: 11, color: T.textFaint, borderTop: `1px solid ${T.borderSoft}`, paddingTop: 10 }}>
        Notice: Network centrality and connection frequency represent structural analytical relevance, not criminal culpability.
      </div>
    </div>
  );
}

function EdgeDrawer({ edgeId, onClose }) {
  const rel = RELATIONSHIPS.find((r) => r.id === edgeId);
  if (!rel) return null;
  const nodeA = ENTITIES[rel.a];
  const nodeB = ENTITIES[rel.b];
  const style = REL_STYLE[rel.type] || { label: rel.type, color: T.signal };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        background: "rgba(20, 31, 43, 0.95)",
        backdropFilter: "blur(10px)",
        borderLeft: `1px solid ${T.border}`,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        zIndex: 30,
        boxShadow: "-8px 0 24px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: style.color, textTransform: "uppercase" }}>
          Relationship Inspection
        </span>
        <button onClick={onClose} style={{ color: T.textFaint }}><X size={16} /></button>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{nodeA?.name} ↔ {nodeB?.name}</div>
        <div style={{ fontSize: 12, color: style.color, marginTop: 2, fontWeight: 500 }}>{style.label}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, background: T.panelAlt, padding: 12, borderRadius: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: T.textFaint }}>EVIDENCE ID</span>
          <span style={{ fontFamily: "var(--mono)", color: T.signal }}>{rel.evidence}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: T.textFaint }}>CONFIDENCE</span>
          <span style={{ fontFamily: "var(--mono)", color: T.ok }}>{rel.confidence}%</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
          <span style={{ color: T.textFaint }}>FREQUENCY COUNT</span>
          <span style={{ fontFamily: "var(--mono)" }}>{rel.count || 1} records</span>
        </div>
        {rel.amount && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: T.textFaint }}>AMOUNT</span>
            <span style={{ fontFamily: "var(--mono)", color: T.flag }}>{rel.amount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
