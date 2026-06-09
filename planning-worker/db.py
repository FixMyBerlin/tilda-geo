"""Datenbank-Helfer für den Planning-Worker.

Verbindet sich mit derselben PostGIS-Instanz wie tilda (Standard-`PG*`-Env, exakt
wie der bestehende `processing`-Container). Liefert sowohl eine psycopg-Verbindung
(für LISTEN/NOTIFY + Job-Claiming) als auch eine SQLAlchemy-Engine (für
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
    """Neue psycopg-Verbindung (autocommit für LISTEN/NOTIFY + Statusupdates)."""
    info = _conninfo()
    conn = psycopg.connect(
        host=info["host"], port=info["port"], dbname=info["dbname"],
        user=info["user"], password=info["password"], autocommit=True,
    )
    return conn


def make_engine():
    """SQLAlchemy-Engine für geopandas (read_postgis / to_postgis)."""
    i = _conninfo()
    url = f"postgresql+psycopg://{i['user']}:{i['password']}@{i['host']}:{i['port']}/{i['dbname']}"
    return create_engine(url, pool_pre_ping=True)


def apply_schema(conn: psycopg.Connection) -> None:
    """Idempotentes Anlegen des `planning`-Schemas + Ergebnis-Tabellen."""
    schema_sql = (Path(__file__).parent / "sql" / "schema.sql").read_text()
    with conn.cursor() as cur:
        cur.execute(schema_sql)
    print("   ✓ planning-Schema sichergestellt")
