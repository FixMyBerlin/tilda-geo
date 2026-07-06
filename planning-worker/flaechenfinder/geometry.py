"""Wiederverwendbare Geometrie-Helfer für das Hexagon-Scoring.

Extrahiert aus `scorer.py`, damit sowohl die bestehenden Faktor-Blöcke (Radwege,
Hindernisse, ÖPNV, …) als auch der Eigendaten-Schritt exakt dieselben Distanz-
und Puffer-Funktionen nutzen.
"""

import geopandas as gpd
import pandas as pd

# Distanz-Platzhalter, wenn ein Layer leer ist (kein Feature gefunden).
FAR = 1e9


def dist_to_union(centroids: gpd.GeoSeries, features_proj: gpd.GeoDataFrame) -> pd.Series:
    """Abstand jeder Zelle zum Union der Features. Leerer Layer → FAR (überall fern)."""
    if features_proj is None or len(features_proj) == 0:
        return pd.Series(FAR, index=centroids.index)
    union = features_proj.geometry.union_all()
    if union.is_empty:
        return pd.Series(FAR, index=centroids.index)
    return centroids.distance(union)


def buffer_by_geom_type(
    gdf: gpd.GeoDataFrame, point_m: float, line_m: float
) -> gpd.GeoDataFrame:
    """Puffert Punkte/Linien eines metrischen (projizierten) GeoDataFrame.

    Punkte werden mit `point_m`, Linien mit `line_m` gepuffert; Flächen bleiben
    unverändert. Erwartet ein GeoDataFrame in einem metrischen CRS (z. B.
    EPSG:25832). Gibt ein GeoDataFrame mit den (teils gepufferten) Geometrien
    zurück; leerer Input → unverändert zurück.
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
