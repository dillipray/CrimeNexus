from typing import Dict, List, Any, Optional
import networkx as nx
from backend.data_loader import loader

class GraphService:
    def __init__(self, data_loader=loader):
        self.loader = data_loader

    def get_case_graph(self, case_id: Optional[str] = None) -> nx.Graph:
        if case_id and case_id in self.loader.case_graphs:
            cg = self.loader.case_graphs[case_id]
            if cg.number_of_nodes() > 0:
                return cg
        return self.loader.graph

    def compute_metrics(self, case_id: Optional[str] = None) -> Dict[str, Any]:
        G = self.get_case_graph(case_id)
        if G.number_of_nodes() == 0:
            return {"degree": {}, "closeness": {}, "betweenness": {}, "pagerank": {}, "ranked": []}

        # 1. Degree
        degrees = dict(G.degree())

        # 2. Closeness
        closeness = nx.closeness_centrality(G)
        closeness = {k: round(v, 4) for k, v in closeness.items()}

        # 3. Betweenness (Brandes)
        betweenness = nx.betweenness_centrality(G, normalized=True)
        betweenness = {k: round(v, 4) for k, v in betweenness.items()}

        # 4. PageRank
        try:
            pagerank = nx.pagerank(G, alpha=0.85, max_iter=100)
            pagerank = {k: round(v, 4) for k, v in pagerank.items()}
        except Exception:
            pagerank = {k: 0.0 for k in G.nodes()}

        # Ranked list of entities by betweenness
        ranked = []
        for node_id, b_score in sorted(betweenness.items(), key=lambda x: x[1], reverse=True):
            attrs = G.nodes.get(node_id, {})
            ranked.append({
                "id": node_id,
                "name": attrs.get("name", node_id),
                "type": attrs.get("type", "UNKNOWN"),
                "degree": degrees.get(node_id, 0),
                "betweenness": b_score,
                "closeness": closeness.get(node_id, 0),
                "pagerank": pagerank.get(node_id, 0),
            })

        return {
            "degree": degrees,
            "closeness": closeness,
            "betweenness": betweenness,
            "pagerank": pagerank,
            "ranked": ranked,
        }

    def detect_bridges_and_communities(self, case_id: Optional[str] = None) -> Dict[str, Any]:
        G = self.get_case_graph(case_id)
        if G.number_of_nodes() == 0:
            return {"bridges": [], "components": []}

        # Connected components in current graph
        components = [list(c) for c in nx.connected_components(G)]

        # Bridge edges in current graph
        bridge_edges = list(nx.bridges(G))
        formatted_bridges = []
        for u, v in bridge_edges:
            data = G.get_edge_data(u, v, default={})
            u_name = G.nodes.get(u, {}).get("name", u)
            v_name = G.nodes.get(v, {}).get("name", v)
            formatted_bridges.append({
                "source": u,
                "source_name": u_name,
                "target": v,
                "target_name": v_name,
                "type": data.get("type", "link"),
                "evidence": data.get("evidence", "EVD-UNKNOWN"),
            })

        return {
            "component_count": len(components),
            "components": [
                [{"id": n, "name": G.nodes.get(n, {}).get("name", n), "type": G.nodes.get(n, {}).get("type", "UNKNOWN")} for n in comp]
                for comp in sorted(components, key=len, reverse=True)[:5]
            ],
            "bridges": formatted_bridges[:10],
        }

    def get_subgraph(self, case_id: Optional[str] = None, center_id: Optional[str] = None, hops: int = 2) -> Dict[str, Any]:
        G = self.get_case_graph(case_id)
        if G.number_of_nodes() == 0:
            return {"nodes": [], "edges": []}

        if center_id and G.has_node(center_id):
            sub_nodes = set([center_id])
            current_level = set([center_id])
            for _ in range(hops):
                next_level = set()
                for n in current_level:
                    next_level.update(G.neighbors(n))
                sub_nodes.update(next_level)
                current_level = next_level
            subG = G.subgraph(sub_nodes)
        else:
            # If no center node specified, take largest connected component up to 40 nodes for crisp UI rendering
            components = sorted(nx.connected_components(G), key=len, reverse=True)
            if components:
                nodes_sample = list(components[0])[:45]
                subG = G.subgraph(nodes_sample)
            else:
                subG = G

        nodes_list = []
        for n, data in subG.nodes(data=True):
            nodes_list.append({
                "id": n,
                "name": data.get("name", n),
                "type": data.get("type", "PERSON"),
                "role": data.get("role", "Subject for Review"),
                "sub": f"{data.get('type', 'Entity')} · {n}",
            })

        edges_list = []
        for i, (u, v, data) in enumerate(subG.edges(data=True)):
            edges_list.append({
                "id": f"E-{i+1}",
                "source": u,
                "target": v,
                "type": data.get("type", "association"),
                "evidence": data.get("evidence", f"EVD-{i+1}"),
                "confidence": data.get("confidence", 85),
                "count": data.get("count", 1),
                "amount": data.get("amount"),
            })

        return {"nodes": nodes_list, "edges": edges_list}

    def shortest_path(self, source_id: str, target_id: str, case_id: Optional[str] = None) -> Dict[str, Any]:
        G = self.get_case_graph(case_id)
        if not G.has_node(source_id) or not G.has_node(target_id):
            return {"path": [], "length": -1, "found": False}

        try:
            path = nx.shortest_path(G, source=source_id, target=target_id)
            details = [
                {"id": n, "name": G.nodes.get(n, {}).get("name", n), "type": G.nodes.get(n, {}).get("type", "UNKNOWN")}
                for n in path
            ]
            return {"path": details, "length": len(path) - 1, "found": True}
        except nx.NetworkXNoPath:
            return {"path": [], "length": -1, "found": False}

graph_service = GraphService()
