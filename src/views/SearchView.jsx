import React, { useState, useEffect } from 'react';
import { Search, Users, Phone, Car, MapPin, Building2, FileText, ArrowRight, Eye } from 'lucide-react';
import { T, ENTITY_STYLE, ENTITIES, RELATIONSHIPS, TIMELINE } from '../data/mockData';
import { searchHybrid } from '../services/api';

export default function SearchView({ initialQuery = "", onSelectEntity, currentRole }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = async (q) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);

    // Call backend API
    const apiRes = await searchHybrid(q, currentRole.name, currentRole.user);

    if (apiRes) {
      setResults({
        entities: apiRes.entities || [],
        evidence: apiRes.evidence || [],
        semantic: apiRes.semantic_matches || [],
      });
      setLoading(false);
      return;
    }

    // Client-side fallback search
    const lower = q.toLowerCase();
    const matchedEntities = Object.entries(ENTITIES)
      .filter(([, e]) => e.name.toLowerCase().includes(lower) || e.id.toLowerCase().includes(lower))
      .map(([key, e]) => ({ key, ...e }));

    const matchedEvidence = RELATIONSHIPS.filter((r) =>
      r.evidence.toLowerCase().includes(lower)
    );

    const matchedEvents = TIMELINE.filter((ev) =>
      ev.detail.toLowerCase().includes(lower) || ev.evidence.toLowerCase().includes(lower)
    );

    setResults({
      entities: matchedEntities,
      evidence: matchedEvidence.map((r) => ({ id: r.evidence, type: r.type, detail: `${r.type} link` })),
      semantic: matchedEvents.map((ev) => ({ case_id: ev.evidence, text: ev.detail, confidence: 85 })),
    });
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 940 }}>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Global Hybrid Intelligence Search</div>
        <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
          Search across indexed knowledge graph entities, telephony records, financial flows, and semantic FIR text
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={16} color={T.textFaint} style={{ position: "absolute", left: 12, top: 12 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeSearch(query)}
            placeholder="Search by person name, phone number, vehicle registration, account ID, or free text..."
            style={{
              width: "100%",
              background: T.panel,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: "10px 12px 10px 38px",
              color: T.text,
              fontSize: 13.5,
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={() => executeSearch(query)}
          style={{
            padding: "0 18px",
            borderRadius: 8,
            background: T.signalDim,
            color: T.signal,
            border: `1px solid ${T.signal}66`,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results or Empty State */}
      {results ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Entity Hits */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Matched Graph Entities ({results.entities.length})
            </div>
            {results.entities.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {results.entities.map((e, i) => {
                  const S = ENTITY_STYLE[e.type] || ENTITY_STYLE.PERSON;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: T.panelAlt,
                        borderRadius: 6,
                        border: `1px solid ${T.borderSoft}`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <S.icon size={15} color={S.color} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{e.name}</div>
                          <div style={{ fontSize: 11, color: T.textFaint }}>{e.sub || e.id}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => onSelectEntity(e.key || "P1")}
                        style={{ color: T.signal, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Eye size={13} /> View on Graph
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: T.textFaint }}>No entities matched this query.</div>
            )}
          </div>

          {/* Evidence / Narrative Hits */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              Evidence & Narrative Text Matches
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {results.semantic && results.semantic.length > 0 ? (
                results.semantic.map((sem, idx) => (
                  <div key={idx} style={{ padding: "10px 12px", background: T.panelAlt, borderRadius: 6, border: `1px solid ${T.borderSoft}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontFamily: "var(--mono)", color: T.signal, fontSize: 11 }}>{sem.case_id}</span>
                      <span style={{ fontSize: 11, color: T.ok, fontWeight: 600 }}>{sem.confidence || 85}% Relevance</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5 }}>{sem.text}</div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 12.5, color: T.textFaint }}>No narrative matches found.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <Users size={16} color={T.signal} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Person & Phone Search</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
              Query by name or partial MSISDN (e.g. "Arjun", "+91 98")
            </div>
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <Car size={16} color={T.violet} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Vehicles & Transport</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
              Query by registration plates (e.g. "KA-04", "JH-00")
            </div>
          </div>
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16 }}>
            <FileText size={16} color={T.flag} />
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Semantic Narrative Search</div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>
              Vector similarity search across FIR narrative reports
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
