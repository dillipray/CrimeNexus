import React, { useState } from 'react';
import { TIMELINE, REL_STYLE, T } from '../data/mockData';
import { Clock, Filter, FileText } from 'lucide-react';

export default function TimelineView() {
  const [filterType, setFilterType] = useState("all");

  const filteredEvents = TIMELINE.filter(
    (ev) => filterType === "all" || ev.type === filterType
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>
            Chronological Investigation Timeline
          </div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            Multi-source temporal event reconstruction across communications, financial transfers, and location observations
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 12,
              background: filterType === "all" ? T.panelAlt : "transparent",
              color: filterType === "all" ? T.signal : T.textDim,
              border: `1px solid ${filterType === "all" ? T.signal : T.border}`,
            }}
          >
            All Events ({TIMELINE.length})
          </button>
          {Object.entries(REL_STYLE).map(([type, meta]) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: "5px 10px",
                borderRadius: 6,
                fontSize: 12,
                background: filterType === type ? T.panelAlt : "transparent",
                color: filterType === type ? meta.color : T.textFaint,
                border: `1px solid ${filterType === type ? meta.color : T.borderSoft}`,
              }}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div style={{ position: "relative", paddingLeft: 24, marginTop: 10 }}>
        {/* Continuous vertical line */}
        <div
          style={{
            position: "absolute",
            left: 7,
            top: 6,
            bottom: 6,
            width: 2,
            background: T.border,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredEvents.map((ev, i) => {
            const meta = REL_STYLE[ev.type] || { color: T.signal, label: ev.type };
            return (
              <div key={i} style={{ position: "relative" }}>
                {/* Event Dot */}
                <div
                  style={{
                    position: "absolute",
                    left: -24,
                    top: 14,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: meta.color,
                    border: `2px solid ${T.bg}`,
                    boxShadow: `0 0 8px ${meta.color}88`,
                  }}
                />

                <div
                  style={{
                    background: T.panel,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "12px 16px",
                  }}
                  className="navbtn"
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontFamily: "var(--mono)", color: T.textFaint }}>
                      {ev.time}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: meta.color,
                      background: T.panelAlt,
                      padding: "2px 7px",
                      borderRadius: 4,
                      border: `1px solid ${meta.color}33`,
                    }}>
                      {meta.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginTop: 4 }}>
                    {ev.detail}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: T.signal,
                      background: T.signalDim,
                      border: `1px solid ${T.signal}33`,
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}>
                      {ev.evidence}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
