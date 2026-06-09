"""Persistiert Flächenfinder-Ergebnisse nach PostGIS `planning.*` (keyed by run_id).

Geometrien werden nach EPSG:3857 transformiert (wie tildas `public`-Tabellen),
damit Martins ST_AsMVT-Funktionen direkt darauf arbeiten können.
"""
from __future__ import annotations

import geopandas as gpd
from shapely.geometry import MultiPolygon

HEX_COLUMNS = [
    "run_id", "h3_id", "geom",
    "mce_gesamtscore", "score_radweg", "score_bodenbelag", "score_zielorte",
    "score_hangneigung", "score_hindernisfreiheit", "score_oepnv", "eignungsklasse",
]


def _to_multipolygon(geom):
    if geom is None or geom.is_empty:
        return None
    if geom.geom_type == "Polygon":
        return MultiPolygon([geom])
    return geom


def write_results(engine, conn, run_id: int, hex_proj: gpd.GeoDataFrame, areas: gpd.GeoDataFrame):
    """Schreibt Hexagone + Potentialflächen für `run_id`. Gibt (hex_count, area_count) zurück."""

    # Idempotenz: evtl. vorhandene Zeilen dieses Laufs entfernen.
    with conn.cursor() as cur:
        cur.execute("DELETE FROM planning.scenario_hexagons WHERE run_id = %s", (run_id,))
        cur.execute("DELETE FROM planning.scenario_areas WHERE run_id = %s", (run_id,))

    hex_count = 0
    if len(hex_proj):
        hx = hex_proj.to_crs("EPSG:3857").copy()
        hx = hx.rename_geometry("geom")
        hx["run_id"] = run_id
        for col in HEX_COLUMNS:
            if col not in hx.columns and col != "geom":
                hx[col] = None
        hx = hx.set_geometry("geom")[HEX_COLUMNS]
        hx.to_postgis("scenario_hexagons", engine, schema="planning", if_exists="append", index=False)
        hex_count = len(hx)

    area_count = 0
    if len(areas):
        ar = areas.to_crs("EPSG:3857").copy()
        ar = ar.rename_geometry("geom")
        ar["geom"] = ar["geom"].apply(_to_multipolygon)
        ar = ar[ar["geom"].notna()]
        ar["run_id"] = run_id
        if "flaeche_m2" not in ar.columns:
            ar["flaeche_m2"] = None
        ar = ar.set_geometry("geom")[["run_id", "geom", "mce_gesamtscore", "flaeche_m2"]]
        if len(ar):
            ar.to_postgis("scenario_areas", engine, schema="planning", if_exists="append", index=False)
        area_count = len(ar)

    print(f"   ✓ geschrieben: {hex_count} Hexagone, {area_count} Flächen (run_id={run_id})")
    return hex_count, area_count
