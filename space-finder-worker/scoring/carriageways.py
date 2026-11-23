"""Carriageway areas (roads buffered by their width) for the carriageway exclusion.

Like vegetation.py: the geometries are computed once (here from
`public._parking_roads` and `public.roads` instead of CIR tiles) and reused both for the hard
hexagon exclusion in scorer.py and for the map display
(`space_finder.scenario_carriageways`).
"""
from __future__ import annotations

import geopandas as gpd
import pandas as pd
from shapely.geometry.base import BaseGeometry

from scoring.tilda import TildaLoader

def _empty_carriageways(crs: str = "EPSG:25832") -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame({"width_m": []}, geometry=[], crs=crs)


def compute_carriageway_areas(
    study_area_geom: BaseGeometry, tilda_loader: TildaLoader
) -> gpd.GeoDataFrame:
    """Load roads and buffer them by their width.

    Roads come from `public._parking_roads` where the parking topic ran and from
    `public.roads` elsewhere (see `PostgisLoader.load_roads`); missing widths
    get a default per road class and oneway (`fallback_width`).
    `study_area_geom` is in EPSG:4326. Returns a GeoDataFrame in EPSG:25832
    with the columns `geometry` (polygon, one road segment per row) and
    `width_m` — like `compute_vegetation_areas`.
    """
    roads = tilda_loader.load_roads(study_area_geom)
    if not len(roads):
        return _empty_carriageways()

    areas = _buffer_by_width(roads, _widths(roads))
    print(f"   ✓ {len(areas)} carriageway areas buffered")
    return areas


def _buffer_by_width(roads: gpd.GeoDataFrame, width: pd.Series) -> gpd.GeoDataFrame:
    """Buffer road lines by half their width (EPSG:25832, columns geometry + width_m)."""
    roads_proj = roads.to_crs("EPSG:25832").rename_geometry("geometry")
    roads_proj = roads_proj.set_geometry(roads_proj.geometry.buffer(width.to_numpy() / 2.0))
    roads_proj["width_m"] = width.to_numpy()
    return roads_proj[["geometry", "width_m"]]


# Default carriageway widths (m) per `road` class of `public.roads`, for roads
# without a width from `_parking_roads` or the OSM `width` tag. Same values as
# `processing/topics/parking/roads/helper/road_width_tags.lua` (keep in sync):
# main roads are narrower when they are oneway (one direction of a dual
# carriageway), all others the same either way. `road` is the highway value with
# a few renames (`road_classification_road_value.lua`): exact match first, then by
# prefix (`residential_priority_road` → residential, `service_*` → service).
WIDTH_FALLBACKS_M = {
    "primary": 18.0,
    "secondary": 14.0,
    "tertiary": 10.0,
    "motorway_link": 9.0,
    "primary_link": 6.0,
    "secondary_link": 6.0,
    "tertiary_link": 6.0,
    "residential": 8.0,
    "unclassified": 8.0,
    "living_street": 5.0,
    "pedestrian": 8.0,
    "unspecified_road": 8.0,  # highway=road
    "bicycle_road": 8.0,
    "service": 4.0,
}
ONEWAY_WIDTH_FALLBACKS_M = {
    "primary": 12.0,
    "secondary": 9.0,
    "tertiary": 7.0,
}
DEFAULT_WIDTH_M = 8.0
# `oneway` values of `public.roads` (`SANITIZE_TAGS.oneway_road`) that count as oneway.
_ONEWAY_VALUES = {"yes", "yes_dual_carriageway"}


def _road_class(road: str) -> str | None:
    if road in WIDTH_FALLBACKS_M:
        return road
    return next((c for c in WIDTH_FALLBACKS_M if road.startswith(c)), None)


def fallback_width(road: str | None, oneway: str | None = None) -> float:
    """Default carriageway width (m) for a `public.roads` class without a known width."""
    if not isinstance(road, str) or not road:
        return DEFAULT_WIDTH_M
    road_class = _road_class(road)
    if road_class is None:
        return DEFAULT_WIDTH_M
    if oneway in _ONEWAY_VALUES and road_class in ONEWAY_WIDTH_FALLBACKS_M:
        return ONEWAY_WIDTH_FALLBACKS_M[road_class]
    return WIDTH_FALLBACKS_M[road_class]


def _widths(roads: gpd.GeoDataFrame) -> pd.Series:
    """`width_m` where known, else `fallback_width` from `road` and `oneway`."""
    width = pd.to_numeric(roads["width_m"], errors="coerce")
    missing = pd.Series(None, index=roads.index, dtype=object)
    road = roads["road"] if "road" in roads else missing
    oneway = roads["oneway"] if "oneway" in roads else missing
    fallback = [fallback_width(r, o) for r, o in zip(road, oneway)]
    return width.fillna(pd.Series(fallback, index=roads.index))


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

    areas = _buffer_by_width(roads, _widths(roads))
    print(f"   ✓ {len(areas)} Tempo 30 carriageway areas buffered")
    return areas
