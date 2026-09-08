/**
 * graphAlgorithms.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides 3 core graph algorithms for criminal network intelligence analysis:
 *
 * 1. findShortestPath: Multi-hop shortest path (BFS/Dijkstra) with step-by-step
 *    relational audit and confidence scoring.
 * 2. detectCommunities: Label Propagation / Modularity clustering to uncover
 *    hidden criminal cells/syndicates.
 * 3. detectBridgesAndBrokers: Tarjan's Bridge & Articulation Point detection
 *    coupled with Brandes' Betweenness Centrality for vulnerability analysis.
 */

// ── Algorithm 1: Multi-Hop Shortest Path (BFS) ───────────────────────────────
export function findShortestPath(nodes, edges, sourceId, targetId) {
  if (!sourceId || !targetId || !nodes || nodes.length === 0) {
    return { found: false, pathNodeIds: [], pathEdgeIds: [], steps: [], hops: 0, confidence: 0 };
  }
  if (String(sourceId) === String(targetId)) {
    return { found: true, pathNodeIds: [String(sourceId)], pathEdgeIds: [], steps: [], hops: 0, confidence: 100 };
  }

  const sId = String(sourceId);
  const tId = String(targetId);

  // Build adjacency list
  const adj = {};
  nodes.forEach((n) => { adj[String(n.id)] = []; });
  edges.forEach((e) => {
    const a = String(e.a ?? e.source);
    const b = String(e.b ?? e.target);
    if (adj[a] && adj[b]) {
      adj[a].push({ neighbor: b, edge: e });
      adj[b].push({ neighbor: a, edge: e });
    }
  });

  const queue = [sId];
  const visited = new Set([sId]);
  const prev = {}; // node -> { fromNode, edge }

  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr === tId) break;

    for (const { neighbor, edge } of (adj[curr] || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        prev[neighbor] = { fromNode: curr, edge };
        queue.push(neighbor);
      }
    }
  }

  if (!prev[tId]) {
    return { found: false, pathNodeIds: [], pathEdgeIds: [], steps: [], hops: 0, confidence: 0 };
  }

  const pathNodeIds = [tId];
  const pathEdgeIds = [];
  const steps = [];
  let curr = tId;
  let totalConfidence = 1.0;

  while (curr !== sId) {
    const { fromNode, edge } = prev[curr];
    pathNodeIds.unshift(fromNode);
    pathEdgeIds.unshift(String(edge.id));
    const edgeConf = (edge.confidence || 85) / 100;
    totalConfidence *= edgeConf;

    steps.unshift({
      from: fromNode,
      to: curr,
      edge,
      type: edge.type || 'association',
      evidence: edge.evidence || '',
      confidence: edge.confidence || 85,
    });
    curr = fromNode;
  }

  return {
    found: true,
    pathNodeIds,
    pathEdgeIds,
    steps,
    hops: pathEdgeIds.length,
    confidence: Math.round(totalConfidence * 100),
  };
}

// ── Algorithm 2: Community Detection (Label Propagation) ─────────────────────
const COMMUNITY_PALETTES = [
  { color: '#3FC1C9', bg: '#0E3B3F', label: 'Primary Syndicate Cell' },
  { color: '#E8A33D', bg: '#4A3312', label: 'Financial & Assets Ring' },
  { color: '#7FB77E', bg: '#1E3C1E', label: 'Logistics & Transport Hub' },
  { color: '#B98CCE', bg: '#3D2847', label: 'Telephony & Comms Cluster' },
  { color: '#5B8DEF', bg: '#1E2F52', label: 'Field Operations Cell' },
  { color: '#E0645A', bg: '#471F1B', label: 'External / Counterparty Group' },
];

export function detectCommunities(nodes, edges) {
  if (!nodes || nodes.length === 0) {
    return { communities: [], nodeCommunityMap: {} };
  }

  const adj = {};
  nodes.forEach((n) => { adj[String(n.id)] = []; });
  edges.forEach((e) => {
    const a = String(e.a ?? e.source);
    const b = String(e.b ?? e.target);
    if (adj[a] && adj[b]) {
      adj[a].push(b);
      adj[b].push(a);
    }
  });

  // Seed initial labels
  const labels = {};
  nodes.forEach((n) => { labels[String(n.id)] = String(n.id); });

  // Deterministic seed iterations for stable layout
  for (let iter = 0; iter < 12; iter++) {
    let changed = false;
    for (const n of nodes) {
      const nid = String(n.id);
      const neighbors = adj[nid] || [];
      if (neighbors.length === 0) continue;

      const frequency = {};
      neighbors.forEach((nb) => {
        const l = labels[nb];
        frequency[l] = (frequency[l] || 0) + 1;
      });

      // Find label with highest frequency
      let bestLabel = labels[nid];
      let maxFreq = -1;
      Object.keys(frequency).sort().forEach((l) => {
        if (frequency[l] > maxFreq) {
          maxFreq = frequency[l];
          bestLabel = l;
        }
      });

      if (labels[nid] !== bestLabel) {
        labels[nid] = bestLabel;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Group nodes by community label
  const groups = {};
  Object.entries(labels).forEach(([nodeId, l]) => {
    if (!groups[l]) groups[l] = [];
    groups[l].push(nodeId);
  });

  // Map to structured communities sorted by size
  const sortedClusters = Object.values(groups).sort((a, b) => b.length - a.length);
  const communities = sortedClusters.map((members, idx) => {
    const palette = COMMUNITY_PALETTES[idx % COMMUNITY_PALETTES.length];
    return {
      id: `cluster_${idx + 1}`,
      name: `Cell ${idx + 1} (${palette.label})`,
      label: palette.label,
      color: palette.color,
      bg: palette.bg,
      nodeIds: members,
      size: members.length,
    };
  });

  const nodeCommunityMap = {};
  communities.forEach((c) => {
    c.nodeIds.forEach((nid) => {
      nodeCommunityMap[nid] = c;
    });
  });

  return { communities, nodeCommunityMap };
}

// ── Algorithm 3: Bridges & Articulation Points (Tarjan's DFS) ─────────────────
export function detectBridgesAndBrokers(nodes, edges) {
  if (!nodes || nodes.length === 0) {
    return {
      bridgeEdgeIds: new Set(),
      articulationNodeIds: new Set(),
      centralityScores: {},
      rankedBrokers: [],
      cutCount: 0,
      bridgeCount: 0,
    };
  }

  const adj = {};
  nodes.forEach((n) => { adj[String(n.id)] = []; });
  edges.forEach((e) => {
    const a = String(e.a ?? e.source);
    const b = String(e.b ?? e.target);
    const eid = String(e.id);
    if (adj[a] && adj[b]) {
      adj[a].push({ to: b, edgeId: eid });
      adj[b].push({ to: a, edgeId: eid });
    }
  });

  let timer = 0;
  const tin = {};
  const low = {};
  const visited = new Set();
  const bridgeEdgeIds = new Set();
  const articulationNodeIds = new Set();

  function dfs(u, pEdgeId = null) {
    visited.add(u);
    tin[u] = low[u] = ++timer;
    let children = 0;

    for (const { to, edgeId } of (adj[u] || [])) {
      if (edgeId === pEdgeId) continue;
      if (visited.has(to)) {
        low[u] = Math.min(low[u], tin[to]);
      } else {
        dfs(to, edgeId);
        low[u] = Math.min(low[u], low[to]);
        if (low[to] > tin[u]) {
          bridgeEdgeIds.add(edgeId);
        }
        if (low[to] >= tin[u] && pEdgeId !== null) {
          articulationNodeIds.add(u);
        }
        children++;
      }
    }
    if (pEdgeId === null && children > 1) {
      articulationNodeIds.add(u);
    }
  }

  nodes.forEach((n) => {
    const nid = String(n.id);
    if (!visited.has(nid)) {
      dfs(nid);
    }
  });

  // Calculate Brandes Betweenness Centrality for quantitative scoring
  const betweenness = {};
  nodes.forEach((n) => { betweenness[String(n.id)] = 0; });
  const nodeIds = nodes.map((n) => String(n.id));

  nodeIds.forEach((s) => {
    const stack = [];
    const pred = {};
    const sigma = {};
    const dist = {};
    nodeIds.forEach((v) => {
      pred[v] = [];
      sigma[v] = 0;
      dist[v] = -1;
    });

    sigma[s] = 1;
    dist[s] = 0;
    const queue = [s];

    while (queue.length > 0) {
      const v = queue.shift();
      stack.push(v);
      for (const { to: w } of (adj[v] || [])) {
        if (dist[w] < 0) {
          dist[w] = dist[v] + 1;
          queue.push(w);
        }
        if (dist[w] === dist[v] + 1) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }

    const delta = {};
    nodeIds.forEach((v) => { delta[v] = 0; });
    while (stack.length > 0) {
      const w = stack.pop();
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / (sigma[w] || 1)) * (1 + delta[w]);
      }
      if (w !== s) {
        betweenness[w] += delta[w];
      }
    }
  });

  // Normalize betweenness
  const nLen = nodeIds.length;
  const normFactor = nLen > 2 ? (nLen - 1) * (nLen - 2) : 1;
  const centralityScores = {};
  nodeIds.forEach((nid) => {
    const rawB = betweenness[nid] / 2; // undirected
    centralityScores[nid] = {
      betweenness: +(rawB / normFactor).toFixed(4),
      rawBetweenness: +rawB.toFixed(1),
      degree: (adj[nid] || []).length,
      isArticulationPoint: articulationNodeIds.has(nid),
    };
  });

  // Ranked brokers list
  const rankedBrokers = nodes
    .map((n) => {
      const nid = String(n.id);
      const cs = centralityScores[nid] || { betweenness: 0, degree: 0, isArticulationPoint: false };
      return {
        id: nid,
        name: n.name || nid,
        type: n.type || 'PERSON',
        betweenness: cs.betweenness,
        rawBetweenness: cs.rawBetweenness,
        degree: cs.degree,
        isBroker: cs.isArticulationPoint || cs.betweenness > 0.1,
      };
    })
    .sort((a, b) => b.betweenness - a.betweenness || b.degree - a.degree);

  return {
    bridgeEdgeIds,
    articulationNodeIds,
    centralityScores,
    rankedBrokers,
    bridgeCount: bridgeEdgeIds.size,
    cutCount: articulationNodeIds.size,
  };
}
