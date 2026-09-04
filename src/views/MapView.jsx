import React, { useState } from 'react';
import { MapPin, Navigation, Calendar, Layers, Eye, Users, Car, Building2, AlertTriangle } from 'lucide-react';

const T = {
  bg: "#0E161F",
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

const MOCK_LOCATIONS = [
  {
    id: "LOC-401",
    name: "Warehouse, Sector 12",
    type: "Facility",
    x: 65,
    y: 35,
    lat: "21.1458° N",
    lng: "79.0882° E",
    observations: 3,
    entities: ["KA-04 White Sedan", "Devraj Sharma", "Synthetic Logistics Group 11"],
    coLocationAlert: false,
    lastSeen: "17 Aug 2026, 09:30",
  },
  {
    id: "LOC-402",
    name: "Cafe Meridian, Central Block",
    type: "Public Venue",
    x: 38,
    y: 52,
    lat: "21.1390° N",
    lng: "79.0795° E",
    observations: 4,
    entities: ["Arjun Nair", "Kavita Rao"],
    coLocationAlert: true,
    lastSeen: "15 Aug 2026, 12:15 - 12:20",
    alertDetail: "Co-location detected: Arjun Nair and Kavita Rao observed within 5 minutes window.",
  },
  {
    id: "LOC-403",
    name: "Synthetic Transport Hub 4-1",
    type: "Transit Hub",
    x: 52,
    y: 70,
    lat: "21.1210° N",
    lng: "79.0560° E",
    observations: 5,
    entities: ["Person Alpha", "Aditya Singh", "JH-00-XX-0003"],
    coLocationAlert: true,
    lastSeen: "12 Aug 2026, 15:40",
    alertDetail: "Vehicle JH-00-XX-0003 logged at transit exit alongside co-present persons.",
  },
  {
    id: "LOC-404",
    name: "Silverline Office Complex",
    type: "Corporate Headquarters",
    x: 25,
    y: 28,
    lat: "21.1620° N",
    lng: "79.0910° E",
    observations: 2,
    entities: ["Meera Sen", "Sanjay Iyer"],
    coLocationAlert: false,
    lastSeen: "06 Aug 2026, 14:40",
  },
  {
    id: "LOC-405",
    name: "Cell Tower TOWER_022",
    type: "Telecom Infrastructure",
    x: 78,
    y: 60,
    lat: "21.1315° N",
    lng: "79.1120° E",
    observations: 14,
    entities: ["CDR-1042 (+91 98••• 1042)", "CDR-1223 (+91 98••• 1223)"],
    coLocationAlert: true,
    lastSeen: "18 Aug 2026, 18:02",
    alertDetail: "Antenna Sector 3 recorded concurrent connection pings from 2 target numbers.",
  },
];

export default function MapView({ onSelectEntity }) {
  const [selectedLoc, setSelectedLoc] = useState(MOCK_LOCATIONS[1]);
  const [filterType, setFilterType] = useState("all");

  const filtered = MOCK_LOCATIONS.filter(
    (loc) => filterType === "all" || (filterType === "colocated" ? loc.coLocationAlert : true)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 1180 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Geospatial & Co-location Analysis</div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            Synthetic coordinates and temporal co-presence mapping for CASE-2026-001 (Nagpur / Central Sector)
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setFilterType("all")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: filterType === "all" ? T.panelAlt : "transparent",
              color: filterType === "all" ? T.text : T.textDim,
              border: `1px solid ${filterType === "all" ? T.signal : T.border}`,
            }}
          >
            All Locations ({MOCK_LOCATIONS.length})
          </button>
          <button
            onClick={() => setFilterType("colocated")}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: filterType === "colocated" ? T.flagDim : "transparent",
              color: filterType === "colocated" ? T.flag : T.textDim,
              border: `1px solid ${filterType === "colocated" ? T.flag : T.border}`,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <AlertTriangle size={13} />
            Co-location Events (3)
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        {/* Interactive Tactical Map Viewport */}
        <div
          style={{
            background: "#080D13",
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            height: 480,
            position: "relative",
            overflow: "hidden",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
          }}
        >
          {/* Tactical grid background */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141F2B" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Simulated movement corridors */}
            <path
              d="M 180 120 L 260 250 L 440 170 L 520 290"
              fill="none"
              stroke="#1F5B60"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            <path
              d="M 260 250 L 350 340 L 520 290"
              fill="none"
              stroke="#5C4419"
              strokeWidth="2"
              strokeDasharray="3,3"
              opacity="0.7"
            />
          </svg>

          {/* Location pins */}
          {filtered.map((loc) => {
            const isSelected = selectedLoc?.id === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLoc(loc)}
                style={{
                  position: "absolute",
                  left: `${loc.x}%`,
                  top: `${loc.y}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: isSelected ? 20 : 10,
                  transition: "transform 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: isSelected ? 36 : 28,
                    height: isSelected ? 36 : 28,
                    borderRadius: "50%",
                    background: loc.coLocationAlert ? (isSelected ? T.flag : T.flagDim) : (isSelected ? T.signal : T.signalDim),
                    border: `2px solid ${loc.coLocationAlert ? T.flag : T.signal}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isSelected ? `0 0 15px ${loc.coLocationAlert ? T.flag : T.signal}` : "none",
                  }}
                >
                  <MapPin size={isSelected ? 18 : 14} color="#FFFFFF" />
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    background: "rgba(14,22,31,0.85)",
                    border: `1px solid ${T.borderSoft}`,
                    padding: "2px 6px",
                    borderRadius: 4,
                    color: isSelected ? T.text : T.textDim,
                    whiteSpace: "nowrap",
                  }}
                >
                  {loc.name}
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              background: "rgba(20, 31, 43, 0.9)",
              border: `1px solid ${T.border}`,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 11,
              color: T.textFaint,
              fontFamily: "var(--mono)",
            }}
          >
            SYS: WGS84 SYNTHETIC CRS · GRID STEP 2.5 KM
          </div>
        </div>

        {/* Selected Location Details Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {selectedLoc ? (
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: T.signal, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    {selectedLoc.type}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>{selectedLoc.name}</div>
                  <div style={{ fontSize: 12, color: T.textFaint, fontFamily: "var(--mono)", marginTop: 2 }}>
                    {selectedLoc.lat}, {selectedLoc.lng} · ID: {selectedLoc.id}
                  </div>
                </div>
              </div>

              {selectedLoc.coLocationAlert && (
                <div
                  style={{
                    background: T.flagDim,
                    border: `1px solid ${T.flag}55`,
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                  }}
                >
                  <AlertTriangle size={15} color={T.flag} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>
                    <strong>Co-location Observation:</strong> {selectedLoc.alertDetail}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 700, color: T.textFaint, letterSpacing: 0.6, marginBottom: 8 }}>
                ENTITIES OBSERVED AT THIS LOCATION ({selectedLoc.entities.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {selectedLoc.entities.map((ent, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      background: T.panelAlt,
                      borderRadius: 6,
                      fontSize: 12.5,
                    }}
                  >
                    <span style={{ color: T.text }}>{ent}</span>
                    <button
                      onClick={() => onSelectEntity && onSelectEntity("P1")}
                      style={{ color: T.signal, fontSize: 11.5, display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <Eye size={12} /> Graph
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: T.textDim }}>
                <div style={{ background: T.panelAlt, padding: "8px 10px", borderRadius: 6 }}>
                  <span style={{ color: T.textFaint, display: "block", fontSize: 10.5 }}>OBSERVATIONS</span>
                  <span style={{ fontWeight: 600, color: T.text }}>{selectedLoc.observations} records</span>
                </div>
                <div style={{ background: T.panelAlt, padding: "8px 10px", borderRadius: 6 }}>
                  <span style={{ color: T.textFaint, display: "block", fontSize: 10.5 }}>LAST RECORDED</span>
                  <span style={{ fontWeight: 600, color: T.text }}>{selectedLoc.lastSeen}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: 24, textAlign: "center", color: T.textFaint, background: T.panel, borderRadius: 10 }}>
              Click any location on the map to view observation records.
            </div>
          )}

          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", marginBottom: 6 }}>
              Responsible AI Spatial Notice
            </div>
            <div style={{ fontSize: 11.5, color: T.textDim, lineHeight: 1.5 }}>
              Co-location alerts indicate temporal proximity at a geographical site. They constitute investigative leads, not legal proof of association or unlawful conduct.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
