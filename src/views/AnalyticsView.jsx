import React, { useState, useMemo } from 'react';
import { ENTITY_STYLE, REL_STYLE, T } from '../data/mockData';
import { buildGraphForCase } from '../data/graphFromDataset';
import {
  findShortestPath,
  detectCommunities,
  detectBridgesAndBrokers,
} from '../utils/graphAlgorithms';
import {
  Activity,
  Network,
  Split,
  Eye,
  Route,
  Users2,
  GitFork,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
} from 'lucide-react';

export default function AnalyticsView({ onSelectEntity, activeCase = 'FIR_0001' }) {
  // Load real graph data for active case
  const graph = useMemo(() => buildGraphForCase(activeCase), [activeCase]);
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];

  // Algorithm 1: Centrality & Broker Analysis (Brandes & Tarjan)
  const bridgeData = useMemo(() => detectBridgesAndBrokers(nodes, edges), [nodes, edges]);

  // Algorithm 2: Community Detection & Modularity Clustering (Label Propagation)
  const communityData = useMemo(() => detectCommunities(nodes, edges), [nodes, edges]);

  // Algorithm 3: Multi-Hop Shortest Path Explorer State
  const defaultSource = nodes[0]?.id || '';
  const defaultTarget = nodes[nodes.length - 1]?.id || '';
  const [sourceId, setSourceId] = useState(defaultSource);
  const [targetId, setTargetId] = useState(defaultTarget);

  // Sync defaults when case changes
  React.useEffect(() => {
    if (nodes.length > 0) {
      setSourceId(nodes[0].id);
      setTargetId(nodes[nodes.length - 1].id);
    }
  }, [activeCase, nodes]);

  const shortestPath = useMemo(() => {
    if (!sourceId || !targetId) return null;
    return findShortestPath(nodes, edges, sourceId, targetId);
  }, [nodes, edges, sourceId, targetId]);

  const nodeMap = useMemo(() => {
    return Object.fromEntries(nodes.map((n) => [String(n.id), n]));
  }, [nodes]);

  const topBroker = bridgeData.rankedBrokers[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1040 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 19, fontWeight: 700, color: T.text }}>
            Criminal Network Graph Analytics
          </div>
          <div style={{ fontSize: 12.5, color: T.textDim, marginTop: 4 }}>
            Algorithmic topology metrics for <strong style={{ color: T.signal }}>{activeCase}</strong> ({nodes.length} entities, {edges.length} relationships). Applying 3 graph algorithms for deep relational discovery.
          </div>
        </div>
        <div style={{
          fontSize: 11,
          color: T.signal,
          background: T.signalDim,
          border: `1px solid ${T.signal}55`,
          padding: '6px 12px',
          borderRadius: 6,
          fontFamily: 'var(--mono)',
          fontWeight: 600,
        }}>
          3 GRAPH ALGORITHMS ACTIVE
        </div>
      </div>

      {/* Algorithm 1: Brandes Centrality & Broker Ranking */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color={T.signal} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Algorithm 1 · Brandes Centrality & Broker Detection
            </span>
          </div>
          <span style={{ fontSize: 11, color: T.textFaint }}>Identifies network gatekeepers and single points of contact</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr', padding: '7px 0', fontSize: 11, color: T.textFaint, fontWeight: 700, borderBottom: `1px solid ${T.border}` }}>
            <span>ENTITY</span>
            <span>DEGREE</span>
            <span>BETWEENNESS</span>
            <span>ROLE / STATUS</span>
            <span style={{ textAlign: 'right' }}>ACTION</span>
          </div>

          {bridgeData.rankedBrokers.map((r, i) => {
            const S = ENTITY_STYLE[r.type] || ENTITY_STYLE.PERSON;
            const Icon = S.icon;
            const isArticulation = bridgeData.articulationNodeIds.has(r.id);
            return (
              <div
                key={r.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr',
                  padding: '10px 0',
                  fontSize: 12.5,
                  alignItems: 'center',
                  borderBottom: i < bridgeData.rankedBrokers.length - 1 ? `1px solid ${T.borderSoft}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <Icon size={14} color={S.color} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.name}
                    </span>
                    <span style={{ fontSize: 10.5, color: T.textFaint, fontFamily: 'var(--mono)' }}>{r.id}</span>
                  </div>
                </div>

                <span style={{ fontFamily: 'var(--mono)', color: T.text }}>{r.degree} links</span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--mono)', color: r.betweenness > 0.1 ? T.signal : T.textDim, fontWeight: 600 }}>
                    {r.betweenness}
                  </span>
                  <div style={{ width: 45, height: 4, background: T.panelAlt, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, r.betweenness * 200)}%`, height: '100%', background: T.signal }} />
                  </div>
                </div>

                <div>
                  {isArticulation ? (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: T.flagDim, color: T.flag, fontWeight: 700, fontFamily: 'var(--mono)' }}>
                      ⚡ CUT VERTEX
                    </span>
                  ) : r.betweenness > 0.08 ? (
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: T.signalDim, color: T.signal, fontWeight: 700, fontFamily: 'var(--mono)' }}>
                      KEY BROKER
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: T.textFaint }}>Network Associate</span>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => onSelectEntity(r.id)}
                    style={{
                      color: T.signal,
                      fontSize: 11.5,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 600,
                    }}
                  >
                    <Eye size={12} /> Graph
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Algorithm 2: Community Detection & Modularity Clustering */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users2 size={16} color={T.ok} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Algorithm 2 · Community Detection & Syndicate Cell Partitioning
            </span>
          </div>
          <span style={{ fontSize: 11, color: T.textFaint }}>
            Label Propagation Modularity · {communityData.communities.length} functional cells
          </span>
        </div>

        <p style={{ fontSize: 12.5, color: T.textDim, lineHeight: 1.5, marginBottom: 14 }}>
          Algorithmic community clustering groups entities based on high relational interaction density, distinguishing operational field cells, financial structuring hubs, and communication sub-networks.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {communityData.communities.map((c, idx) => (
            <div
              key={c.id}
              style={{
                background: T.panelAlt,
                border: `1px solid ${c.color}44`,
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: c.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: c.color + '22', color: c.color, fontFamily: 'var(--mono)' }}>
                  {c.size} Entities
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                {c.nodeIds.map((nid) => {
                  const node = nodeMap[nid] || { name: nid, type: 'PERSON' };
                  const S = ENTITY_STYLE[node.type] || ENTITY_STYLE.PERSON;
                  const Icon = S.icon;
                  return (
                    <div
                      key={nid}
                      onClick={() => onSelectEntity(nid)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        padding: '4px 6px',
                        borderRadius: 4,
                        background: T.panel,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon size={12} color={S.color} />
                        <span style={{ color: T.text, fontWeight: 500 }}>{node.name}</span>
                      </div>
                      <span style={{ fontSize: 10, color: T.textFaint, fontFamily: 'var(--mono)' }}>{nid}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Algorithm 3: Multi-Hop Shortest Path Explorer & Bridge Vulnerability */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Shortest Path Interactive Tool */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Route size={16} color={T.signal} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Algorithm 3 · Multi-Hop Relational Path Explorer
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: T.textFaint, fontWeight: 600 }}>SOURCE ENTITY</label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                style={{
                  background: T.panelAlt,
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  padding: '7px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.id})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: T.textFaint, fontWeight: 600 }}>TARGET ENTITY</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                style={{
                  background: T.panelAlt,
                  color: T.text,
                  border: `1px solid ${T.border}`,
                  padding: '7px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                }}
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {shortestPath && shortestPath.found ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: T.panelAlt, borderRadius: 8, padding: 12, border: `1px solid ${T.signal}44` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: T.signal }}>
                  Optimal Chain of Custody / Routing ({shortestPath.hops} Hops)
                </span>
                <span style={{ fontSize: 11, color: T.ok, fontWeight: 700, fontFamily: 'var(--mono)' }}>
                  {shortestPath.confidence}% Total Confidence
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {shortestPath.steps.map((s, idx) => {
                  const fromNode = nodeMap[s.from] || { name: s.from };
                  const toNode = nodeMap[s.to] || { name: s.to };
                  const meta = REL_STYLE[s.type] || { label: s.type, color: T.signal };
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        background: T.panel,
                        borderRadius: 6,
                        fontSize: 12,
                        border: `1px solid ${T.borderSoft}`,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: T.text }}>{fromNode.name}</span>
                      <span style={{ fontSize: 10.5, color: meta.color, fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        ──[ {meta.label} ]──▶
                      </span>
                      <span style={{ fontWeight: 600, color: T.text }}>{toNode.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: 16, background: T.panelAlt, borderRadius: 8, textAlign: 'center', color: T.textFaint, fontSize: 12 }}>
              No direct or multi-hop path found between selected entities.
            </div>
          )}
        </div>

        {/* Network Resilience & Critical Bridge Analysis */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitFork size={16} color={T.flag} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: T.text, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              Tarjan Bridge Vulnerability Analysis
            </span>
          </div>

          <p style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5 }}>
            Tarjan's DFS algorithm discovered <strong style={{ color: T.flag }}>{bridgeData.bridgeCount} critical bridge links</strong> and <strong style={{ color: T.signal }}>{bridgeData.cutCount} articulation points</strong> in {activeCase}.
          </p>

          <div style={{ background: T.panelAlt, borderRadius: 8, padding: 12, border: `1px solid ${T.borderSoft}` }}>
            <div style={{ fontSize: 11, color: T.textFaint, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
              Syndicate Vulnerability Assessment
            </div>
            <p style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>
              Neutralizing <strong>{topBroker?.name}</strong> or severing the primary bridge connections will fracture the syndicate into isolated operational components.
            </p>
          </div>

          <button
            onClick={() => onSelectEntity(topBroker?.id)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: T.signalDim,
              color: T.signal,
              border: `1px solid ${T.signal}55`,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 'auto',
            }}
          >
            Inspect Primary Broker in Graph <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
