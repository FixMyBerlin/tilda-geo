"""Carriageway areas (roads buffered by their width) for the carriageway exclusion.

Like vegetation.py: the geometries are computed once (here from
`public._parking_roads` instead of CIR tiles) and reused both for the hard
hexagon exclusion in scorer.py and for the map display
(`space_finder.scenario_carriageways`).
"""
from __future__ import annotations

import geopandas as gpd
import pandas as pd
from shapely.geometry.base import BaseGeometry

from scoring.tilda import TildaLoader

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

    width = pd.to_numeric(roads["width_m"], errors="coerce").fillna(DEFAULT_WIDTH_M)
    areas = _buffer_by_width(roads, width)
    print(f"   ✓ {len(areas)} carriageway areas buffered")
    return areas


def _buffer_by_width(roads: gpd.GeoDataFrame, width: pd.Series) -> gpd.GeoDataFrame:
    """Buffer road lines by half their width (EPSG:25832, columns geometry + width_m)."""
    roads_proj = roads.to_crs("EPSG:25832").rename_geometry("geometry")
    roads_proj = roads_proj.set_geometry(roads_proj.geometry.buffer(width.to_numpy() / 2.0))
    roads_proj["width_m"] = width.to_numpy()
    return roads_proj[["geometry", "width_m"]]


# Fallback widths per `road` class of `public.roads` when neither `_parking_roads`
# nor the OSM `width` tag gives one. Same values as the non-oneway fallbacks in
# `processing/topics/parking/roads/helper/road_width_tags.lua`; classes are matched
# by prefix (e.g. `residential_priority_road` → residential, `service_*` → service).
TEMPO30_WIDTH_FALLBACKS_M = {
    "primary": 18.0,
    "secondary": 14.0,
    "tertiary": 10.0,
    "residential": 8.0,
    "unclassified": 8.0,
    "living_street": 5.0,
    "pedestrian": 8.0,
    "bicycle_road": 8.0,
    "service": 4.0,
}
TEMPO30_DEFAULT_WIDTH_M = 8.0
_LINK_WIDTH_M = 6.0


def tempo30_fallback_width(road: str | None) -> float:
    """Default carriageway width (m) for a `public.roads` class without a known width."""
    if not road:
        return TEMPO30_DEFAULT_WIDTH_M
    if road.endswith("_link"):
        return _LINK_WIDTH_M
    for prefix, width in TEMPO30_WIDTH_FALLBACKS_M.items():
        if road.startswith(prefix):
            return width
    return TEMPO30_DEFAULT_WIDTH_M


def compute_tempo30_carriageways(
    study_area_geom: BaseGeometry, tilda_loader: TildaLoader
) -> gpd.GeoDataFrame:
    """Carriageway areas of calm roads (maxspeed ≤ 30) for the Tempo 30 bonus.

    Like `compute_carriageway_areas`, but from `public.roads` (which has
    maxspeed) instead of `_parking_roads`. A bike parking on a Tempo 30 road can
    go directly on the carriageway, so the bonus only applies on this area.
    Returns EPSG:25832 with `geometry` and `width_m`.
    """
    roads = tilda_loader.load_tempo30_roads(study_area_geom)
    if not len(roads):
        return _empty_carriageways()

    width = pd.to_numeric(roads["width_m"], errors="coerce")
    width = width.fillna(roads["road"].map(tempo30_fallback_width))
    areas = _buffer_by_width(roads, width)
    print(f"   ✓ {len(areas)} Tempo 30 carriageway areas buffered")
    return areas
