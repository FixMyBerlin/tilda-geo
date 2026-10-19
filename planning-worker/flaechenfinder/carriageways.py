"""Carriageway areas (roads buffered by their width) for the carriageway exclusion.

Like vegetation.py: the geometries are computed once (here from
`public._parking_roads` instead of CIR tiles) and reused both for the hard
hexagon exclusion in scorer.py and for the map display
(`planning.scenario_carriageways`).
"""
from __future__ import annotations

import geopandas as gpd
import pandas as pd
from shapely.geometry.base import BaseGeometry

from flaechenfinder.tilda import TildaLoader

DEFAULT_WIDTH_M = 3.0  # Fallback in case width_m is missing/invalid.


def _empty_carriageways(crs: str = "EPSG:25832") -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame({"width_m": []}, geometry=[], crs=crs)


def compute_carriageway_areas(
    study_area_geom: BaseGeometry, tilda_loader: TildaLoader
) -> gpd.GeoDataFrame:
    """Load roads (public._parking_roads) and buffer them by their width.

    `study_area_geom` is in EPSG:4326. Returns a GeoDataFrame in EPSG:25832
    with the columns `geometry` (polygon, one road segment per row) and
    `width_m` — like `compute_vegetation_areas`.
    """
    roads = tilda_loader.load_roads(study_area_geom)
    if not len(roads):
        return _empty_carriageways()

    roads_proj = roads.to_crs("EPSG:25832").rename_geometry("geometry")
    width = pd.to_numeric(roads_proj["width_m"], errors="coerce").fillna(DEFAULT_WIDTH_M)
    roads_proj = roads_proj.set_geometry(roads_proj.geometry.buffer(width / 2.0))
    roads_proj["width_m"] = width

    print(f"   ✓ {len(roads_proj)} carriageway areas buffered")
    return roads_proj[["geometry", "width_m"]]
