import React, { useMemo } from 'react';
import { ENTITIES, RELATIONSHIPS, ENTITY_STYLE, T } from '../data/mockData';
import { Activity, Network, Split, Eye } from 'lucide-react';

function computeGraphMetrics(excludeEdgeId) {
  const nodes = Object.keys(ENTITIES);
  const edges = RELATIONSHIPS.filter((r) => r.id !== excludeEdgeId);
  const adj = Object.fromEntries(nodes.map((n) => [n, []]));
  edges.forEach((r) => {
    adj[r.a].push(r.b);
    adj[r.b].push(r.a);
  });

  const degree = Object.fromEntries(nodes.map((n) => [n, adj[n].length]));

  function bfsDist(src) {
    const dist = { [src]: 0 };
    const queue = [src];
    while (queue.length) {
      const cur = queue.shift();
      adj[cur].forEach((nb) => {
        if (!(nb in dist)) {
          dist[nb] = dist[cur] + 1;
          queue.push(nb);
        }
      });
    }
    return dist;
  }

  const closeness = {};
  nodes.forEach((n) => {
    const dist = bfsDist(n);
    const reachable = Object.values(dist).filter((d) => d > 0);
    const sum = reachable.reduce((a, b) => a + b, 0);
    closeness[n] = reachable.length > 0 ? +(reachable.length / sum || 0).toFixed(3) : 0;
  });

  // Brandes' algorithm (unweighted betweenness)
  const betweenness = Object.fromEntries(nodes.map((n) => [n, 0]));
  nodes.forEach((s) => {
    const stack = [];
    const pred = Object.fromEntries(nodes.map((n) => [n, []]));
    const sigma = Object.fromEntries(nodes.map((n) => [n, 0]));
    const dist = Object.fromEntries(nodes.map((n) => [n, -1]));
    sigma[s] = 1;
    dist[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift();
      stack.push(v);
      adj[v].forEach((w) => {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      });
    }
    const delta = Object.fromEntries(nodes.map((n) => [n, 0]));
    while (stack.length) {
      const w = stack.pop();
      pred[w].forEach((v) => {
        delta[v] += (sigma[v] / sigma[w]) * (1 + delta[w]);
      });
      if (w !== s) betweenness[w] += delta[w];
    }
  });
  nodes.forEach((n) => {
    betweenness[n] = +(betweenness[n] / 2).toFixed(1);
  });

  // Connected components
  const seen = new Set();
  const components = [];
  nodes.forEach((n) => {
    if (seen.has(n)) return;
    const comp = [];
    const queue = [n];
    seen.add(n);
    while (queue.length) {
      const cur = queue.shift();
      comp.push(cur);
      adj[cur].forEach((nb) => {
        if (!seen.has(nb)) {
          seen.add(nb);
          queue.push(nb);
        }
      });
    }
    components.push(comp);
  });

  return { degree, closeness, betweenness, components };
}

export default function AnalyticsView({ onSelectEntity }) {
  const base = useMemo(() => computeGraphMetrics(null), []);
  const topBridge = useMemo(() => {
    return RELATIONSHIPS.reduce(
      (max, r) =>
        base.betweenness[r.a] + base.betweenness[r.b] > max.score
          ? { id: r.id, score: base.betweenness[r.a] + base.betweenness[r.b] }
          : max,
      { id: null, score: -1 }
    );
  }, [base]);

  const split = useMemo(() => computeGraphMetrics(topBridge.id), [topBridge]);

  const ranked = Object.keys(ENTITIES)
    .map((k) => ({
      key: k,
      name: ENTITIES[k].name,
      type: ENTITIES[k].type,
      degree: base.degree[k],
      betweenness: base.betweenness[k],
      closeness: base.closeness[k],
    }))
    .sort((a, b) => b.betweenness - a.betweenness || b.degree - a.degree);

  const bridgeEntity = ranked[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 940 }}>
      <div>
        <div style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600 }}>Network Centrality & Topology Analysis</div>
        <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
          Algorithmic centrality metrics calculated directly from relationship topology. High betweenness centrality indicates structural network brokerage.
        </div>
      </div>

      {/* Centrality Table */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
          Entities Ranked by Betweenness Centrality (Brandes Algorithm)
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.8fr 1fr 1fr 0.8fr", padding: "6px 0", fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
            <span>ENTITY</span>
            <span>DEGREE</span>
            <span>BETWEENNESS</span>
            <span>CLOSENESS</span>
            <span style={{ textAlign: "right" }}>ACTION</span>
          </div>
          {ranked.map((r, i) => {
            const S = ENTITY_STYLE[r.type] || ENTITY_STYLE.PERSON;
            return (
              <div
                key={r.key}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 0.8fr 1fr 1fr 0.8fr",
                  padding: "10px 0",
                  fontSize: 12.5,
                  alignItems: "center",
                  borderBottom: i < ranked.length - 1 ? `1px solid ${T.borderSoft}` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <S.icon size={13} color={S.color} />
                  <span style={{ fontWeight: 500 }}>{r.name}</span>
                </div>
                <span style={{ fontFamily: "var(--mono)" }}>{r.degree}</span>
                <span style={{ fontFamily: "var(--mono)", color: T.signal, fontWeight: 600 }}>{r.betweenness}</span>
                <span style={{ fontFamily: "var(--mono)" }}>{r.closeness}</span>
                <div style={{ textAlign: "right" }}>
                  <button
                    onClick={() => onSelectEntity(r.key)}
                    style={{ color: T.signal, fontSize: 11.5, display: "inline-flex", alignItems: "center", gap: 3 }}
                  >
                    <Eye size={12} /> Graph
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Structure Breakdown */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textFaint, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
          Bridge Analysis & Network Partitioning
        </div>
        <p style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.6, marginBottom: 14 }}>
          Simulating the removal of the critical bridge connection ({topBridge.id ? RELATIONSHIPS.find((r) => r.id === topBridge.id)?.evidence : "TXN-311"}) partitions the network into <strong>{split.components.length} isolated components</strong>, demonstrating that <strong>{bridgeEntity?.name}</strong> acts as the key broker between disparate network clusters.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {split.components.map((comp, i) => (
            <div key={i} style={{ flex: "1 1 200px", background: T.panelAlt, border: `1px solid ${T.borderSoft}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: T.textFaint, marginBottom: 8 }}>
                CLUSTER {String.fromCharCode(65 + i)} · {comp.length} Entities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {comp.map((k) => {
                  const S = ENTITY_STYLE[ENTITIES[k]?.type] || ENTITY_STYLE.PERSON;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
                      <S.icon size={11} color={S.color} /> {ENTITIES[k]?.name}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
