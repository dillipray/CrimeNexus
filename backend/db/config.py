import os
from pathlib import Path
from dotenv import load_dotenv

# Try loading from backend/services/.env or root .env
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SERVICES_ENV = ROOT_DIR / "backend" / "services" / ".env"
ROOT_ENV = ROOT_DIR / ".env"

if SERVICES_ENV.exists():
    load_dotenv(SERVICES_ENV)
elif ROOT_ENV.exists():
    load_dotenv(ROOT_ENV)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nexus:nexus@localhost:5433/nexus")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "strongpassword")

# Find dataset directory (handles both src/data/synthatic_dataset and synthatic_dataset)
def get_dataset_dir() -> Path:
    candidates = [
        ROOT_DIR / "src" / "data" / "synthatic_dataset",
        ROOT_DIR / "src" / "data" / "synthetic_dataset",
        ROOT_DIR / "synthatic_dataset",
        ROOT_DIR / "synthetic_dataset",
    ]
    for c in candidates:
        if c.exists() and (c / "cases.csv").exists():
            return c
    return candidates[0]

DATASET_DIR = get_dataset_dir()
