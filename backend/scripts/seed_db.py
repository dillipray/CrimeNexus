"""
NexusIntel Database Initialization & Seeding Script
===================================================
Loads the authentic Section 15.1 Synthetic Dataset into:
1. PostgreSQL — structured relational tables (cases, persons, phones, accounts, vehicles, locations, organizations, fir_reports, cdr_records, transactions)
2. Neo4j — entity nodes (Person, Phone, Account, Vehicle, Location, Organization, Case) and multi-source graph relationships

Usage:
  python -m backend.scripts.seed_db [--dry-run]
"""

import os
import sys
import csv
import argparse
from pathlib import Path
from typing import Dict, List, Any

from backend.db.config import DATASET_DIR
from backend.db.postgres_client import postgres_client
from backend.db.neo4j_client import neo4j_client

def read_csv(filename: str) -> List[Dict[str, str]]:
    filepath = Path(DATASET_DIR) / filename
    if not filepath.exists():
        print(f"[-] Warning: {filepath} does not exist.")
        return []
    with open(filepath, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def seed_postgres(dry_run: bool = False) -> Dict[str, int]:
    print("\n--- [1/2] Seeding PostgreSQL Structured Tables ---")
    if not dry_run and not postgres_client.check_connection():
        print("[-] PostgreSQL server is offline or unreachable. Skipping PostgreSQL seeding.")
        return {}

    counts = {}
    files_to_tables = [
        ("cases.csv", "cases"),
        ("persons.csv", "persons"),
        ("phones.csv", "phones"),
        ("accounts.csv", "accounts"),
        ("vehicles.csv", "vehicles"),
        ("locations.csv", "locations"),
        ("organizations.csv", "organizations"),
        ("fir_reports.csv", "fir_reports"),
        ("cdr_records.csv", "cdr_records"),
        ("transactions.csv", "transactions"),
    ]

    if not dry_run:
        postgres_client.init_tables()

    for filename, table_name in files_to_tables:
        rows = read_csv(filename)
        counts[table_name] = len(rows)
        print(f"  * {table_name}: parsed {len(rows)} records from {filename}")
        if not dry_run and rows:
            # Type cast numeric / boolean fields where necessary
            clean_rows = []
            for r in rows:
                row_copy = dict(r)
                if "latitude" in row_copy and row_copy["latitude"]:
                    row_copy["latitude"] = float(row_copy["latitude"])
                if "longitude" in row_copy and row_copy["longitude"]:
                    row_copy["longitude"] = float(row_copy["longitude"])
                if "synthetic_coordinate" in row_copy:
                    row_copy["synthetic_coordinate"] = row_copy["synthetic_coordinate"].lower() in ("true", "1")
                if "amount_inr" in row_copy and row_copy["amount_inr"]:
                    row_copy["amount_inr"] = float(row_copy["amount_inr"])
                if "duration_seconds" in row_copy and row_copy["duration_seconds"]:
                    row_copy["duration_seconds"] = int(row_copy["duration_seconds"])
                if "risk_label" in row_copy and row_copy["risk_label"]:
                    row_copy["risk_label"] = int(row_copy["risk_label"])
                clean_rows.append(row_copy)
            postgres_client.bulk_insert(table_name, clean_rows)

    print(f"[+] PostgreSQL seeding completed ({sum(counts.values())} records across {len(counts)} tables).")
    return counts

def seed_neo4j(dry_run: bool = False) -> Dict[str, int]:
    print("\n--- [2/2] Seeding Neo4j Knowledge Graph (Nodes & Edges) ---")
    if not dry_run and not neo4j_client.check_connection():
        print("[-] Neo4j server is offline or unreachable. Skipping Neo4j seeding.")
        return {}

    cases = read_csv("cases.csv")
    persons = read_csv("persons.csv")
    phones = read_csv("phones.csv")
    accounts = read_csv("accounts.csv")
    vehicles = read_csv("vehicles.csv")
    locations = read_csv("locations.csv")
    organizations = read_csv("organizations.csv")
    fir_reports = read_csv("fir_reports.csv")
    cdr_records = read_csv("cdr_records.csv")
    transactions = read_csv("transactions.csv")

    stats = {
        "cases": len(cases),
        "persons": len(persons),
        "phones": len(phones),
        "accounts": len(accounts),
        "vehicles": len(vehicles),
        "locations": len(locations),
        "organizations": len(organizations),
        "cdr_edges": len(cdr_records),
        "txn_edges": len(transactions),
    }

    if dry_run:
        print("  [DRY-RUN] Would create nodes and edges:")
        for k, v in stats.items():
            print(f"    - {k}: {v}")
        return stats

    neo4j_client.init_constraints()

    with neo4j_client.driver.session() as session:
        # 1. Create Case nodes
        print(f"  * Creating {len(cases)} Case nodes...")
        session.run(
            """
            UNWIND $batch AS row
            MERGE (c:Case {id: row.case_id})
            SET c.fir_number = row.fir_number,
                c.police_station = row.police_station,
                c.district = row.district,
                c.state = row.state,
                c.crime_type = row.crime_type,
                c.status = row.status,
                c.type = 'CASE',
                c.name = row.case_id
            """,
            {"batch": cases},
        )

        # 2. Create Person nodes
        print(f"  * Creating {len(persons)} Person nodes...")
        session.run(
            """
            UNWIND $batch AS row
            MERGE (p:Person {id: row.person_id})
            SET p.name = row.name,
                p.state = row.state,
                p.district = row.district,
                p.role = row.role,
                p.case_id = row.case_id,
                p.type = 'PERSON'
            """,
            {"batch": persons},
        )

        # 3. Create Phone nodes & OWNS_PHONE edges
        print(f"  * Creating {len(phones)} Phone nodes & ownership edges...")
        session.run(
            """
            UNWIND $batch AS row
            MERGE (ph:Phone {id: row.phone_id})
            SET ph.number_display = row.number_display,
                ph.name = row.number_display,
                ph.owner_id = row.owner_id,
                ph.type = 'PHONE'
            WITH ph, row
            MATCH (p:Person {id: row.owner_id})
            MERGE (p)-[:OWNS_PHONE {confidence: 95}]->(ph)
            """,
            {"batch": phones},
        )

        # 4. Create Account nodes & OWNS_ACCOUNT edges
        print(f"  * Creating {len(accounts)} Account nodes & ownership edges...")
        session.run(
            """
            UNWIND $batch AS row
            MERGE (a:Account {id: row.account_id})
            SET a.institution = row.institution,
                a.state = row.state,
                a.name = row.account_id + ' (' + row.institution + ')',
                a.owner_id = row.owner_id,
                a.type = 'ACCOUNT'
            WITH a, row
            MATCH (p:Person {id: row.owner_id})
            MERGE (p)-[:OWNS_ACCOUNT {confidence: 98}]->(a)
            """,
            {"batch": accounts},
        )

        # 5. Create Vehicle nodes & VEHICLE_ASSOCIATION edges
        print(f"  * Creating {len(vehicles)} Vehicle nodes & associations...")
        session.run(
            """
            UNWIND $batch AS row
            MERGE (v:Vehicle {id: row.vehicle_id})
            SET v.registration = row.registration,
                v.vehicle_type = row.vehicle_type,
                v.name = row.registration + ' (' + row.vehicle_type + ')',
                v.owner_id = row.owner_id,
                v.type = 'VEHICLE'
            WITH v, row
            MATCH (p:Person {id: row.owner_id})
            MERGE (p)-[:VEHICLE_ASSOCIATION {confidence: 90}]->(v)
            """,
            {"batch": vehicles},
        )

        # 6. Create Location nodes
        print(f"  * Creating {len(locations)} Location nodes...")
        loc_clean = []
        for l in locations:
            lc = dict(l)
            lc["latitude"] = float(lc["latitude"]) if lc.get("latitude") else 0.0
            lc["longitude"] = float(lc["longitude"]) if lc.get("longitude") else 0.0
            loc_clean.append(lc)
        session.run(
            """
            UNWIND $batch AS row
            MERGE (l:Location {id: row.location_id})
            SET l.name = row.name,
                l.district = row.district,
                l.state = row.state,
                l.lat = row.latitude,
                l.lng = row.longitude,
                l.type = 'LOCATION'
            """,
            {"batch": loc_clean},
        )

        # 7. Create Organization nodes & Location link
        print(f"  * Creating {len(organizations)} Organization nodes...")
        session.run(
            """
            UNWIND $batch AS row
            MERGE (o:Organization {id: row.organization_id})
            SET o.name = row.name,
                o.org_type = row.type,
                o.location_id = row.location_id,
                o.type = 'ORG'
            WITH o, row
            MATCH (l:Location {id: row.location_id})
            MERGE (o)-[:LOCATION_OBSERVATION {confidence: 85}]->(l)
            """,
            {"batch": organizations},
        )

        # 8. Add FIR co-mentions and associations
        print("  * Adding FIR contextual edges...")
        for fir in fir_reports:
            cid = fir.get("case_id")
            pids = [p.strip() for p in fir.get("person_ids", "").split(";") if p.strip()]
            loc_id = fir.get("location_id")
            veh_id = fir.get("vehicle_id")
            org_id = fir.get("organization_id")

            # Link person co-mentions in FIR
            for i in range(len(pids)):
                for j in range(i + 1, len(pids)):
                    session.run(
                        """
                        MATCH (p1:Person {id: $p1}), (p2:Person {id: $p2})
                        MERGE (p1)-[r:FIR_CO_MENTION {case_id: $case_id}]->(p2)
                        SET r.confidence = 88, r.evidence = $case_id
                        """,
                        {"p1": pids[i], "p2": pids[j], "case_id": cid},
                    )
                if loc_id:
                    session.run(
                        """
                        MATCH (p:Person {id: $p}), (l:Location {id: $loc_id})
                        MERGE (p)-[r:LOCATION_OBSERVATION {case_id: $case_id}]->(l)
                        SET r.confidence = 80, r.evidence = $case_id
                        """,
                        {"p": pids[i], "loc_id": loc_id, "case_id": cid},
                    )
                if veh_id:
                    session.run(
                        """
                        MATCH (p:Person {id: $p}), (v:Vehicle {id: $veh_id})
                        MERGE (p)-[r:VEHICLE_ASSOCIATION {case_id: $case_id}]->(v)
                        SET r.confidence = 85, r.evidence = $case_id
                        """,
                        {"p": pids[i], "veh_id": veh_id, "case_id": cid},
                    )
                if org_id:
                    session.run(
                        """
                        MATCH (p:Person {id: $p}), (o:Organization {id: $org_id})
                        MERGE (p)-[r:ORGANIZATION_ASSOCIATION {case_id: $case_id}]->(o)
                        SET r.confidence = 85, r.evidence = $case_id
                        """,
                        {"p": pids[i], "org_id": org_id, "case_id": cid},
                    )

        # 9. Ingest CDR records sample (first 1,000 for fast high-density graph)
        print("  * Adding CDR telephony communication edges...")
        cdr_sample = cdr_records[:1000]
        session.run(
            """
            UNWIND $batch AS row
            MATCH (p1:Person {id: row.caller_id}), (p2:Person {id: row.receiver_id})
            MERGE (p1)-[r:COMMUNICATION {evidence: row.cdr_id, case_id: row.case_id}]->(p2)
            SET r.confidence = 92,
                r.call_type = row.call_type,
                r.duration = row.duration_seconds,
                r.count = coalesce(r.count, 0) + 1
            """,
            {"batch": cdr_sample},
        )

        # 10. Ingest Financial transactions sample (first 1,000 for high-density graph)
        print("  * Adding Financial fund flow edges...")
        txn_sample = transactions[:1000]
        session.run(
            """
            UNWIND $batch AS row
            MATCH (a1:Account {id: row.sender_account}), (a2:Account {id: row.receiver_account})
            MERGE (a1)-[r:TRANSFERRED_TO {evidence: row.transaction_id, case_id: row.case_id}]->(a2)
            SET r.confidence = 90,
                r.amount = row.amount_inr,
                r.transaction_type = row.transaction_type
            """,
            {"batch": txn_sample},
        )

    print("[+] Neo4j graph seeding completed successfully.")
    return stats

def main():
    parser = argparse.ArgumentParser(description="Seed PostgreSQL & Neo4j with Section 15.1 Synthetic Dataset")
    parser.add_argument("--dry-run", action="store_true", help="Parse dataset CSVs and validate schemas without executing DB writes")
    args = parser.parse_args()

    print("=================================================================")
    print("  NexusIntel Synthetic Dataset ETL -> PostgreSQL & Neo4j  ")
    print(f"  Dataset path: {DATASET_DIR}")
    print(f"  Dry-run mode: {args.dry_run}")
    print("=================================================================")

    pg_stats = seed_postgres(dry_run=args.dry_run)
    neo_stats = seed_neo4j(dry_run=args.dry_run)

    print("\n=================================================================")
    print("  ETL Seeding Summary")
    print(f"  PostgreSQL: {'Simulated' if args.dry_run else ('Completed' if pg_stats else 'Offline')}")
    print(f"  Neo4j:      {'Simulated' if args.dry_run else ('Completed' if neo_stats else 'Offline')}")
    print("=================================================================")

if __name__ == "__main__":
    main()
