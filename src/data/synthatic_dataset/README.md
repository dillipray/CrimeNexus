PS 189 Synthetic Indian-Context Dataset

Purpose: educational prototype for AI-powered criminal network analysis. All names, identifiers, phone values, accounts, vehicles, reports, and coordinates are synthetic. Do not treat records as real evidence.

Shared keys: case_id, person_id, location_id, vehicle_id, organization_id, account_id.

Suggested graph nodes: Person, Phone, Account, Case, Location, Vehicle, Organization.
Suggested edges: MENTIONED_IN, CALLED, OWNS_ACCOUNT, TRANSFERRED_TO, PRESENT_AT, USED_VEHICLE, MEMBER_OF.

Files: cases.csv, persons.csv, locations.csv, organizations.csv, vehicles.csv, accounts.csv, phones.csv, cdr_records.csv, transactions.csv, fir_reports.csv.

The INR transactions and Indian-style state/vehicle formats are synthetic. The dataset is intentionally designed to be fragmented across files but connected through shared identifiers.
