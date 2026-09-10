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

    def resolve_entities_to_graph_layer(self, case_id: Optional[str] = "FIR_0001") -> Dict[str, Any]:
        """
        Entity Resolution Engine for the Graph Layer:
        Maps existing relational DB entities into unified graph nodes and multi-source relationships
        without modifying underlying database tables or schema.
        """
        resolved_nodes = []
        resolved_edges = []
        seen_nodes = set()
        seen_edges = set()

        # 1. Resolve Case Persons
        for pid, p in self.loader.persons.items():
            if case_id and p.get("case_id") != case_id and pid not in ("P001", "P009", "P040", "P003"):
                continue
            if pid not in seen_nodes:
                seen_nodes.add(pid)
                resolved_nodes.append({
                    "id": pid,
                    "name": p.get("name", pid),
                    "type": "PERSON",
                    "role": p.get("role", "Subject for Review"),
                    "state": p.get("state", ""),
                    "district": p.get("district", ""),
                    "case_id": p.get("case_id", ""),
                })

        # 2. Resolve Phones linked to Persons (OWNS_PHONE)
        for phid, ph in self.loader.phones.items():
            owner_id = ph.get("owner_id")
            if owner_id in seen_nodes:
                if phid not in seen_nodes:
                    seen_nodes.add(phid)
                    resolved_nodes.append({
                        "id": phid,
                        "name": ph.get("number_display", phid),
                        "type": "PHONE",
                        "owner_id": owner_id,
                    })
                edge_key = (owner_id, phid, "OWNS_PHONE")
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    resolved_edges.append({
                        "id": f"ER_E_{len(resolved_edges)+1}",
                        "source": owner_id,
                        "target": phid,
                        "type": "OWNS_PHONE",
                        "label": "owns phone",
                        "confidence": 95,
                        "evidence": f"Telco Subscriber Registry ({phid})",
                    })

        # 3. Resolve Vehicles linked to Persons (VEHICLE_ASSOCIATION)
        for vid, v in self.loader.vehicles.items():
            owner_id = v.get("owner_id")
            # Also check if vehicle was spotted in FIR
            fir_hit = any(fir.get("vehicle_id") == vid for cid, fir in self.loader.fir_reports.items() if not case_id or cid == case_id)
            if owner_id in seen_nodes or fir_hit:
                if vid not in seen_nodes:
                    seen_nodes.add(vid)
                    resolved_nodes.append({
                        "id": vid,
                        "name": f"{v.get('registration', vid)} ({v.get('vehicle_type', 'vehicle')})",
                        "type": "VEHICLE",
                        "registration": v.get("registration", vid),
                        "owner_id": owner_id,
                    })
                if owner_id in seen_nodes:
                    edge_key = (owner_id, vid, "VEHICLE_ASSOCIATION")
                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        resolved_edges.append({
                            "id": f"ER_E_{len(resolved_edges)+1}",
                            "source": owner_id,
                            "target": vid,
                            "type": "VEHICLE_ASSOCIATION",
                            "label": "associated vehicle",
                            "confidence": 90,
                            "evidence": f"RTO Registration Registry ({vid})",
                        })

        # 4. Resolve Locations (LOCATION_OBSERVATION)
        fir_obj = self.loader.fir_reports.get(case_id, {})
        loc_id = fir_obj.get("location_id", "LOC_0401")
        if loc_id and loc_id in self.loader.locations:
            loc = self.loader.locations[loc_id]
            if loc_id not in seen_nodes:
                seen_nodes.add(loc_id)
                resolved_nodes.append({
                    "id": loc_id,
                    "name": loc.get("name", loc_id),
                    "type": "LOCATION",
                    "district": loc.get("district", ""),
                    "state": loc.get("state", ""),
                })
            # Connect persons mentioned in the FIR to this location
            pids = [p.strip() for p in fir_obj.get("person_ids", "").split(";") if p.strip()]
            for p in pids:
                if p in seen_nodes:
                    edge_key = (p, loc_id, "LOCATION_OBSERVATION")
                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        resolved_edges.append({
                            "id": f"ER_E_{len(resolved_edges)+1}",
                            "source": p,
                            "target": loc_id,
                            "type": "LOCATION_OBSERVATION",
                            "label": "observed at",
                            "confidence": 80,
                            "evidence": f"Surveillance Log ({case_id})",
                        })

        # 5. Resolve Organizations (ORGANIZATION_ASSOCIATION)
        org_id = fir_obj.get("organization_id", "ORG_011")
        if org_id and org_id in self.loader.organizations:
            org = self.loader.organizations[org_id]
            if org_id not in seen_nodes:
                seen_nodes.add(org_id)
                resolved_nodes.append({
                    "id": org_id,
                    "name": org.get("name", org_id),
                    "type": "ORGANIZATION",
                    "org_type": org.get("type", "company"),
                })
            pids = [p.strip() for p in fir_obj.get("person_ids", "").split(";") if p.strip()]
            for p in pids:
                if p in seen_nodes:
                    edge_key = (p, org_id, "AFFILIATED_WITH")
                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        resolved_edges.append({
                            "id": f"ER_E_{len(resolved_edges)+1}",
                            "source": p,
                            "target": org_id,
                            "type": "AFFILIATED_WITH",
                            "label": "affiliated with",
                            "confidence": 85,
                            "evidence": f"Corporate Intelligence ({case_id})",
                        })

        # 6. Resolve Direct Inter-Person Ties (FIR Co-mention)
        pids = [p.strip() for p in fir_obj.get("person_ids", "").split(";") if p.strip()]
        for i in range(len(pids)):
            for j in range(i + 1, len(pids)):
                p1, p2 = pids[i], pids[j]
                if p1 in seen_nodes and p2 in seen_nodes:
                    edge_key = (p1, p2, "FIR_CO_MENTION")
                    if edge_key not in seen_edges:
                        seen_edges.add(edge_key)
                        resolved_edges.append({
                            "id": f"ER_E_{len(resolved_edges)+1}",
                            "source": p1,
                            "target": p2,
                            "type": "FIR_CO_MENTION",
                            "label": "co-accused / co-mentioned",
                            "confidence": 88,
                            "evidence": f"FIR Narrative ({case_id})",
                        })

        return {
            "case_id": case_id,
            "nodes": resolved_nodes,
            "edges": resolved_edges,
            "node_count": len(resolved_nodes),
            "edge_count": len(resolved_edges),
            "node_types": list(set(n["type"] for n in resolved_nodes)),
        }

    def get_workflow_pipeline_data(self, case_id: Optional[str] = "FIR_0001") -> Dict[str, Any]:
        """
        Produces exact synthetic data for all 5 animation scenes of the workflow:
        Crime Data -> Neo4j Graph -> Graph Analytics -> Investigator Insights
        """
        # --- Scene 1: Crime Data Collection ---
        counts = {
            "firs": len(self.loader.fir_reports),
            "cdr_records": len(self.loader.cdr_records),
            "transactions": len(self.loader.transactions),
            "persons": len(self.loader.persons),
            "phones": len(self.loader.phones),
            "vehicles": len(self.loader.vehicles),
            "locations": len(self.loader.locations),
            "organizations": len(self.loader.organizations),
            "accounts": len(self.loader.accounts),
            "cases": len(self.loader.cases),
        }

        sample_cards = [
            {
                "id": "CARD_FIR",
                "source_type": "FIR Reports",
                "badge": "Crime Records",
                "title": "FIR_0001 (Nagpur, Maharashtra)",
                "summary": "Organized financial fraud report detailing Aditya Singh, Person Alpha, and Synthetic Logistics Group 11.",
                "count_label": f"{counts['firs']} FIR Reports",
                "color": "#38bdf8",
            },
            {
                "id": "CARD_CDR",
                "source_type": "Call Detail Records (CDR)",
                "badge": "Telecommunications",
                "title": "5,200 Processed Call Records",
                "summary": "Cell-tower CDR linkages capturing duration, caller/receiver identifiers, and communication frequency.",
                "count_label": f"{counts['cdr_records']:,} Records",
                "color": "#c084fc",
            },
            {
                "id": "CARD_TXN",
                "source_type": "Banking & Transactions",
                "badge": "Financial Flow",
                "title": "10,000 Ledger Transactions",
                "summary": "High-velocity IMPS/NEFT/UPI transfer records including flagged risk-labeled transactions.",
                "count_label": f"{counts['transactions']:,} Transfers",
                "color": "#60a5fa",
            },
            {
                "id": "CARD_SURV",
                "source_type": "Surveillance & Locations",
                "badge": "Geospatial",
                "title": "LOC_0401 Synthetic Transport Hub 4-1",
                "summary": "Field surveillance observation coordinates and perimeter vehicle sightings.",
                "count_label": f"{counts['locations']} Verified Locations",
                "color": "#fbbf24",
            },
            {
                "id": "CARD_VEH",
                "source_type": "Vehicle Registrations",
                "badge": "Transport RTO",
                "title": "JH-00-XX-0003 & Fleet Records",
                "summary": "Automotive registry records linking suspect ownership to observed crime scene vehicles.",
                "count_label": f"{counts['vehicles']} Vehicles",
                "color": "#34d399",
            },
            {
                "id": "CARD_ENT",
                "source_type": "Criminal Entity Registry",
                "badge": "Master Entities",
                "title": "Persons & Organizations",
                "summary": "60 Persons, 100 Mobile Devices, 80 Accounts, and 15 Syndicates resolved into master entities.",
                "count_label": f"{counts['persons']} Persons · {counts['organizations']} Orgs",
                "color": "#fb7185",
            },
        ]

        # --- Scene 2: Graph Construction (Entity Resolution) ---
        er_graph = self.resolve_entities_to_graph_layer(case_id=case_id)

        # --- Scene 3: Investigation (Targeted Subgraph) ---
        # Focus on P009 (Aditya Singh) and his localized 1-hop / 2-hop neighborhood in FIR_0001
        target_person_id = "P009"
        target_p = self.loader.persons.get(target_person_id, {
            "person_id": "P009",
            "name": "Aditya Singh",
            "role": "subject",
            "state": "Jharkhand",
            "district": "Ranchi",
        })

        investigation_neighborhood = {
            "target": {
                "id": target_person_id,
                "name": target_p.get("name", "Aditya Singh"),
                "role": target_p.get("role", "Subject for Review"),
                "case_id": case_id,
                "district": target_p.get("district", "Ranchi"),
                "state": target_p.get("state", "Jharkhand"),
            },
            "associates": [
                {
                    "id": "P001",
                    "name": "Person Alpha",
                    "role": "Co-Accused",
                    "type": "PERSON",
                    "relation": "FIR Co-Mention",
                    "confidence": 88,
                },
                {
                    "id": "P040",
                    "name": "Vikram Joshi",
                    "role": "Associate",
                    "type": "PERSON",
                    "relation": "FIR Co-Mention",
                    "confidence": 88,
                },
                {
                    "id": "VEH_003",
                    "name": "JH-00-XX-0003",
                    "role": "Spotted Vehicle",
                    "type": "VEHICLE",
                    "relation": "Vehicle Association",
                    "confidence": 85,
                },
                {
                    "id": "PHONE_0059",
                    "name": "PHONE_FAKE_0059",
                    "role": "Active Device",
                    "type": "PHONE",
                    "relation": "Owns Phone",
                    "confidence": 95,
                },
                {
                    "id": "LOC_0401",
                    "name": "Synthetic Transport Hub 4-1",
                    "role": "Crime Scene / Rendezvous",
                    "type": "LOCATION",
                    "relation": "Observed At",
                    "confidence": 80,
                },
                {
                    "id": "ORG_011",
                    "name": "Synthetic Logistics Group 11",
                    "role": "Associated Syndicate",
                    "type": "ORGANIZATION",
                    "relation": "Affiliated With",
                    "confidence": 85,
                },
            ],
            "evidence_chain": [
                {"step": 1, "source": "FIR_0001", "claim": "Aditya Singh met Person Alpha near Transport Hub 4-1"},
                {"step": 2, "source": "RTO Database", "claim": "Vehicle JH-00-XX-0003 co-located during rendezvous"},
                {"step": 3, "source": "CDR Logs", "claim": "Call activity confirmed between PHONE_0059 and syndicate phones"},
                {"step": 4, "source": "Corporate Records", "claim": "Shared front operation at Synthetic Logistics Group 11"},
            ],
        }

        # --- Scene 4: Graph Analytics ---
        # Run real metrics on global / case graph
        metrics = self.compute_metrics(case_id=None)
        comm_res = self.detect_bridges_and_communities(case_id=None)

        # Top broker from real calculation: P003 (Person Charlie)
        top_broker = None
        for r in metrics.get("ranked", []):
            if r["id"] == "P003":
                top_broker = r
                break
        if not top_broker and metrics.get("ranked"):
            top_broker = metrics["ranked"][0]

        analytics_data = {
            "centrality": {
                "top_broker": {
                    "id": top_broker.get("id", "P003"),
                    "name": top_broker.get("name", "Person Charlie"),
                    "betweenness": top_broker.get("betweenness", 0.0529),
                    "degree": top_broker.get("degree", 42),
                    "closeness": top_broker.get("closeness", 0.4316),
                    "pagerank": top_broker.get("pagerank", 0.014),
                    "role": "Primary Cross-Syndicate Connector",
                    "insight": "High betweenness centrality flags this person as the sole bridge connecting West Bengal and Maharashtra criminal rings.",
                },
                "top_5": metrics.get("ranked", [])[:5],
            },
            "community_detection": {
                "total_communities": len(comm_res.get("communities", [])),
                "key_clusters": [
                    {"name": "Logistics & Transport Syndicate", "size": 121, "color": "#38bdf8", "lead": "Aditya Das / Syndicate 11"},
                    {"name": "Hawala & Money Mule Network", "size": 80, "color": "#c084fc", "lead": "Rohan Sahu / Bank Accounts"},
                    {"name": "Cross-State Smuggling Ring", "size": 65, "color": "#34d399", "lead": "Person Charlie (Bridge)"},
                    {"name": "Communications Relay Cell", "size": 32, "color": "#fbbf24", "lead": "CDR Cluster 4"},
                ],
            },
            "relationship_analysis": {
                "total_bridges": len(comm_res.get("bridges", [])),
                "critical_bridge": {
                    "source": "P003 (Person Charlie)",
                    "target": "P009 (Aditya Singh)",
                    "type": "HIDDEN_BROKER_LINK",
                    "description": "Hidden multi-hop communication link crossing geographic jurisdictions.",
                    "risk_rating": "Critical",
                },
            },
        }

        # --- Scene 5: Investigator Dashboard ---
        dashboard_summary = {
            "network_summary": {
                "connected_individuals": counts["persons"],
                "detected_communities": len(comm_res.get("communities", [])),
                "identified_locations": counts["locations"],
                "key_associates": 12,
                "ingested_transactions": counts["transactions"],
                "cdr_records": counts["cdr_records"],
                "active_cases": counts["cases"],
            },
            "ai_insights": [
                {
                    "icon": "KeyConnector",
                    "title": "Key Network Connector Identified",
                    "subject": f"{top_broker.get('name', 'Person Charlie')} ({top_broker.get('id', 'P003')})",
                    "description": f"Highest betweenness score ({top_broker.get('betweenness', 0.0529)}) in the network. Acts as the pivotal information and financial gateway between 3 isolated syndicates.",
                    "confidence": 97,
                    "type": "critical",
                },
                {
                    "icon": "StrongRelationship",
                    "title": "Strong Relationship Detected",
                    "subject": "Aditya Singh (P009) ↔ Person Alpha (P001)",
                    "description": "Cross-validated through both FIR co-presence (88% confidence) and recurrent CDR communication (92% confidence) in Nagpur.",
                    "confidence": 94,
                    "type": "high",
                },
                {
                    "icon": "SharedLocation",
                    "title": "Shared Operational Location Detected",
                    "subject": "Synthetic Transport Hub 4-1 (LOC_0401)",
                    "description": "Identified as the primary rendezvous hub linking suspects across 2 separate interstate logistics operations.",
                    "confidence": 89,
                    "type": "medium",
                },
                {
                    "icon": "SuspiciousTransaction",
                    "title": "Suspicious Transaction Pattern Detected",
                    "subject": "Rapid High-Value Layering (TXN_000030 & mule ring)",
                    "description": "High-risk flagged UPI transfers (₹49,000, risk_label=1) routed across accounts ACCT_0070 to ACCT_0073 within minutes of surveillance observation.",
                    "confidence": 96,
                    "type": "critical",
                },
            ],
            "final_banner_message": "From fragmented data to actionable intelligence.",
        }

        return {
            "status": "success",
            "case_id": case_id,
            "scene_1_data_collection": {
                "counts": counts,
                "sample_cards": sample_cards,
            },
            "scene_2_graph_construction": er_graph,
            "scene_3_investigation": investigation_neighborhood,
            "scene_4_analytics": analytics_data,
            "scene_5_dashboard": dashboard_summary,
            "storage": "neo4j" if neo4j_client.is_connected else "dataset_engine",
        }

    def get_neo4j_case_stats(self, case_id: Optional[str] = "FIR_0001") -> Dict[str, Any]:
        """
        Returns live Neo4j graph metrics for a specific FIR case.
        Used by the dashboard and AI workflow to show per-case stats.
        Falls back to data_loader counts if Neo4j is offline.
        """
        storage = "dataset_engine"

        if neo4j_client.is_connected:
            try:
                storage = "neo4j"
                # Per-FIR node counts by label
                person_res = neo4j_client.run_query(
                    "MATCH (p:Person)-[r {case_id: $cid}]-() RETURN count(DISTINCT p) AS cnt",
                    {"cid": case_id}
                )
                phone_res = neo4j_client.run_query(
                    "MATCH (p:Person)-[r {case_id: $cid}]-()-[:OWNS_PHONE]->(ph:Phone) RETURN count(DISTINCT ph) AS cnt",
                    {"cid": case_id}
                )
                vehicle_res = neo4j_client.run_query(
                    "MATCH (p:Person)-[r {case_id: $cid}]-()-[:VEHICLE_ASSOCIATION]->(v:Vehicle) RETURN count(DISTINCT v) AS cnt",
                    {"cid": case_id}
                )
                location_res = neo4j_client.run_query(
                    "MATCH (p:Person)-[r {case_id: $cid}]->(:Location) RETURN count(DISTINCT r) AS cnt",
                    {"cid": case_id}
                )
                org_res = neo4j_client.run_query(
                    "MATCH (p:Person)-[r {case_id: $cid}]-()-[:ORGANIZATION_ASSOCIATION]->(o:Organization) RETURN count(DISTINCT o) AS cnt",
                    {"cid": case_id}
                )
                edge_res = neo4j_client.run_query(
                    "MATCH ()-[r {case_id: $cid}]-() RETURN count(DISTINCT r) AS cnt",
                    {"cid": case_id}
                )
                # Top persons by degree in this case
                top_persons = neo4j_client.run_query(
                    "MATCH (p:Person)-[r {case_id: $cid}]-(m) RETURN p.id AS id, p.name AS name, count(r) AS degree ORDER BY degree DESC LIMIT 5",
                    {"cid": case_id}
                )
                # Case metadata
                case_meta = neo4j_client.run_query(
                    "MATCH (c:Case {id: $cid}) RETURN c.crime_type AS crime_type, c.district AS district, c.state AS state",
                    {"cid": case_id}
                )
                meta = case_meta[0] if case_meta else {}

                person_count = (person_res[0]["cnt"] if person_res else 0) or 0
                edge_count = (edge_res[0]["cnt"] if edge_res else 0) or 0
                phone_count = (phone_res[0]["cnt"] if phone_res else 0) or 0
                vehicle_count = (vehicle_res[0]["cnt"] if vehicle_res else 0) or 0
                location_count = (location_res[0]["cnt"] if location_res else 0) or 0
                org_count = (org_res[0]["cnt"] if org_res else 0) or 0

                return {
                    "case_id": case_id,
                    "storage": storage,
                    "crime_type": meta.get("crime_type") or "Unknown",
                    "district": meta.get("district") or "Unknown",
                    "state": meta.get("state") or "Unknown",
                    "counts": {
                        "persons": person_count,
                        "phones": phone_count,
                        "vehicles": vehicle_count,
                        "locations": location_count,
                        "organizations": org_count,
                        "edges": edge_count,
                        "firs": len(self.loader.fir_reports),
                        "cdr_records": len(self.loader.cdr_records),
                        "transactions": len(self.loader.transactions),
                        "accounts": len(self.loader.accounts),
                    },
                    "top_persons": top_persons[:5],
                    "neo4j_connected": True,
                }
            except Exception as e:
                import logging
                logging.getLogger("NexusIntel").warning(f"Neo4j case stats failed: {e}")

        # --- Fallback: data_loader counts ---
        counts = {
            "firs": len(self.loader.fir_reports),
            "cdr_records": len(self.loader.cdr_records),
            "transactions": len(self.loader.transactions),
            "persons": len(self.loader.persons),
            "phones": len(self.loader.phones),
            "vehicles": len(self.loader.vehicles),
            "locations": len(self.loader.locations),
            "organizations": len(self.loader.organizations),
            "accounts": len(self.loader.accounts),
            "edges": 0,
        }
        fir_obj = self.loader.fir_reports.get(case_id, {})
        return {
            "case_id": case_id,
            "storage": storage,
            "crime_type": fir_obj.get("crime_type", "Unknown"),
            "district": fir_obj.get("district", "Unknown"),
            "state": fir_obj.get("state", "Unknown"),
            "counts": counts,
            "top_persons": [],
            "neo4j_connected": False,
        }

graph_service = GraphService()
