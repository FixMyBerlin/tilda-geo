"""Reusable geometry helpers for hexagon scoring.

Extracted from `scorer.py` so that the existing factor blocks (cycleways,
obstacles, public transit, …) and the user datasets step use exactly the same
distance and buffer functions.
"""

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely import distance as _shp_distance

# Distance placeholder when a layer is empty (no feature found).
FAR = 1e9


def dist_to_union(centroids: gpd.GeoSeries, features_proj: gpd.GeoDataFrame) -> pd.Series:
    """Distance of each cell to the union of the features. Empty layer → FAR (far everywhere)."""
    if features_proj is None or len(features_proj) == 0:
        return pd.Series(FAR, index=centroids.index)
    union = features_proj.geometry.union_all()
    if union.is_empty:
        return pd.Series(FAR, index=centroids.index)
    return centroids.distance(union)


def buffer_by_geom_type(
    gdf: gpd.GeoDataFrame, point_m: float, line_m: float
) -> gpd.GeoDataFrame:
    """Buffer points/lines of a metric (projected) GeoDataFrame.

    Points are buffered by `point_m`, lines by `line_m`; polygons stay
    unchanged. Expects a GeoDataFrame in a metric CRS (e.g. EPSG:25832).
    Returns a GeoDataFrame with the (partly buffered) geometries; empty input
    is returned unchanged.
    """
    if gdf is None or len(gdf) == 0:
        return gdf
    geoms = gdf.geometry
    types = geoms.geom_type
    buffered = geoms.copy()
    is_point = types.isin(["Point", "MultiPoint"])
    is_line = types.isin(["LineString", "MultiLineString"])
    if is_point.any():
        buffered.loc[is_point] = geoms.loc[is_point].buffer(point_m)
    if is_line.any():
        buffered.loc[is_line] = geoms.loc[is_line].buffer(line_m)
    return gdf.set_geometry(buffered)


def weighted_proximity_sum(
    centroids: gpd.GeoSeries,
    sources_proj: gpd.GeoDataFrame,
    weight_col: str,
    radius_m: float,
) -> pd.Series:
    """Per cell: Σ weight_i × max(0, 1 − d_i / radius) over all sources within the radius.

    The quantity-aware counterpart to `dist_to_union`: there only the distance
    to the nearest geometry counts, here all sources in reach add up with their
    weight. Used by the resident demand factor (weight = residents per
    building); deliberately factor-neutral so other quantity-bearing sources
    (jobs, school places) can reuse it.

    `centroids` and `sources_proj` must be in the same metric CRS
    (e.g. EPSG:25832). Distance is measured to the actual source geometry –
    for polygons to the edge, not the centre. Sources without weight (NaN)
    count as 0.

    Returns: series over the index of `centroids`, 0.0 where nothing is in
    reach (never NaN).
    """
    zero = pd.Series(0.0, index=centroids.index)
    if sources_proj is None or len(sources_proj) == 0 or radius_m <= 0:
        return zero

    src = sources_proj.reset_index(drop=True)
    src = src[src.geometry.notna() & ~src.geometry.is_empty]
    if not len(src):
        return zero
    src = src.reset_index(drop=True)

    # Candidate pairs via the spatial index: buffered source × cell centre.
    # This way only pairs actually within reach are intersected
    # (same pattern as the vegetation/carriageway coverage).
    rings = gpd.GeoDataFrame(geometry=src.geometry.buffer(radius_m), crs=src.crs)
    cells = gpd.GeoDataFrame(geometry=centroids, crs=centroids.crs)
    pairs = gpd.sjoin(cells, rings, how="inner", predicate="within")
    if not len(pairs):
        return zero

    right_idx = pairs["index_right"].to_numpy()
    dist = _shp_distance(pairs.geometry.to_numpy(), src.geometry.to_numpy()[right_idx])
    weights = pd.to_numeric(src[weight_col], errors="coerce").fillna(0.0).to_numpy()[right_idx]
    contrib = weights * np.clip(1.0 - dist / radius_m, 0.0, 1.0)

    summed = pd.Series(contrib, index=pairs.index).groupby(level=0).sum()
    return summed.reindex(centroids.index, fill_value=0.0)
