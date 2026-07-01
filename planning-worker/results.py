"""Persistiert Flächenfinder-Ergebnisse nach PostGIS `planning.*` (keyed by run_id).

Geometrien werden nach EPSG:3857 transformiert (wie tildas `public`-Tabellen),
damit Martins ST_AsMVT-Funktionen direkt darauf arbeiten können.
"""
from __future__ import annotations

import geopandas as gpd
from shapely.geometry import MultiPolygon

HEX_COLUMNS = [
    "run_id", "h3_id", "resolution", "geom",
    "mce_gesamtscore", "score_radweg", "score_bodenbelag", "score_zielorte",
    "score_hangneigung", "score_hindernisfreiheit", "score_oepnv",
    "score_vegetation", "score_kreuzung", "eignungsklasse", "gebaeude",
]


def _write_hexagons(engine, frame: gpd.GeoDataFrame, run_id: int) -> int:
    """Schreibt ein Hexagon-Gitter (fein oder aggregiert) nach PostGIS.

    Erwartet eine `resolution`-Spalte im Frame; fehlende Score-Spalten werden
    als NULL ergänzt.
    """
    if frame is None or not len(frame):
        return 0
    hx = frame.to_crs("EPSG:3857").rename_geometry("geom")
    hx["run_id"] = run_id
    for col in HEX_COLUMNS:
        if col not in hx.columns and col != "geom":
            hx[col] = None
    hx = hx.set_geometry("geom")[HEX_COLUMNS]
    hx.to_postgis("scenario_hexagons", engine, schema="planning", if_exists="append", index=False)
    return len(hx)


def _to_multipolygon(geom):
    if geom is None or geom.is_empty:
        return None
    if geom.geom_type == "Polygon":
        return MultiPolygon([geom])
    return geom


def write_results(
    engine,
    conn,
    run_id: int,
    hex_proj: gpd.GeoDataFrame,
    areas: gpd.GeoDataFrame,
    vegetation: gpd.GeoDataFrame | None = None,
    hex_agg: gpd.GeoDataFrame | None = None,
):
    """Schreibt Hexagone + Potentialflächen + Vegetation für `run_id`.

    `hex_proj` ist das feine BASE-Gitter, `hex_agg` das grobe Aggregat für
    niedrige Zoomstufen; beide landen mit ihrer jeweiligen `resolution` in
    derselben Tabelle. Gibt (hex_count, area_count, veg_count) zurück, wobei
    `hex_count` nur die feinen (BASE-)Hexagone zählt.
    """

    # Idempotenz: evtl. vorhandene Zeilen dieses Laufs entfernen.
    with conn.cursor() as cur:
        cur.execute("DELETE FROM planning.scenario_hexagons WHERE run_id = %s", (run_id,))
        cur.execute("DELETE FROM planning.scenario_areas WHERE run_id = %s", (run_id,))
        cur.execute("DELETE FROM planning.scenario_vegetation WHERE run_id = %s", (run_id,))

    hex_count = _write_hexagons(engine, hex_proj, run_id)
    _write_hexagons(engine, hex_agg, run_id)

    area_count = 0
    if len(areas):
        ar = areas.to_crs("EPSG:3857")
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
        del ar

    veg_count = 0
    if vegetation is not None and len(vegetation):
        vg = vegetation.to_crs("EPSG:3857")
        vg = vg.rename_geometry("geom")
        vg["geom"] = vg["geom"].apply(_to_multipolygon)
        vg = vg[vg["geom"].notna()]
        vg["run_id"] = run_id
        for col in ("ndvi", "flaeche_m2"):
            if col not in vg.columns:
                vg[col] = None
        vg = vg.set_geometry("geom")[["run_id", "geom", "ndvi", "flaeche_m2"]]
        if len(vg):
            vg.to_postgis("scenario_vegetation", engine, schema="planning", if_exists="append", index=False)
        veg_count = len(vg)
        del vg

    print(
        f"   ✓ geschrieben: {hex_count} Hexagone, {area_count} Flächen, "
        f"{veg_count} Vegetationsflächen (run_id={run_id})"
    )
    return hex_count, area_count, veg_count
