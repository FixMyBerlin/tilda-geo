"""Fahrbahnflächen (Straßen gepuffert um ihre Breite) für den Fahrbahnen-Ausschluss.

Analog zu vegetation.py: die Geometrien werden einmal berechnet (hier: aus
`public._parking_roads` statt CIR-Kacheln) und sowohl für den harten
Hexagon-Ausschluss in scorer.py als auch für die Kartenanzeige
(`planning.scenario_carriageways`) wiederverwendet.
"""
from __future__ import annotations

import geopandas as gpd
import pandas as pd
from shapely.geometry.base import BaseGeometry

from flaechenfinder.tilda import TildaLoader

DEFAULT_WIDTH_M = 3.0  # Fallback, falls width_m ausnahmsweise fehlt/ungültig ist.


def _empty_carriageways(crs: str = "EPSG:25832") -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame({"width_m": []}, geometry=[], crs=crs)


def compute_carriageway_areas(
    study_area_geom: BaseGeometry, tilda_loader: TildaLoader
) -> gpd.GeoDataFrame:
    """Lädt Straßen (public._parking_roads) und puffert sie um ihre Breite.

    `study_area_geom` ist in EPSG:4326. Rückgabe ist ein GeoDataFrame in
    EPSG:25832 mit den Spalten `geometry` (Polygon, ein Straßensegment je
    Zeile) und `width_m` — analog zu `compute_vegetation_areas`.
    """
    roads = tilda_loader.load_roads(study_area_geom)
    if not len(roads):
        return _empty_carriageways()

    roads_proj = roads.to_crs("EPSG:25832").rename_geometry("geometry")
    width = pd.to_numeric(roads_proj["width_m"], errors="coerce").fillna(DEFAULT_WIDTH_M)
    roads_proj = roads_proj.set_geometry(roads_proj.geometry.buffer(width / 2.0))
    roads_proj["width_m"] = width

    print(f"   ✓ {len(roads_proj)} Fahrbahnflächen gepuffert")
    return roads_proj[["geometry", "width_m"]]
