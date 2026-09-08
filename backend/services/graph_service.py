from typing import Dict, List, Any, Optional
import networkx as nx
from backend.data_loader import loader
from backend.db.neo4j_client import neo4j_client

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
            return {"bridges": [], "communities": []}

        # 1. Detect bridges
        bridges = []
        if not G.is_directed():
            try:
                for u, v in nx.bridges(G):
                    bridges.append({"source": u, "target": v, "type": "bridge_link"})
            except Exception:
                pass

        # 2. Communities (greedy modularity communities)
        communities_out = []
        try:
            from networkx.algorithms.community import greedy_modularity_communities
            comms = greedy_modularity_communities(G)
            for i, comm in enumerate(comms):
                communities_out.append({
                    "id": f"cluster-{i+1}",
                    "name": f"Cluster {i+1}",
                    "nodes": list(comm),
                    "size": len(comm),
                })
        except Exception:
            pass

        return {
            "bridges": bridges,
            "communities": communities_out,
        }

    def get_subgraph(
        self, case_id: Optional[str] = None, center_id: Optional[str] = None, hops: int = 2
    ) -> Dict[str, Any]:
        # 1. Try querying Neo4j if live
        if neo4j_client.is_connected:
            neo_res = neo4j_client.get_subgraph(case_id=case_id, center_id=center_id, hops=hops)
            if neo_res and neo_res.get("nodes"):
                neo_res["storage"] = "neo4j"
                return neo_res

        # 2. Fallback to in-memory NetworkX case graph
        G = self.get_case_graph(case_id)
        if G.number_of_nodes() == 0:
            return {"nodes": [], "edges": [], "storage": "networkx"}

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
            # If no center node specified, take largest connected component up to 45 nodes for crisp UI rendering
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

        return {"nodes": nodes_list, "edges": edges_list, "storage": "networkx"}

    def shortest_path(self, source_id: str, target_id: str, case_id: Optional[str] = None) -> Dict[str, Any]:
        # 1. Try Neo4j if live
        if neo4j_client.is_connected:
            neo_path = neo4j_client.shortest_path(source_id=source_id, target_id=target_id, case_id=case_id)
            if neo_path.get("found"):
                neo_path["storage"] = "neo4j"
                return neo_path

        # 2. Fallback to NetworkX
        G = self.get_case_graph(case_id)
        if not G.has_node(source_id) or not G.has_node(target_id):
            return {"path": [], "length": -1, "found": False, "storage": "networkx"}

        try:
            path = nx.shortest_path(G, source=source_id, target=target_id)
            details = [
                {"id": n, "name": G.nodes.get(n, {}).get("name", n), "type": G.nodes.get(n, {}).get("type", "UNKNOWN")}
                for n in path
            ]
            return {"path": details, "length": len(path) - 1, "found": True, "storage": "networkx"}
        except nx.NetworkXNoPath:
            return {"path": [], "length": -1, "found": False, "storage": "networkx"}

graph_service = GraphService()
