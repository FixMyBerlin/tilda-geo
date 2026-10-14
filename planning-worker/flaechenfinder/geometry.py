"""Wiederverwendbare Geometrie-Helfer für das Hexagon-Scoring.

Extrahiert aus `scorer.py`, damit sowohl die bestehenden Faktor-Blöcke (Radwege,
Hindernisse, ÖPNV, …) als auch der Eigendaten-Schritt exakt dieselben Distanz-
und Puffer-Funktionen nutzen.
"""

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely import distance as _shp_distance

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


def weighted_proximity_sum(
    centroids: gpd.GeoSeries,
    sources_proj: gpd.GeoDataFrame,
    weight_col: str,
    radius_m: float,
) -> pd.Series:
    """Je Zelle: Σ gewicht_i × max(0, 1 − d_i / radius) über alle Quellen im Radius.

    Das mengenbehaftete Gegenstück zu `dist_to_union`: dort zählt nur der
    Abstand zur nächsten Geometrie, hier summieren sich alle Quellen in
    Reichweite mit ihrem Gewicht auf. Genutzt vom Bewohnerbedarf-Faktor
    (Gewicht = Einwohner je Gebäude); der Baustein ist bewusst faktorneutral,
    damit weitere mengenbehaftete Quellen (Arbeitsplätze, Schulplätze) ihn
    wiederverwenden können.

    `centroids` und `sources_proj` müssen im selben metrischen CRS liegen
    (z. B. EPSG:25832). Die Distanz wird zur echten Quellgeometrie gemessen –
    bei Polygonen also zur Kante, nicht zum Mittelpunkt. Quellen ohne Gewicht
    (NaN) zählen als 0.

    Rückgabe: Serie über dem Index von `centroids`, 0.0 wo nichts in Reichweite
    liegt (nie NaN).
    """
    zero = pd.Series(0.0, index=centroids.index)
    if sources_proj is None or len(sources_proj) == 0 or radius_m <= 0:
        return zero

    src = sources_proj.reset_index(drop=True)
    src = src[src.geometry.notna() & ~src.geometry.is_empty]
    if not len(src):
        return zero
    src = src.reset_index(drop=True)

    # Kandidatenpaare über den Spatial-Index: gepufferte Quelle × Zellzentrum.
    # Nur so werden ausschließlich die tatsächlich in Reichweite liegenden Paare
    # verschnitten (gleiches Muster wie die Vegetations-/Fahrbahn-Coverage).
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
