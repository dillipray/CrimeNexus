import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Style tokens only — graph data comes from graphFromDataset.js or the backend API
import { T, ENTITY_STYLE, REL_STYLE } from '../data/mockData';
import { buildGraphForCase, getDefaultFocusForCase } from '../data/graphFromDataset';
import { findShortestPath, detectCommunities, detectBridgesAndBrokers } from '../utils/graphAlgorithms';
import {
  X,
  Database,
  Crosshair,
  ChevronRight,
  RotateCcw,
  Layers,
  Route,
  Users2,
  GitFork,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchGraphSubgraph } from '../services/api';

const SVG_W = 920, SVG_H = 540, CX = SVG_W / 2, CY = SVG_H / 2;
const MAX_NODES = 35, MAX_EDGES = 70;
const PRIORITY_TYPES = ['fir_co_mention', 'communication', 'financial'];
const ALL_TYPES = Object.keys(REL_STYLE);
const shortLabel = (name, n = 11) => !name ? '' : name.length > n ? name.slice(0, n - 1) + '\u2026' : name;

let _cyReady = null;
async function getCytoscape() {
  if (_cyReady) return _cyReady;
  const [cyMod, fcoseMod] = await Promise.all([import('cytoscape'), import('cytoscape-fcose')]);
  const cytoscape = cyMod.default, fcose = fcoseMod.default;
  try { cytoscape.use(fcose); } catch (_) {}
  _cyReady = cytoscape;
  return cytoscape;
}

async function runFCoSE(nodes, edges, fixedId) {
  const cytoscape = await getCytoscape();
  const nodeIds = new Set(nodes.map(n => String(n.id)));
  const elements = [
    ...nodes.map(n => ({ data: { id: String(n.id) } })),
    ...edges.filter(e => nodeIds.has(String(e.a)) && nodeIds.has(String(e.b)))
      .map((e, i) => ({ data: { id: String(e.id || 'e' + i), source: String(e.a), target: String(e.b) } })),
  ];
  return new Promise(resolve => {
    const cy = cytoscape({ headless: true, elements, layout: { name: 'preset' } });
    const fixedNodeConstraint = fixedId ? [{ nodeId: String(fixedId), position: { x: 0, y: 0 } }] : [];
    const layout = cy.layout({ name: 'fcose', quality: 'proof', animate: false, randomize: !fixedId, nodeRepulsion: () => 5500, idealEdgeLength: () => 100, edgeElasticity: () => 0.45, gravity: 0.35, gravityRange: 3.8, numIter: 2500, packComponents: true, tile: true, tilingPaddingVertical: 10, tilingPaddingHorizontal: 10, fixedNodeConstraint });
    layout.run();
    const fixedNode = fixedId ? cy.getElementById(String(fixedId)) : null;
    const fixedPos = (fixedNode && fixedNode.length) ? fixedNode.position() : { x: 0, y: 0 };
    const bb = cy.elements().boundingBox();
    const scale = Math.min((SVG_W - 160) / (bb.w || 1), (SVG_H - 160) / (bb.h || 1), 1.4);
    const posMap = {};
    cy.nodes().forEach(n => { const p = n.position(); posMap[n.id()] = { x: Math.round(CX + (p.x - fixedPos.x) * scale), y: Math.round(CY + (p.y - fixedPos.y) * scale) }; });
    cy.destroy(); resolve(posMap);
  });
}

// Section 15.1 CSV-derived graph cache: built once per case on first access
const _csvGraphCache = {};
function getLocalGraph(caseId) {
  if (!_csvGraphCache[caseId]) {
    _csvGraphCache[caseId] = buildGraphForCase(caseId);
  }
  return _csvGraphCache[caseId];
}

const normaliseEdge = e => ({ id: e.id || (e.source ?? e.a) + '-' + (e.target ?? e.b), a: e.source ?? e.a, b: e.target ?? e.b, type: e.type || 'association', evidence: e.evidence || '', confidence: e.confidence ?? 85, count: e.count ?? 1, amount: e.amount, first: e.first, last: e.last });

function buildFocused(focusId, allNodes, allEdges, activeTypes, maxN, maxE) {
  const nodeMap = Object.fromEntries(allNodes.map(n => [String(n.id), n]));
  let fEdges = allEdges.filter(e => (String(e.a) === String(focusId) || String(e.b) === String(focusId)) && activeTypes.includes(e.type)).sort((a, b) => b.confidence - a.confidence).slice(0, maxE);
  const visIds = new Set([String(focusId)]);
  fEdges.forEach(e => { visIds.add(String(e.a)); visIds.add(String(e.b)); });
  const deg = {};
  allEdges.forEach(e => { if (String(e.a) === String(focusId)) deg[String(e.b)] = (deg[String(e.b)] || 0) + 1; if (String(e.b) === String(focusId)) deg[String(e.a)] = (deg[String(e.a)] || 0) + 1; });
  const finalIds = new Set([String(focusId), ...[...visIds].filter(id => id !== String(focusId)).sort((a, b) => (deg[b] || 0) - (deg[a] || 0)).slice(0, maxN - 1)]);
  return { visNodes: allNodes.filter(n => finalIds.has(String(n.id))), visEdges: fEdges.filter(e => finalIds.has(String(e.a)) && finalIds.has(String(e.b))) };
}

export default function GraphView({ selectedNode, setSelectedNode, selectedEdge, setSelectedEdge, relFilter, setRelFilter, onSelectEntity, activeCase = 'FIR_0001', backendConnected = false }) {
  const [zoom, setZoom] = useState(1);
  const [remoteGraph, setRemoteGraph] = useState(null);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState({});
  // Default focus: primary subject from the CSV dataset for the active case
  const [focusId, setFocusId] = useState(() => getDefaultFocusForCase(activeCase) || 'P009');
  const [activeTypes, setActiveTypes] = useState(PRIORITY_TYPES);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const layoutRunId = useRef(0);

  // Graph Algorithm Showcase Modes: 'none' | 'shortest_path' | 'community' | 'bridges'
  const [algoMode, setAlgoMode] = useState('none');
  const [pathTargetId, setPathTargetId] = useState(null);
  const [activeCommunityFilter, setActiveCommunityFilter] = useState(null);

  // Reset focus whenever the active case changes
  useEffect(() => {
    const def = getDefaultFocusForCase(activeCase) || 'P009';
    setFocusId(def);
    setSelectedNode(null);
    setSelectedEdge(null);
    setPositions({});
    setPathTargetId(null);
    setActiveCommunityFilter(null);
  }, [activeCase]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const data = await fetchGraphSubgraph(activeCase, null, 1);
      if (mounted && data && data.nodes && data.nodes.length > 0) setRemoteGraph(data);
      else if (mounted) setRemoteGraph(null);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [activeCase, backendConnected]);

  let allNodes, allEdgesNorm, storageSource;
  if (remoteGraph && remoteGraph.nodes && remoteGraph.nodes.length > 0) {
    allNodes = remoteGraph.nodes;
    allEdgesNorm = (remoteGraph.edges || []).map(normaliseEdge);
    storageSource = remoteGraph.storage === 'neo4j' ? 'Neo4j' : 'NetworkX';
  } else {
    // Fallback: build graph directly from Section 15.1 CSV files
    const csv = getLocalGraph(activeCase);
    allNodes = csv.nodes;
    allEdgesNorm = csv.edges.map(normaliseEdge);
    storageSource = 'CSV Dataset · ' + activeCase;
  }

  const { visNodes, visEdges } = buildFocused(focusId, allNodes, allEdgesNorm, activeTypes, MAX_NODES, MAX_EDGES);

  useEffect(() => {
    if (!visNodes || visNodes.length === 0) return;
    const runId = ++layoutRunId.current;
    setPositions({});
    runFCoSE(visNodes, visEdges, focusId).then(posMap => { if (layoutRunId.current === runId) setPositions(posMap); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, activeTypes, remoteGraph]);

  const entities = {};
  visNodes.forEach(n => { const pos = positions[String(n.id)] || { x: CX, y: CY }; entities[String(n.id)] = { ...n, x: pos.x, y: pos.y }; });
  const isComputing = loading || (visNodes.length > 0 && Object.keys(positions).length === 0);

  // ── Algorithm 1: Multi-Hop Shortest Path ───────────────────────────────────
  const effectiveTargetId = pathTargetId || (selectedNode && String(selectedNode) !== String(focusId) ? String(selectedNode) : null);
  const shortestPath = useMemo(() => {
    if (algoMode !== 'shortest_path' || !effectiveTargetId) return null;
    return findShortestPath(visNodes, visEdges, focusId, effectiveTargetId);
  }, [algoMode, visNodes, visEdges, focusId, effectiveTargetId]);

  const pathNodeSet = useMemo(() => new Set(shortestPath?.pathNodeIds || []), [shortestPath]);
  const pathEdgeSet = useMemo(() => new Set(shortestPath?.pathEdgeIds || []), [shortestPath]);

  // ── Algorithm 2: Community Detection ───────────────────────────────────────
  const communityData = useMemo(() => {
    if (algoMode !== 'community') return null;
    return detectCommunities(visNodes, visEdges);
  }, [algoMode, visNodes, visEdges]);

  // ── Algorithm 3: Key Bridges & Brokers ─────────────────────────────────────
  const bridgeData = useMemo(() => {
    if (algoMode !== 'bridges') return null;
    return detectBridgesAndBrokers(visNodes, visEdges);
  }, [algoMode, visNodes, visEdges]);

  const handleNodeClick = useCallback((key, evt) => {
    evt.stopPropagation();
    setSelectedNode(key);
    setSelectedEdge(null);
    if (algoMode === 'shortest_path') {
      if (String(key) === String(focusId)) {
        setPathTargetId(null);
      } else {
        setPathTargetId(key);
      }
    }
  }, [setSelectedNode, setSelectedEdge, algoMode, focusId]);

  const handleNodeDbl = useCallback((key, evt) => {
    evt.stopPropagation();
    setFocusId(key);
    setSelectedNode(null);
    setSelectedEdge(null);
    if (algoMode === 'shortest_path' && pathTargetId === key) {
      setPathTargetId(null);
    }
  }, [setSelectedNode, setSelectedEdge, algoMode, pathTargetId]);

  const toggleType = t => { setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]); setPositions({}); };
  const resetFocus = () => {
    setFocusId(getDefaultFocusForCase(activeCase) || 'P009');
    setSelectedNode(null);
    setSelectedEdge(null);
    setPathTargetId(null);
  };
  const displayedTypes = showAllTypes ? ALL_TYPES : ALL_TYPES.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: 'calc(100vh - 120px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 17, fontWeight: 700, color: T.text }}>Investigation Graph</span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: storageSource.includes('Neo4j') ? T.okDim : T.panelAlt, color: storageSource.includes('Neo4j') ? T.ok : T.signal, border: '1px solid ' + (storageSource.includes('Neo4j') ? T.ok + '55' : T.signal + '44'), fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Database size={10} /> {storageSource}
            </span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: T.raised, color: T.textDim, border: '1px solid ' + T.border, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Crosshair size={10} color={T.signal} /> Focus: {entities[focusId]?.name || focusId}
            </span>
            <span style={{ fontSize: 11, color: T.textFaint }}>{visNodes.length} nodes · {visEdges.length} edges · depth 1</span>
            {isComputing && <span style={{ fontSize: 11, color: T.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><SpinnerSVG size={12} /> fCoSE…</span>}
          </div>
          <div style={{ fontSize: 11.5, color: T.textDim, marginTop: 3 }}>Click node to inspect · Double-click to re-focus · fCoSE force-directed layout</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={resetFocus} style={{ padding: '4px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, background: T.panelAlt, color: T.textDim, border: '1px solid ' + T.border }}>
            <RotateCcw size={11} /> Reset
          </button>
          <div style={{ display: 'flex' }}>
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.15))} style={{ padding: '4px 8px', background: T.panelAlt, border: '1px solid ' + T.border, borderRadius: '4px 0 0 4px', color: T.text, fontSize: 13 }}>−</button>
            <button onClick={() => setZoom(1)} style={{ padding: '4px 8px', background: T.panelAlt, border: '1px solid ' + T.border, borderLeft: 'none', borderRight: 'none', color: T.text, fontSize: 10.5, minWidth: 42, textAlign: 'center' }}>{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom(z => Math.min(2.2, z + 0.15))} style={{ padding: '4px 8px', background: T.panelAlt, border: '1px solid ' + T.border, borderRadius: '0 4px 4px 0', color: T.text, fontSize: 13 }}>+</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: T.textFaint, display: 'flex', alignItems: 'center', gap: 4 }}><Layers size={11} /> Types:</span>
          {displayedTypes.map(type => { const meta = REL_STYLE[type]; const on = activeTypes.includes(type); return (
            <button key={type} onClick={() => toggleType(type)} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 600, cursor: 'pointer', background: on ? meta.color + '22' : 'transparent', color: on ? meta.color : T.textFaint, border: '1px solid ' + (on ? meta.color + '88' : T.borderSoft) }}>{meta.label}</button>
          ); })}
          <button onClick={() => setShowAllTypes(v => !v)} style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10.5, cursor: 'pointer', background: 'transparent', color: T.textFaint, border: '1px solid ' + T.borderSoft }}>{showAllTypes ? 'Less' : 'More…'}</button>
        </div>

        {/* Algorithm Mode Selection Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 6px', background: T.panelAlt, borderRadius: 8, border: `1px solid ${T.borderSoft}` }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: T.signal, display: 'flex', alignItems: 'center', gap: 4, letterSpacing: 0.5, textTransform: 'uppercase', paddingRight: 4 }}>
            <Sparkles size={12} color={T.signal} /> Algorithms:
          </span>
          {[
            { id: 'none', label: 'Standard', icon: Layers },
            { id: 'shortest_path', label: 'Shortest Path', icon: Route },
            { id: 'community', label: 'Communities', icon: Users2 },
            { id: 'bridges', label: 'Key Bridges', icon: GitFork },
          ].map(algo => {
            const active = algoMode === algo.id;
            const Icon = algo.icon;
            return (
              <button
                key={algo.id}
                onClick={() => {
                  setAlgoMode(algo.id);
                  if (algo.id !== 'shortest_path') setPathTargetId(null);
                  if (algo.id !== 'community') setActiveCommunityFilter(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 5,
                  fontSize: 10.5,
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                  background: active ? T.signalDim : 'transparent',
                  color: active ? T.signal : T.textDim,
                  border: `1px solid ${active ? T.signal + '66' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={11} color={active ? T.signal : T.textFaint} />
                {algo.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, background: T.panel, borderRadius: 10, border: '1px solid ' + T.border, position: 'relative', overflow: 'hidden' }}
        onClick={() => { setSelectedNode(null); setSelectedEdge(null); }}>
        <svg width="100%" height="100%" viewBox={'0 0 ' + SVG_W + ' ' + SVG_H}
          style={{ transform: 'scale(' + zoom + ')', transformOrigin: 'center center', transition: 'transform 0.15s ease' }}>
          <defs>
            <pattern id="iv-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke={T.borderSoft} strokeWidth="0.4" />
            </pattern>
            <filter id="iv-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="iv-glow-sm" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {ALL_TYPES.map(type => { const meta = REL_STYLE[type]; return (
              <marker key={'iv-a-' + type} id={'iv-a-' + type} markerWidth="8" markerHeight="8" refX="22" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill={meta.color} fillOpacity="0.7" />
              </marker>
            ); })}
            <marker id="iv-a-path" markerWidth="8" markerHeight="8" refX="22" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={T.signal} fillOpacity="0.95" />
            </marker>
            <marker id="iv-a-bridge" markerWidth="8" markerHeight="8" refX="22" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={T.flag} fillOpacity="0.95" />
            </marker>
            <radialGradient id="iv-focus-glow"><stop offset="0%" stopColor={T.signal} stopOpacity="0.18" /><stop offset="100%" stopColor={T.signal} stopOpacity="0" /></radialGradient>
          </defs>
          <style>{'@keyframes pulse-ring{0%,100%{opacity:.9}50%{opacity:.35}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>
          <rect width="100%" height="100%" fill="url(#iv-grid)" />

          {entities[focusId] && (
            <ellipse cx={entities[focusId].x} cy={entities[focusId].y} rx={60} ry={55}
              fill="url(#iv-focus-glow)" style={{ animation: 'pulse-ring 2.6s ease-in-out infinite' }} />
          )}

          {visEdges.map(r => {
            const A = entities[r.a], B = entities[r.b];
            if (!A || !B) return null;
            const isSel = selectedEdge === r.id;
            const meta = REL_STYLE[r.type] || { color: T.border, label: r.type };
            const isFocusEdge = String(r.a) === String(focusId) || String(r.b) === String(focusId);
            const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;

            const isPathEdge = algoMode === 'shortest_path' && pathEdgeSet.has(String(r.id));
            const isBridgeEdge = algoMode === 'bridges' && bridgeData?.bridgeEdgeIds?.has(String(r.id));
            const isDimmed = (algoMode === 'shortest_path' && shortestPath?.found && !isPathEdge) ||
                             (algoMode === 'community' && activeCommunityFilter &&
                              (communityData?.nodeCommunityMap[r.a]?.id !== activeCommunityFilter ||
                               communityData?.nodeCommunityMap[r.b]?.id !== activeCommunityFilter));

            const edgeColor = isPathEdge ? T.signal : isBridgeEdge ? T.flag : meta.color;
            const edgeWidth = isPathEdge ? 3.8 : isBridgeEdge ? 3.2 : isSel ? 2.8 : isFocusEdge ? 1.8 : 1.2;
            const edgeOpacity = isDimmed ? 0.12 : (isPathEdge || isBridgeEdge || isSel) ? 1 : isFocusEdge ? 0.75 : 0.45;
            const edgeDash = isPathEdge ? '8,4' : isBridgeEdge ? '6,3' : (r.type === 'financial' ? '6,3' : 'none');

            return (
              <g key={r.id} onClick={e => { e.stopPropagation(); setSelectedEdge(r.id); setSelectedNode(null); }} style={{ cursor: 'pointer', transition: 'opacity 0.2s ease' }}>
                <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="transparent" strokeWidth={18} />
                <line
                  x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke={edgeColor}
                  strokeWidth={edgeWidth}
                  strokeOpacity={edgeOpacity}
                  strokeDasharray={edgeDash}
                  markerEnd={'url(#iv-a-' + (isBridgeEdge ? 'bridge' : isPathEdge ? 'path' : r.type) + ')'}
                  filter={isPathEdge || isBridgeEdge ? 'url(#iv-glow)' : 'none'}
                />
                <circle cx={mx} cy={my} r={isPathEdge ? 6.5 : isBridgeEdge ? 6 : isSel ? 6 : 4.5} fill={T.panel} stroke={edgeColor} strokeWidth={isPathEdge || isBridgeEdge ? 2 : 1.4} />
                {(isSel || isBridgeEdge) && (
                  <g>
                    <rect x={mx + 8} y={my - 16} width={isBridgeEdge ? 130 : 144} height={20} rx={4} fill={T.panelAlt} stroke={edgeColor} strokeWidth={0.8} fillOpacity={0.95} />
                    <text x={mx + 14} y={my - 3} fill={edgeColor} fontSize={9.5} fontFamily="var(--mono)" fontWeight={600}>
                      {isBridgeEdge ? '⚡ Critical Bridge' : `${meta.label} · ${r.confidence}%`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {Object.entries(entities).map(([key, e]) => {
            const isFocus = String(key) === String(focusId);
            const isSel = selectedNode === key;
            const S = ENTITY_STYLE[e.type] || ENTITY_STYLE.PERSON;
            const r = isFocus ? 28 : 20;
            const ri = isFocus ? 17 : 12;

            const isPathNode = algoMode === 'shortest_path' && pathNodeSet.has(key);
            const pathStepIndex = isPathNode ? shortestPath.pathNodeIds.indexOf(key) : -1;
            const nodeComm = algoMode === 'community' ? communityData?.nodeCommunityMap[key] : null;
            const isArticulation = algoMode === 'bridges' && bridgeData?.articulationNodeIds?.has(key);
            const isNodeDimmed = (algoMode === 'shortest_path' && shortestPath?.found && !isPathNode) ||
                                 (algoMode === 'community' && activeCommunityFilter && nodeComm?.id !== activeCommunityFilter);

            const ringColor = isPathNode ? T.signal : isArticulation ? T.flag : nodeComm ? nodeComm.color : S.color;

            return (
              <g
                key={key}
                transform={'translate(' + e.x + ',' + e.y + ')'}
                onClick={evt => handleNodeClick(key, evt)}
                onDoubleClick={evt => handleNodeDbl(key, evt)}
                style={{ cursor: 'pointer', opacity: isNodeDimmed ? 0.22 : 1, transition: 'opacity 0.2s ease' }}
              >
                {/* Community halo */}
                {nodeComm && !isNodeDimmed && (
                  <circle r={r + 14} fill={nodeComm.color} fillOpacity={0.12} filter="url(#iv-glow)" />
                )}
                {/* Bridge / Articulation point glow */}
                {isArticulation && (
                  <circle r={r + 12} fill="none" stroke={T.flag} strokeWidth={2} strokeOpacity={0.5} filter="url(#iv-glow)" style={{ animation: 'pulse-ring 2s infinite' }} />
                )}
                {/* Path node glow */}
                {isPathNode && (
                  <circle r={r + 11} fill="none" stroke={T.signal} strokeWidth={2} strokeOpacity={0.6} filter="url(#iv-glow)" />
                )}
                {isFocus && <circle r={r + 10} fill="none" stroke={S.color} strokeWidth={1.5} strokeOpacity={0.3} filter="url(#iv-glow)" />}
                {isSel && !isFocus && <circle r={r + 7} fill="none" stroke={S.color} strokeWidth={1.5} strokeOpacity={0.4} filter="url(#iv-glow-sm)" />}

                <circle r={r} fill={T.panel} stroke={ringColor} strokeWidth={isFocus || isPathNode || isArticulation ? 2.5 : isSel ? 2 : 1.4} filter={isFocus || isPathNode ? 'url(#iv-glow-sm)' : 'none'} />
                <circle r={ri} fill={isFocus ? ringColor + '33' : S.dim} />
                {isFocus && <circle r={4} cx={0} cy={-(r + 7)} fill={S.color} />}

                {/* Path hop badge */}
                {isPathNode && pathStepIndex >= 0 && (
                  <g transform={'translate(0, -' + (r + 13) + ')'}>
                    <circle r={9} fill={T.signal} />
                    <text textAnchor="middle" dy="3.5" fill="#0E161F" fontSize={9} fontWeight={800} fontFamily="var(--mono)">
                      {pathStepIndex + 1}
                    </text>
                  </g>
                )}

                {/* Articulation point badge */}
                {isArticulation && (
                  <g transform={'translate(0, -' + (r + 13) + ')'}>
                    <rect x={-24} y={-8} width={48} height={15} rx={4} fill={T.flag} />
                    <text textAnchor="middle" dy="3.5" fill="#0E161F" fontSize={8} fontWeight={800} fontFamily="var(--mono)">
                      BROKER
                    </text>
                  </g>
                )}

                <text y={r + 14} textAnchor="middle" fill={isFocus || isPathNode || isArticulation ? T.text : isSel ? T.text : T.textDim} fontSize={isFocus ? 11 : 9.5} fontWeight={isFocus || isSel || isPathNode ? 700 : 500} fontFamily="var(--body)">
                  {shortLabel(e.name, isFocus ? 13 : 10)}
                </text>
                <text y={r + 25} textAnchor="middle" fill={T.textFaint} fontSize={8.5} fontFamily="var(--mono)">
                  {String(e.id).slice(0, 12)}
                </text>
              </g>
            );
          })}
        </svg>

        {isComputing && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(14,22,31,0.55)', backdropFilter: 'blur(3px)', zIndex: 20 }}>
            <div style={{ padding: '12px 24px', borderRadius: 10, background: T.panelAlt, border: '1px solid ' + T.border, color: T.signal, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
              <SpinnerSVG size={18} /> Computing fCoSE layout\u2026
            </div>
          </div>
        )}
        {!isComputing && visNodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 13, color: T.textFaint }}>No relationships match the active filters.</span>
            <button onClick={() => setActiveTypes(PRIORITY_TYPES)} style={{ fontSize: 12, color: T.signal, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset filters</button>
          </div>
        )}

        {/* Algorithm Insight Floating Dock */}
        {algoMode === 'shortest_path' && (
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, background: 'rgba(17, 27, 38, 0.94)', backdropFilter: 'blur(10px)', border: `1px solid ${T.signal}55`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, zIndex: 25, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Route size={15} color={T.signal} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.signal }}>Multi-Hop Relational Path:</span>
              </div>
              {shortestPath && shortestPath.found ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', fontSize: 11.5 }}>
                  {shortestPath.steps.map((s, idx) => {
                    const fromNode = entities[s.from] || { name: s.from };
                    const toNode = entities[s.to] || { name: s.to };
                    const meta = REL_STYLE[s.type] || { label: s.type, color: T.signal };
                    return (
                      <React.Fragment key={idx}>
                        {idx === 0 && (
                          <span style={{ fontWeight: 600, color: T.text, padding: '3px 7px', background: T.panelAlt, borderRadius: 4, border: `1px solid ${T.borderSoft}` }}>
                            {fromNode.name}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: meta.color, fontFamily: 'var(--mono)', fontSize: 10.5 }}>
                          ──[ {meta.label} ]──▶
                        </span>
                        <span style={{ fontWeight: 600, color: T.text, padding: '3px 7px', background: T.panelAlt, borderRadius: 4, border: `1px solid ${T.borderSoft}` }}>
                          {toNode.name}
                        </span>
                      </React.Fragment>
                    );
                  })}
                  <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 12, background: T.okDim, color: T.ok, fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)', flexShrink: 0 }}>
                    {shortestPath.hops} Hops · {shortestPath.confidence}% Conf.
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: 11.5, color: T.textDim, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Info size={13} color={T.signal} /> Click any entity in the network to discover the multi-hop relational connection from <strong>{entities[focusId]?.name || focusId}</strong>
                </span>
              )}
            </div>
            {effectiveTargetId && (
              <button
                onClick={() => { setPathTargetId(null); setSelectedNode(null); }}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: T.panelAlt, color: T.textDim, border: `1px solid ${T.borderSoft}`, cursor: 'pointer', flexShrink: 0 }}
              >
                Clear Target
              </button>
            )}
          </div>
        )}

        {algoMode === 'community' && communityData && (
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, background: 'rgba(17, 27, 38, 0.94)', backdropFilter: 'blur(10px)', border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, zIndex: 25, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Users2 size={15} color={T.signal} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>Detected Syndicate Cells:</span>
              </div>
              {communityData.communities.map(c => {
                const isSelected = activeCommunityFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCommunityFilter(isSelected ? null : c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 9px',
                      borderRadius: 14,
                      background: isSelected ? c.color + '33' : T.panelAlt,
                      color: isSelected ? c.color : T.textDim,
                      border: `1px solid ${isSelected ? c.color : T.borderSoft}`,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color }} />
                    {c.name} ({c.size})
                  </button>
                );
              })}
            </div>
            {activeCommunityFilter && (
              <button
                onClick={() => setActiveCommunityFilter(null)}
                style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10.5, background: T.panelAlt, color: T.textFaint, border: `1px solid ${T.borderSoft}`, cursor: 'pointer' }}
              >
                Reset Filter
              </button>
            )}
          </div>
        )}

        {algoMode === 'bridges' && bridgeData && (
          <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, background: 'rgba(17, 27, 38, 0.94)', backdropFilter: 'blur(10px)', border: `1px solid ${T.flag}55`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, zIndex: 25, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <GitFork size={15} color={T.flag} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.flag }}>Network Bottlenecks & Brokers:</span>
              </div>
              <span style={{ fontSize: 11.5, color: T.textDim }}>
                Identified <strong style={{ color: T.flag }}>{bridgeData.bridgeCount}</strong> critical bridge edges and <strong style={{ color: T.signal }}>{bridgeData.cutCount}</strong> articulation point gatekeepers.
              </span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: T.textFaint, fontWeight: 600 }}>Key Brokers:</span>
                {bridgeData.rankedBrokers.slice(0, 3).map(b => (
                  <span
                    key={b.id}
                    onClick={() => { setFocusId(b.id); setSelectedNode(null); }}
                    style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 4, background: T.flagDim, color: T.flag, border: `1px solid ${T.flag}44`, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--mono)' }}
                    title={`Betweenness: ${b.betweenness}, Degree: ${b.degree}`}
                  >
                    ⚡ {b.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedNode && entities[selectedNode] && (
          <NodePanel nodeKey={selectedNode} entities={entities} allEdges={allEdgesNorm} focusId={focusId}
            onClose={() => setSelectedNode(null)}
            onFocus={id => { setFocusId(id); setSelectedNode(null); setPositions({}); }}
            onSelectEdge={id => { setSelectedEdge(id); setSelectedNode(null); }} />
        )}
        {selectedEdge && !selectedNode && (
          <EdgePanel edgeId={selectedEdge} entities={entities} edges={visEdges} onClose={() => setSelectedEdge(null)} />
        )}
      </div>
    </div>
  );
}

function SpinnerSVG({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 18 18" style={{ animation: 'spin 0.9s linear infinite', flexShrink: 0 }}><circle cx="9" cy="9" r="7" fill="none" stroke="#3FC1C9" strokeWidth="2.5" strokeDasharray="30 14" strokeLinecap="round" /></svg>;
}

function NodePanel({ nodeKey, entities, allEdges, focusId, onClose, onFocus, onSelectEdge }) {
  const entity = entities[nodeKey]; if (!entity) return null;
  const S = ENTITY_STYLE[entity.type] || ENTITY_STYLE.PERSON;
  const isFocus = String(nodeKey) === String(focusId);
  const allConn = allEdges.filter(e => String(e.a) === String(nodeKey) || String(e.b) === String(nodeKey));
  const visConn = allConn.filter(e => entities[e.a] && entities[e.b]);
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 340, background: 'rgba(17,27,38,0.97)', backdropFilter: 'blur(12px)', borderLeft: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', zIndex: 30, boxShadow: '-10px 0 32px rgba(0,0,0,0.55)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + T.borderSoft, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: S.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid ' + S.color }}><S.icon size={14} color={S.color} /></div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: S.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{S.label}</div>
              {isFocus && <div style={{ fontSize: 10, color: T.signal, fontWeight: 600 }}>◉ Focus node</div>}
            </div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, lineHeight: 1.25, wordBreak: 'break-word' }}>{entity.name}</div>
          <div style={{ fontSize: 11, color: T.textFaint, fontFamily: 'var(--mono)', marginTop: 3 }}>{entity.id}</div>
          {entity.sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 5, lineHeight: 1.45 }}>{entity.sub}</div>}
        </div>
        <button onClick={onClose} style={{ color: T.textFaint, flexShrink: 0, marginTop: 2 }}><X size={15} /></button>
      </div>
      <div style={{ padding: '10px 16px', display: 'flex', gap: 8, borderBottom: '1px solid ' + T.borderSoft }}>
        {!isFocus && <button onClick={() => onFocus(nodeKey)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: T.signalDim, color: T.signal, border: '1px solid ' + T.signal + '55', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}><Crosshair size={12} /> Set as Focus</button>}
        <button onClick={onClose} style={{ flex: 1, padding: '6px 0', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: T.panelAlt, color: T.textDim, border: '1px solid ' + T.borderSoft }}>Dismiss</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Connections — {allConn.length} total ({visConn.length} visible)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {allConn.map(r => {
            const otherKey = String(r.a) === String(nodeKey) ? r.b : r.a;
            const other = entities[otherKey];
            const meta = REL_STYLE[r.type] || { label: r.type, color: T.textDim };
            const isVis = !!(entities[r.a] && entities[r.b]);
            return (
              <div key={r.id} onClick={() => isVis && onSelectEdge(r.id)} style={{ padding: '9px 11px', borderRadius: 7, background: isVis ? T.panelAlt : T.panel, border: '1px solid ' + (isVis ? T.border : T.borderSoft), cursor: isVis ? 'pointer' : 'default', opacity: isVis ? 1 : 0.55 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  <span style={{ fontSize: 10, color: T.textFaint, fontFamily: 'var(--mono)' }}>{r.confidence}%</span>
                </div>
                <div style={{ fontSize: 12, color: T.text, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ChevronRight size={11} color={T.textFaint} /> {other?.name || otherKey}
                </div>
                <div style={{ fontSize: 10.5, color: T.textFaint, marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--mono)' }}>{r.evidence}</span>
                  {r.count ? <span>{r.count}× occurrences</span> : null}
                  {r.amount ? <span style={{ color: T.ok, fontWeight: 600 }}>{r.amount}</span> : null}
                </div>
                {r.first ? <div style={{ fontSize: 10, color: T.textFaint, marginTop: 2 }}>{r.first} → {r.last}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid ' + T.borderSoft, fontSize: 10, color: T.textFaint, lineHeight: 1.4 }}>Analytical relevance only — not indicative of criminal culpability.</div>
    </div>
  );
}

function EdgePanel({ edgeId, entities, edges, onClose }) {
  const rel = edges.find(e => e.id === edgeId); if (!rel) return null;
  const A = entities[rel.a], B = entities[rel.b];
  const meta = REL_STYLE[rel.type] || { label: rel.type, color: T.signal };
  const Row = ({ label, value, mono, accent }) => value != null ? (
    <div style={{ padding: '9px 11px', background: T.panelAlt, borderRadius: 6, border: '1px solid ' + T.borderSoft }}>
      <div style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: accent || T.text, fontFamily: mono ? 'var(--mono)' : 'inherit' }}>{value}</div>
    </div>
  ) : null;
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 320, background: 'rgba(17,27,38,0.97)', backdropFilter: 'blur(12px)', borderLeft: '1px solid ' + T.border, display: 'flex', flexDirection: 'column', zIndex: 30, boxShadow: '-10px 0 32px rgba(0,0,0,0.55)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid ' + T.borderSoft, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 }}>Edge Inspection</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{meta.label}</div>
          <div style={{ fontSize: 11, color: T.textFaint, fontFamily: 'var(--mono)', marginTop: 3 }}>{A?.name || rel.a} ↔ {B?.name || rel.b}</div>
        </div>
        <button onClick={onClose} style={{ color: T.textFaint }}><X size={15} /></button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Row label="Evidence / Source" value={rel.evidence} mono accent={T.signal} />
        <Row label="Confidence Score" value={rel.confidence + '% — multi-source extraction'} accent={T.ok} />
        <Row label="Occurrences" value={rel.count ? rel.count + ' exchanges' : null} />
        <Row label="Transaction Value" value={rel.amount} accent={T.ok} />
        {rel.first ? <div style={{ padding: '9px 11px', background: T.panelAlt, borderRadius: 6, border: '1px solid ' + T.borderSoft }}><div style={{ fontSize: 10.5, color: T.textFaint, marginBottom: 2 }}>Date Range</div><div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{rel.first} → {rel.last}</div></div> : null}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid ' + T.borderSoft, fontSize: 10, color: T.textFaint, lineHeight: 1.4 }}>Legal notice: AI-derived linkage requiring human verification.</div>
    </div>
  );
}
