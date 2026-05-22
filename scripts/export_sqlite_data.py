import sqlite3
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]

DB_PATH = ROOT_DIR / "data" / "imports" / "master_app_database.db"
OUTPUT_PATH = ROOT_DIR / "data" / "imports" / "exported-data.json"

LOCATION_TABLE = "master_table"
JOURNEY_TABLE = "master_journey_table"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row


def fetch_table(table_name):
    rows = conn.execute(f"SELECT * FROM {table_name}").fetchall()
    return [dict(row) for row in rows]


data = {
    "locations": fetch_table(LOCATION_TABLE),
    "journeys": fetch_table(JOURNEY_TABLE),
}

OUTPUT_PATH.write_text(
    json.dumps(data, ensure_ascii=False, indent=2),
    encoding="utf-8",
)

conn.close()

print(f"Exported {len(data['locations'])} locations")
print(f"Exported {len(data['journeys'])} journeys")
print(f"Wrote {OUTPUT_PATH}")