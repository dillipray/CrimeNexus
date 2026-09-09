import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import (
    create_engine, MetaData, Table, Column, String, Integer,
    Float, Numeric, Boolean, Text, DateTime, ForeignKey, text, inspect
)
from sqlalchemy.orm import sessionmaker
from backend.db.config import DATABASE_URL

logger = logging.getLogger("NexusIntel.Postgres")

class PostgresClient:
    def __init__(self, db_url: str = DATABASE_URL):
        self.db_url = db_url
        self.engine = None
        self.metadata = MetaData()
        self.SessionLocal = None
        self._is_connected: Optional[bool] = None
        self._init_engine()

    def _init_engine(self):
        try:
            # Pool settings suitable for local/demo use with quick timeouts
            self.engine = create_engine(
                self.db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"connect_timeout": 3},
            )
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            self._define_tables()
        except Exception as e:
            logger.warning(f"PostgreSQL engine initialization notice: {e}")

    def check_connection(self) -> bool:
        """Check if PostgreSQL server is alive and accepting queries."""
        if not self.engine:
            return False
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
            self._is_connected = True
            return True
        except Exception as e:
            logger.debug(f"PostgreSQL connection check failed: {e}")
            self._is_connected = False
            return False

    @property
    def is_connected(self) -> bool:
        if self._is_connected is None:
            return self.check_connection()
        return self._is_connected

    def _define_tables(self):
        self.cases_table = Table(
            "cases", self.metadata,
            Column("case_id", String(50), primary_key=True),
            Column("fir_number", String(50)),
            Column("police_station", String(100)),
            Column("district", String(100)),
            Column("state", String(100)),
            Column("crime_type", String(100)),
            Column("incident_date", String(50)),
            Column("status", String(50)),
            extend_existing=True,
        )

        self.persons_table = Table(
            "persons", self.metadata,
            Column("person_id", String(50), primary_key=True),
            Column("name", String(100), nullable=False),
            Column("state", String(100)),
            Column("district", String(100)),
            Column("role", String(100)),
            Column("case_id", String(50)),
            extend_existing=True,
        )

        self.phones_table = Table(
            "phones", self.metadata,
            Column("phone_id", String(50), primary_key=True),
            Column("owner_id", String(50)),
            Column("number_display", String(100)),
            extend_existing=True,
        )

        self.accounts_table = Table(
            "accounts", self.metadata,
            Column("account_id", String(50), primary_key=True),
            Column("owner_id", String(50)),
            Column("institution", String(100)),
            Column("state", String(100)),
            extend_existing=True,
        )

        self.vehicles_table = Table(
            "vehicles", self.metadata,
            Column("vehicle_id", String(50), primary_key=True),
            Column("registration", String(50)),
            Column("vehicle_type", String(50)),
            Column("owner_id", String(50)),
            extend_existing=True,
        )

        self.locations_table = Table(
            "locations", self.metadata,
            Column("location_id", String(50), primary_key=True),
            Column("name", String(150)),
            Column("district", String(100)),
            Column("state", String(100)),
            Column("latitude", Float),
            Column("longitude", Float),
            Column("synthetic_coordinate", Boolean, default=True),
            extend_existing=True,
        )

        self.organizations_table = Table(
            "organizations", self.metadata,
            Column("organization_id", String(50), primary_key=True),
            Column("name", String(150)),
            Column("type", String(100)),
            Column("location_id", String(50)),
            extend_existing=True,
        )

        self.fir_reports_table = Table(
            "fir_reports", self.metadata,
            Column("case_id", String(50), primary_key=True),
            Column("language", String(20)),
            Column("text", Text),
            Column("person_ids", Text),
            Column("location_id", String(50)),
            Column("vehicle_id", String(50)),
            Column("organization_id", String(50)),
            Column("account_ids", Text),
            extend_existing=True,
        )

        self.cdr_records_table = Table(
            "cdr_records", self.metadata,
            Column("cdr_id", String(50), primary_key=True),
            Column("case_id", String(50)),
            Column("caller_id", String(50)),
            Column("receiver_id", String(50)),
            Column("date_time", String(50)),
            Column("duration_seconds", Integer),
            Column("tower_id", String(50)),
            Column("call_type", String(50)),
            extend_existing=True,
        )

        self.transactions_table = Table(
            "transactions", self.metadata,
            Column("transaction_id", String(50), primary_key=True),
            Column("case_id", String(50)),
            Column("sender_account", String(50)),
            Column("receiver_account", String(50)),
            Column("amount_inr", Numeric(15, 2)),
            Column("transaction_type", String(50)),
            Column("date_time", String(50)),
            Column("risk_label", Integer, default=0),
            extend_existing=True,
        )

        self.alerts_table = Table(
            "alerts", self.metadata,
            Column("alert_id", String(50), primary_key=True),
            Column("alert_type", String(100)),
            Column("case_id", String(50)),
            Column("title", String(200)),
            Column("entity", String(100)),
            Column("confidence", Float),
            Column("severity", String(20)),
            Column("explanation", Text),
            Column("status", String(50), default="New"),
            Column("evidence", Text),
            Column("trace", Text),
            Column("created_at", String(50)),
            extend_existing=True,
        )

        self.audit_log_table = Table(
            "audit_log", self.metadata,
            Column("audit_id", Integer, primary_key=True, autoincrement=True),
            Column("actor", String(100)),
            Column("role", String(100)),
            Column("action_type", String(100)),
            Column("target_type", String(100)),
            Column("target_id", String(100)),
            Column("details", Text),
            Column("prev_hash", String(64)),
            Column("curr_hash", String(64)),
            Column("timestamp", String(50)),
            extend_existing=True,
        )

        self.resolution_table = Table(
            "entity_resolution_candidates", self.metadata,
            Column("id", String(50), primary_key=True),
            Column("a", String(100)),
            Column("b", String(100)),
            Column("confidence", Float),
            Column("status", String(50), default="pending"),
            Column("reasons", Text),
            Column("a_attrs", Text),
            Column("b_attrs", Text),
            Column("decision", String(50), nullable=True),
            extend_existing=True,
        )

    def init_tables(self):
        """Create all tables in PostgreSQL if they do not exist."""
        if not self.check_connection():
            raise ConnectionError(f"Cannot connect to PostgreSQL at {self.db_url}")
        self.metadata.create_all(self.engine)
        logger.info("PostgreSQL tables successfully verified/created.")

    def fetch_all(self, table_name: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch records from a table with optional case_id filtering."""
        if not self.is_connected:
            return []
        try:
            tbl = self.metadata.tables.get(table_name)
            if tbl is None:
                return []
            with self.engine.connect() as conn:
                stmt = tbl.select()
                if case_id and "case_id" in tbl.c:
                    stmt = stmt.where(tbl.c.case_id == case_id)
                res = conn.execute(stmt)
                return [dict(row._mapping) for row in res]
        except Exception as e:
            logger.warning(f"Error fetching from PostgreSQL table '{table_name}': {e}")
            return []

    def bulk_insert(self, table_name: str, rows: List[Dict[str, Any]], chunk_size: int = 500):
        """Bulk insert rows into a table in chunks."""
        if not rows or not self.check_connection():
            return
        tbl = self.metadata.tables.get(table_name)
        if tbl is None:
            return
        with self.engine.begin() as conn:
            for i in range(0, len(rows), chunk_size):
                chunk = rows[i:i + chunk_size]
                conn.execute(tbl.insert(), chunk)

# Singleton instance
postgres_client = PostgresClient()
