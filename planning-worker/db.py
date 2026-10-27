"""Database helpers for the planning worker.

Connects to the same PostGIS instance as TILDA (standard `PG*` env, exactly
like the existing `processing` container). Provides both a psycopg connection
(for LISTEN/NOTIFY + job claiming) and an SQLAlchemy engine (for
geopandas read_postgis / to_postgis).
"""
from __future__ import annotations

import os
from pathlib import Path

import psycopg
from sqlalchemy import create_engine


def _conninfo() -> dict:
    return {
        "host": os.environ.get("PGHOST", "localhost"),
        "port": int(os.environ.get("PGPORT", "5432")),
        "dbname": os.environ.get("PGDATABASE", "postgres"),
        "user": os.environ.get("PGUSER", "postgres"),
        "password": os.environ.get("PGPASSWORD", ""),
    }


def connect() -> psycopg.Connection:
    """New psycopg connection (autocommit for LISTEN/NOTIFY + status updates)."""
    info = _conninfo()
    conn = psycopg.connect(
        host=info["host"], port=info["port"], dbname=info["dbname"],
        user=info["user"], password=info["password"], autocommit=True,
    )
    return conn


def make_engine():
    """SQLAlchemy engine for geopandas (read_postgis / to_postgis)."""
    i = _conninfo()
    url = f"postgresql+psycopg://{i['user']}:{i['password']}@{i['host']}:{i['port']}/{i['dbname']}"
    return create_engine(url, pool_pre_ping=True)


def apply_schema(conn: psycopg.Connection) -> None:
    """Idempotently create the `planning` schema + result tables + Martin functions."""
    sql_dir = Path(__file__).parent / "sql"
    for sql_file in ("schema.sql", "martin_functions.sql"):
        sql = (sql_dir / sql_file).read_text()
        with conn.cursor() as cur:
            cur.execute(sql)
    print("   ✓ planning schema + Martin functions ensured")
