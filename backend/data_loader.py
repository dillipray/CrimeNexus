import os
import csv
from typing import Dict, List, Any, Optional
import networkx as nx

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "synthatic_dataset")

class DataLoader:
    def __init__(self, dataset_dir: str = DATASET_DIR):
        self.dataset_dir = dataset_dir
        self.cases: Dict[str, Dict[str, Any]] = {}
        self.persons: Dict[str, Dict[str, Any]] = {}
        self.phones: Dict[str, Dict[str, Any]] = {}
        self.accounts: Dict[str, Dict[str, Any]] = {}
        self.vehicles: Dict[str, Dict[str, Any]] = {}
        self.locations: Dict[str, Dict[str, Any]] = {}
        self.organizations: Dict[str, Dict[str, Any]] = {}
        self.fir_reports: Dict[str, Dict[str, Any]] = {}
        self.cdr_records: List[Dict[str, Any]] = []
        self.transactions: List[Dict[str, Any]] = []
        self.graph: nx.Graph = nx.Graph()
        self.case_graphs: Dict[str, nx.Graph] = {}
        
        self.load_all()

    def _read_csv(self, filename: str) -> List[Dict[str, str]]:
        filepath = os.path.join(self.dataset_dir, filename)
        if not os.path.exists(filepath):
            return []
        with open(filepath, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def load_all(self):
        # 1. Cases
        for row in self._read_csv("cases.csv"):
            cid = row["case_id"]
            self.cases[cid] = row
            self.case_graphs[cid] = nx.Graph()

        # 2. Persons
        for row in self._read_csv("persons.csv"):
            pid = row["person_id"]
            self.persons[pid] = row

        # 3. Phones
        for row in self._read_csv("phones.csv"):
            phid = row["phone_id"]
            self.phones[phid] = row

        # 4. Accounts
        for row in self._read_csv("accounts.csv"):
            aid = row["account_id"]
            self.accounts[aid] = row

        # 5. Vehicles
        for row in self._read_csv("vehicles.csv"):
            vid = row["vehicle_id"]
            self.vehicles[vid] = row

        # 6. Locations
        for row in self._read_csv("locations.csv"):
            lid = row["location_id"]
            self.locations[lid] = row

        # 7. Organizations
        for row in self._read_csv("organizations.csv"):
            oid = row["organization_id"]
            self.organizations[oid] = row

        # 8. FIR Reports
        for row in self._read_csv("fir_reports.csv"):
            cid = row["case_id"]
            self.fir_reports[cid] = row

        # 9. CDR records
        self.cdr_records = self._read_csv("cdr_records.csv")

        # 10. Transactions
        self.transactions = self._read_csv("transactions.csv")

        self.build_graphs()

    def build_graphs(self):
        self.graph.clear()

        # Add Persons to Global & Case graphs
        for pid, p in self.persons.items():
            cid = p.get("case_id")
            node_attrs = {
                "id": pid,
                "name": p.get("name", pid),
                "type": "PERSON",
                "role": p.get("role", "Subject for Review"),
                "state": p.get("state", ""),
                "district": p.get("district", ""),
                "case_id": cid,
            }
            self.graph.add_node(pid, **node_attrs)
            if cid and cid in self.case_graphs:
                self.case_graphs[cid].add_node(pid, **node_attrs)

        # Add Phones & link to Person owner
        for phid, ph in self.phones.items():
            owner_id = ph.get("owner_id")
            num = ph.get("number_display", phid)
            node_attrs = {
                "id": phid,
                "name": num,
                "type": "PHONE",
                "owner_id": owner_id,
            }
            self.graph.add_node(phid, **node_attrs)
            if owner_id and self.graph.has_node(owner_id):
                cid = self.persons.get(owner_id, {}).get("case_id")
                self.graph.add_edge(owner_id, phid, type="owns_phone", evidence=phid, confidence=95)
                if cid and cid in self.case_graphs:
                    self.case_graphs[cid].add_node(phid, **node_attrs)
                    self.case_graphs[cid].add_edge(owner_id, phid, type="owns_phone", evidence=phid, confidence=95)

        # Add Vehicles & link to Person owner
        for vid, v in self.vehicles.items():
            owner_id = v.get("owner_id")
            reg = v.get("registration", vid)
            node_attrs = {
                "id": vid,
                "name": f"{reg} ({v.get('vehicle_type', 'vehicle')})",
                "type": "VEHICLE",
                "owner_id": owner_id,
            }
            self.graph.add_node(vid, **node_attrs)
            if owner_id and self.graph.has_node(owner_id):
                cid = self.persons.get(owner_id, {}).get("case_id")
                self.graph.add_edge(owner_id, vid, type="vehicle_association", evidence=vid, confidence=90)
                if cid and cid in self.case_graphs:
                    self.case_graphs[cid].add_node(vid, **node_attrs)
                    self.case_graphs[cid].add_edge(owner_id, vid, type="vehicle_association", evidence=vid, confidence=90)

        # Add Accounts & link to Person owner
        for aid, a in self.accounts.items():
            owner_id = a.get("owner_id")
            node_attrs = {
                "id": aid,
                "name": f"{aid} - {a.get('institution', 'Bank')}",
                "type": "ACCOUNT",
                "owner_id": owner_id,
            }
            self.graph.add_node(aid, **node_attrs)
            if owner_id and self.graph.has_node(owner_id):
                cid = self.persons.get(owner_id, {}).get("case_id")
                self.graph.add_edge(owner_id, aid, type="account_ownership", evidence=aid, confidence=98)
                if cid and cid in self.case_graphs:
                    self.case_graphs[cid].add_node(aid, **node_attrs)
                    self.case_graphs[cid].add_edge(owner_id, aid, type="account_ownership", evidence=aid, confidence=98)

        # Add Locations
        for lid, loc in self.locations.items():
            node_attrs = {
                "id": lid,
                "name": loc.get("name", lid),
                "type": "LOCATION",
                "lat": float(loc.get("latitude", 0) or 0),
                "lng": float(loc.get("longitude", 0) or 0),
                "district": loc.get("district", ""),
                "state": loc.get("state", ""),
            }
            self.graph.add_node(lid, **node_attrs)

        # Add Organizations & link to Location
        for oid, org in self.organizations.items():
            loc_id = org.get("location_id")
            node_attrs = {
                "id": oid,
                "name": org.get("name", oid),
                "type": "ORG",
                "org_type": org.get("type", "company"),
            }
            self.graph.add_node(oid, **node_attrs)
            if loc_id and self.graph.has_node(loc_id):
                self.graph.add_edge(oid, loc_id, type="location_observation", evidence=oid, confidence=85)

        # Add FIR connections (persons, location, vehicle, organization, accounts)
        for cid, fir in self.fir_reports.items():
            pids = [p.strip() for p in fir.get("person_ids", "").split(";") if p.strip()]
            loc_id = fir.get("location_id")
            veh_id = fir.get("vehicle_id")
            org_id = fir.get("organization_id")
            acct_ids = [a.strip() for a in fir.get("account_ids", "").split(";") if a.strip()]

            # Connect persons together in the FIR
            for i in range(len(pids)):
                p1 = pids[i]
                for j in range(i + 1, len(pids)):
                    p2 = pids[j]
                    if self.graph.has_node(p1) and self.graph.has_node(p2):
                        self.graph.add_edge(p1, p2, type="fir_co_mention", evidence=cid, confidence=88)
                        if cid in self.case_graphs:
                            self.case_graphs[cid].add_edge(p1, p2, type="fir_co_mention", evidence=cid, confidence=88)

                if loc_id and self.graph.has_node(loc_id):
                    self.graph.add_edge(p1, loc_id, type="location_observation", evidence=cid, confidence=80)
                    if cid in self.case_graphs:
                        self.case_graphs[cid].add_node(loc_id, **self.graph.nodes[loc_id])
                        self.case_graphs[cid].add_edge(p1, loc_id, type="location_observation", evidence=cid, confidence=80)

                if veh_id and self.graph.has_node(veh_id):
                    self.graph.add_edge(p1, veh_id, type="vehicle_association", evidence=cid, confidence=85)
                    if cid in self.case_graphs:
                        self.case_graphs[cid].add_node(veh_id, **self.graph.nodes[veh_id])
                        self.case_graphs[cid].add_edge(p1, veh_id, type="vehicle_association", evidence=cid, confidence=85)

                if org_id and self.graph.has_node(org_id):
                    self.graph.add_edge(p1, org_id, type="organization_association", evidence=cid, confidence=85)
                    if cid in self.case_graphs:
                        self.case_graphs[cid].add_node(org_id, **self.graph.nodes[org_id])
                        self.case_graphs[cid].add_edge(p1, org_id, type="organization_association", evidence=cid, confidence=85)

        # Add sample CDR edges (sampled to keep graph fast)
        cdr_sample = self.cdr_records[:500]
        for cdr in cdr_sample:
            p1 = cdr.get("caller_id")
            p2 = cdr.get("receiver_id")
            cid = cdr.get("case_id")
            if p1 and p2 and self.graph.has_node(p1) and self.graph.has_node(p2) and p1 != p2:
                if self.graph.has_edge(p1, p2):
                    self.graph[p1][p2]["count"] = self.graph[p1][p2].get("count", 1) + 1
                else:
                    self.graph.add_edge(p1, p2, type="communication", evidence=cdr["cdr_id"], confidence=92, count=1)
                
                if cid and cid in self.case_graphs:
                    cg = self.case_graphs[cid]
                    if cg.has_node(p1) and cg.has_node(p2):
                        if cg.has_edge(p1, p2):
                            cg[p1][p2]["count"] = cg[p1][p2].get("count", 1) + 1
                        else:
                            cg.add_edge(p1, p2, type="communication", evidence=cdr["cdr_id"], confidence=92, count=1)

        # Add sample transaction edges
        txn_sample = self.transactions[:500]
        for txn in txn_sample:
            s_acc = txn.get("sender_account")
            r_acc = txn.get("receiver_account")
            cid = txn.get("case_id")
            amount = txn.get("amount_inr")
            if s_acc and r_acc and self.graph.has_node(s_acc) and self.graph.has_node(r_acc):
                self.graph.add_edge(s_acc, r_acc, type="financial", evidence=txn["transaction_id"], confidence=90, amount=amount)
                if cid and cid in self.case_graphs:
                    cg = self.case_graphs[cid]
                    if cg.has_node(s_acc) and cg.has_node(r_acc):
                        cg.add_edge(s_acc, r_acc, type="financial", evidence=txn["transaction_id"], confidence=90, amount=amount)

# Singleton loader instance
loader = DataLoader()
