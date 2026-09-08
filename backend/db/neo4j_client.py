import logging
from typing import Dict, List, Any, Optional
from backend.db.config import NEO4J_URI, NEO4J_USER, NEO4J_PASS

logger = logging.getLogger("NexusIntel.Neo4j")

try:
    from neo4j import GraphDatabase, basic_auth
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False
    logger.warning("neo4j driver is not installed. Neo4j features will be disabled.")

class Neo4jClient:
    def __init__(self, uri: str = NEO4J_URI, user: str = NEO4J_USER, password: str = NEO4J_PASS):
        self.uri = uri
        self.user = user
        self.password = password
        self.driver = None
        self._is_connected: Optional[bool] = None
        self._init_driver()

    def _init_driver(self):
        if not NEO4J_AVAILABLE:
            return
        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=basic_auth(self.user, self.password),
                connection_timeout=3.0,
                max_connection_lifetime=300,
            )
        except Exception as e:
            logger.warning(f"Neo4j driver init notice: {e}")

    def check_connection(self) -> bool:
        """Check if Neo4j instance is alive and reachable via Bolt."""
        if not self.driver or not NEO4J_AVAILABLE:
            return False
        try:
            self.driver.verify_connectivity()
            self._is_connected = True
            return True
        except Exception as e:
            logger.debug(f"Neo4j connectivity check failed: {e}")
            self._is_connected = False
            return False

    @property
    def is_connected(self) -> bool:
        if self._is_connected is None:
            return self.check_connection()
        return self._is_connected

    def close(self):
        if self.driver:
            self.driver.close()

    def init_constraints(self):
        """Set up uniqueness constraints for core entity nodes."""
        if not self.check_connection():
            raise ConnectionError(f"Cannot connect to Neo4j at {self.uri}")

        constraints = [
            "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
            "CREATE CONSTRAINT phone_id IF NOT EXISTS FOR (ph:Phone) REQUIRE ph.id IS UNIQUE",
            "CREATE CONSTRAINT account_id IF NOT EXISTS FOR (a:Account) REQUIRE a.id IS UNIQUE",
            "CREATE CONSTRAINT vehicle_id IF NOT EXISTS FOR (v:Vehicle) REQUIRE v.id IS UNIQUE",
            "CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE",
            "CREATE CONSTRAINT org_id IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE",
            "CREATE CONSTRAINT case_id IF NOT EXISTS FOR (c:Case) REQUIRE c.id IS UNIQUE",
        ]
        with self.driver.session() as session:
            for q in constraints:
                try:
                    session.run(q)
                except Exception as e:
                    logger.debug(f"Constraint setup warning for query '{q}': {e}")
        logger.info("Neo4j node uniqueness constraints verified.")

    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Run a Cypher query and return records as dictionaries."""
        if not self.is_connected:
            return []
        with self.driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]

    def get_subgraph(
        self, case_id: Optional[str] = None, center_id: Optional[str] = None, hops: int = 2
    ) -> Dict[str, Any]:
        """Fetch subgraph nodes and edges from Neo4j."""
        if not self.is_connected:
            return {"nodes": [], "edges": []}

        try:
            with self.driver.session() as session:
                if center_id:
                    cypher = f"""
                    MATCH path = (c {{id: $center_id}})-[r*1..{hops}]-(m)
                    {"WHERE all(rel IN r WHERE rel.case_id = $case_id)" if case_id else ""}
                    UNWIND nodes(path) AS n
                    UNWIND relationships(path) AS rel
                    RETURN collect(DISTINCT n) AS nodes, collect(DISTINCT rel) AS edges
                    """
                    params = {"center_id": center_id, "case_id": case_id}
                elif case_id:
                    cypher = """
                    MATCH (n)-[r {case_id: $case_id}]-(m)
                    RETURN collect(DISTINCT n) + collect(DISTINCT m) AS nodes, collect(DISTINCT r) AS edges
                    LIMIT 100
                    """
                    params = {"case_id": case_id}
                else:
                    cypher = """
                    MATCH (n)-[r]->(m)
                    RETURN collect(DISTINCT n) + collect(DISTINCT m) AS nodes, collect(DISTINCT r) AS edges
                    LIMIT 60
                    """
                    params = {}

                result = session.run(cypher, params)
                record = result.single()
                if not record:
                    return {"nodes": [], "edges": []}

                raw_nodes = record.get("nodes", []) or []
                raw_edges = record.get("edges", []) or []

                # Format for frontend React UI
                nodes_out = []
                seen_nodes = set()
                for node in raw_nodes:
                    nid = node.get("id") or str(getattr(node, "id", ""))
                    if not nid or nid in seen_nodes:
                        continue
                    seen_nodes.add(nid)
                    labels = list(getattr(node, "labels", ["PERSON"]))
                    ntype = labels[0].upper() if labels else "PERSON"
                    nodes_out.append({
                        "id": nid,
                        "name": node.get("name", nid),
                        "type": ntype,
                        "role": node.get("role", "Subject for Review"),
                        "sub": f"{ntype} · {nid}",
                    })

                edges_out = []
                for i, rel in enumerate(raw_edges):
                    rel_type = getattr(rel, "type", rel.get("type", "association")).lower()
                    edges_out.append({
                        "id": f"NEO-E-{i+1}",
                        "source": rel.get("start_id", getattr(getattr(rel, "start_node", None), "get", lambda k, d=None: "")("id", "")),
                        "target": rel.get("end_id", getattr(getattr(rel, "end_node", None), "get", lambda k, d=None: "")("id", "")),
                        "type": rel_type,
                        "evidence": rel.get("evidence", f"EVD-{i+1}"),
                        "confidence": rel.get("confidence", 85),
                        "count": rel.get("count", 1),
                        "amount": rel.get("amount"),
                    })

                return {"nodes": nodes_out, "edges": edges_out}
        except Exception as e:
            logger.warning(f"Error querying Neo4j subgraph: {e}")
            return {"nodes": [], "edges": []}

    def shortest_path(self, source_id: str, target_id: str, case_id: Optional[str] = None) -> Dict[str, Any]:
        """Compute shortest path between two entities using Neo4j Cypher."""
        if not self.is_connected:
            return {"path": [], "length": -1, "found": False}

        try:
            with self.driver.session() as session:
                cypher = """
                MATCH (s {id: $source_id}), (t {id: $target_id})
                MATCH p = shortestPath((s)-[*]-(t))
                RETURN [n IN nodes(p) | {id: n.id, name: n.name, type: labels(n)[0]}] AS path, length(p) AS length
                """
                res = session.run(cypher, {"source_id": source_id, "target_id": target_id})
                rec = res.single()
                if rec and rec["path"]:
                    return {
                        "path": rec["path"],
                        "length": rec["length"],
                        "found": True,
                    }
        except Exception as e:
            logger.warning(f"Error computing shortest path in Neo4j: {e}")

        return {"path": [], "length": -1, "found": False}

# Singleton instance
neo4j_client = Neo4jClient()
