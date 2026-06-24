import h3
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Polygon

from .config import UseCaseConfig
from .dem import DEMAdapter
from .tilda import TildaLoader


SURFACE_SCORES = {
    "asphalt": 100, "paved": 100, "concrete": 95,
    "paving_stones": 85, "compacted": 60,
    "gravel": 30, "unpaved": 10, "grass": 0, "dirt": 0,
    None: 40,
}

# Distanz-Platzhalter, wenn ein Layer leer ist (kein Feature gefunden).
_FAR = 1e9

# Die 7 fachlichen Schritte des Scorings, in Reihenfolge. Wird sowohl für die
# Log-Ausgabe als auch (via progress_cb) für die Fortschrittsanzeige im UI
# verwendet. Die Namen müssen mit der Schrittliste im Frontend übereinstimmen
# (PlanningSteps.tsx).
SCORING_STEPS = [
    "H3-Gitter generieren",
    "Radwege laden",
    "Hindernisse & Untergrund laden",
    "ÖPNV-Haltestellen laden",
    "Zielorte bewerten",
    "Hangneigung & Vegetation berechnen",
    "MCE-Score berechnen",
]
SCORING_STEP_COUNT = len(SCORING_STEPS)


def _dist_to_union(centroids: gpd.GeoSeries, features_proj: gpd.GeoDataFrame) -> pd.Series:
    """Abstand jeder Zelle zum Union der Features. Leerer Layer → _FAR (überall fern)."""
    if features_proj is None or len(features_proj) == 0:
        return pd.Series(_FAR, index=centroids.index)
    union = features_proj.geometry.union_all()
    if union.is_empty:
        return pd.Series(_FAR, index=centroids.index)
    return centroids.distance(union)


def run_flaechenfinder(
    study_area_geom,
    use_case: UseCaseConfig,
    dem_adapter: DEMAdapter,
    tilda_loader: TildaLoader,
    h3_resolution: int = 13,
    osm_loader=None,
    vegetation_gdf=None,
    progress_cb=None,
):
    """Berechnet das H3-Scoring-Gitter und die abgeleiteten Potentialflächen.

    Gibt ein Tupel (hex_gdf, areas_gdf) zurück, beide in EPSG:25832 (metrisch).
    Schreibt KEINE Dateien – die Persistenz übernimmt der Worker (results.py).

    `vegetation_gdf` (optional, EPSG:25832) enthält die on-demand berechneten
    Vegetationspolygone; daraus wird der Bedeckungsgrad je Hexagon abgeleitet.

    `progress_cb` (optional) wird vor jedem der 7 Schritte mit
    (step:int 1..7, total:int, label:str) aufgerufen, damit der Worker den
    aktuellen Schritt an das UI weiterreichen kann.
    """

    def _step(n: int):
        """Loggt den n-ten Schritt (1-basiert) und meldet ihn via progress_cb."""
        label = SCORING_STEPS[n - 1]
        print(f"\n[{n}/{SCORING_STEP_COUNT}] {label}...")
        if progress_cb is not None:
            progress_cb(n, SCORING_STEP_COUNT, label)

    print(f"\n🚀 Flächenfinder gestartet: {use_case.name}")
    print(f"   H3-Auflösung: {h3_resolution} | DEM: {use_case.dem_source}")

    # ── 1. H3-Gitter ──────────────────────────────────────────────
    _step(1)
    geojson = study_area_geom.__geo_interface__
    hexagons = h3.geo_to_cells(geojson, res=h3_resolution)
    rows = [{
        "h3_id": h,
        "geometry": Polygon([(lng, lat) for lat, lng in h3.cell_to_boundary(h)]),
        "zentrum_lat": h3.cell_to_latlng(h)[0],
        "zentrum_lng": h3.cell_to_latlng(h)[1],
    } for h in hexagons]
    hex_gdf = gpd.GeoDataFrame(rows, crs="EPSG:4326")
    print(f"   → {len(hex_gdf)} Hexagone (Res {h3_resolution})")
    if len(hex_gdf) == 0:
        return hex_gdf.to_crs("EPSG:25832"), gpd.GeoDataFrame(geometry=[], crs="EPSG:25832")

    latlng_points = list(zip(hex_gdf["zentrum_lng"], hex_gdf["zentrum_lat"]))
    hex_proj = hex_gdf.to_crs("EPSG:25832")
    del rows, hex_gdf
    centroids = hex_proj.geometry.centroid

    # ── 2. Radwege (PostGIS) ──────────────────────────────────────
    _step(2)
    cycleways = tilda_loader.load_cycleways(study_area_geom)
    cycleway_proj = cycleways.to_crs("EPSG:25832") if len(cycleways) else cycleways
    hex_proj["abstand_radweg_m"] = _dist_to_union(centroids, cycleway_proj)
    del cycleways, cycleway_proj

    # ── 3. Hindernisse / Untergrund ───────────────────────────────
    _step(3)
    obstacles = osm_loader.features_from_polygon(study_area_geom, {
        "building": True,
        "landuse": ["grass", "forest", "meadow"],
        "natural": ["water", "wood"],
    })
    obstacles_proj = obstacles.to_crs("EPSG:25832") if len(obstacles) else obstacles
    hex_proj["abstand_hindernis_m"] = _dist_to_union(centroids, obstacles_proj)
    del obstacles, obstacles_proj

    try:
        surfaces = osm_loader.features_from_polygon(study_area_geom, {"surface": True})
        if len(surfaces) and "surface" in surfaces.columns:
            surfaces_proj = surfaces[surfaces.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].to_crs("EPSG:25832")
            joined = gpd.sjoin(hex_proj[["geometry"]], surfaces_proj[["geometry", "surface"]],
                               how="left", predicate="intersects")
            hex_proj["bodenbelag_osm"] = joined.groupby(joined.index)["surface"].first()
            del surfaces_proj, joined
        else:
            hex_proj["bodenbelag_osm"] = None
        del surfaces
    except Exception:
        hex_proj["bodenbelag_osm"] = None

    # ── 4. ÖPNV-Haltestellen ──────────────────────────────────────
    _step(4)
    _TRANSIT_TYPES = [
        ("U-Bahn-Eingang", {"railway": "subway_entrance"}, 50),
        ("Straßenbahn",    {"railway": "tram_stop"},       50),
        ("Bus",            {"highway": "bus_stop"},         30),
        ("Bahnhof",        {"railway": ["station", "halt"]}, 100),
    ]
    _transit_scores = []
    for _tname, _ttags, _tradius in _TRANSIT_TYPES:
        try:
            _stops = osm_loader.features_from_polygon(study_area_geom, _ttags)
            if not len(_stops):
                _transit_scores.append(pd.Series(0.0, index=hex_proj.index))
                continue
            _stops_p = _stops.to_crs("EPSG:25832")
            if _tname == "Bahnhof" and "station" in _stops_p.columns:
                _stops_p = _stops_p[_stops_p["station"] != "subway"]
            _dist = _dist_to_union(centroids, _stops_p)
            _score = _dist.apply(lambda d, r=_tradius: max(0.0, 100.0 * (1.0 - d / r)))
            _transit_scores.append(_score)
        except Exception as _e:
            print(f"   ⚠️  {_tname}: {_e}")
            _transit_scores.append(pd.Series(0.0, index=hex_proj.index))
    hex_proj["score_oepnv"] = pd.concat(_transit_scores, axis=1).max(axis=1)
    del _transit_scores

    # ── 5. Zielorte ────────────────────────────────────────────────
    _step(5)
    target_scores = []
    for t in use_case.targets:
        try:
            features = osm_loader.features_from_polygon(study_area_geom, t.osm_tags)
        except Exception:
            features = gpd.GeoDataFrame()
        if not len(features):
            target_scores.append(pd.Series(0.0, index=hex_proj.index))
            continue
        feat_proj = features.to_crs("EPSG:25832")
        dist = _dist_to_union(centroids, feat_proj)
        raw_score = dist.apply(lambda d: max(0.0,
            100.0 - max(0.0, d - t.optimal_dist_m) / max(1.0, t.max_dist_m - t.optimal_dist_m) * 100.0
        ))
        target_scores.append(raw_score * t.weight_in_target)

    if target_scores:
        hex_proj["score_zielorte"] = pd.concat(target_scores, axis=1).max(axis=1)
    else:
        hex_proj["score_zielorte"] = 0.0
    del target_scores

    # ── 6. DEM / Hangneigung + Vegetationsbedeckung ────────────────
    _step(6)
    hex_proj["hangneigung_grad"] = dem_adapter.get_slopes(latlng_points)
    del latlng_points

    # ── 6b. Vegetationsbedeckung (NDVI) ────────────────────────────
    # Nur berechnen, wenn der Faktor auch gewichtet ist – sonst dient die
    # Vegetation nur als Anzeige-Layer und die teure Verschneidung entfällt.
    hex_proj["vegetation_coverage_pct"] = 0.0
    w_veg = use_case.weights.get("w_vegetation", 0) or 0
    if w_veg > 0 and vegetation_gdf is not None and len(vegetation_gdf):
        from shapely import area as _shp_area
        from shapely import intersection as _shp_intersection

        veg_proj = vegetation_gdf.to_crs("EPSG:25832")[["geometry"]].reset_index(drop=True)
        veg_proj = veg_proj[veg_proj.geometry.notna() & ~veg_proj.geometry.is_empty]
        if len(veg_proj):
            hexes = hex_proj[["geometry"]].copy()
            hexes["_hid"] = np.arange(len(hexes))
            hex_area = hex_proj.geometry.area.to_numpy()
            # Kandidatenpaare via Spatial-Index (STRtree) statt union_all –
            # nur tatsächlich überlappende Hexagon/Vegetations-Paare verschneiden.
            pairs = gpd.sjoin(hexes, veg_proj, how="inner", predicate="intersects")
            if len(pairs):
                left = pairs.geometry.to_numpy()
                right = veg_proj.geometry.to_numpy()[pairs["index_right"].to_numpy()]
                pairs = pairs.assign(_ia=_shp_area(_shp_intersection(left, right)))
                cov = (
                    pairs.groupby("_hid")["_ia"].sum()
                    .reindex(np.arange(len(hexes)), fill_value=0.0)
                    .to_numpy()
                )
                hex_proj["vegetation_coverage_pct"] = np.clip(cov / hex_area * 100.0, 0, 100)
            del hexes
        del veg_proj

    # ── 7. MCE-Scoring ─────────────────────────────────────────────
    _step(7)
    w = use_case.weights

    def slope_score(deg):
        if deg <= 2:   return 100.0
        elif deg <= 5: return 100.0 - (deg - 2) / 3 * 40
        elif deg <= 8: return 60.0 - (deg - 5) / 3 * 60
        else:          return 0.0

    hex_proj["score_radweg"] = hex_proj["abstand_radweg_m"].apply(
        lambda d: TildaLoader.score_cycleway_proximity(d, use_case.max_cyclepath_dist_m)
    )
    hex_proj["score_bodenbelag"] = hex_proj["bodenbelag_osm"].apply(lambda t: SURFACE_SCORES.get(t, 40))
    hex_proj["score_hangneigung"] = hex_proj["hangneigung_grad"].apply(slope_score)
    hex_proj["score_hindernisfreiheit"] = hex_proj["abstand_hindernis_m"].apply(
        lambda d: min(100.0, d / 10 * 100) if d >= use_case.min_clearance_m else 0.0
    )

    # Vegetations-Teilscore: Vorzeichen über vegetation_direction gesteuert.
    #   "positive" → mehr Grün = besser; "negative" → mehr Grün = schlechter.
    # Nur wenn der Faktor gewichtet ist; sonst NaN (→ DB NULL, Sidebar zeigt „–"),
    # da die Coverage dann gar nicht berechnet wurde.
    if w.get("w_vegetation", 0):
        cov = hex_proj["vegetation_coverage_pct"]
        hex_proj["score_vegetation"] = (
            cov if use_case.vegetation_direction == "positive" else 100.0 - cov
        )
    else:
        hex_proj["score_vegetation"] = np.nan

    hex_proj["mce_gesamtscore"] = (
        hex_proj["score_radweg"]            * w.get("w_cyclepath", 0) +
        hex_proj["score_bodenbelag"]        * w.get("w_surface",   0) +
        hex_proj["score_zielorte"]          * w.get("w_target",    0) +
        hex_proj["score_hangneigung"]       * w.get("w_slope",     0) +
        hex_proj["score_hindernisfreiheit"] * w.get("w_clearance", 0) +
        hex_proj["score_oepnv"]             * w.get("w_transit",   0) +
        hex_proj["score_vegetation"].fillna(0) * w.get("w_vegetation", 0)
    ).round(1)

    exclusion = (
        (hex_proj["score_hangneigung"]       == 0) |
        (hex_proj["score_hindernisfreiheit"] == 0) |
        (hex_proj["score_bodenbelag"]        < use_case.min_surface_score) |
        (hex_proj["abstand_radweg_m"]        > use_case.max_cyclepath_dist_m)
    )
    hex_proj.loc[exclusion, "mce_gesamtscore"] = 0.0

    hex_proj["eignungsklasse"] = pd.cut(
        hex_proj["mce_gesamtscore"],
        bins=[-1, 0, 40, 60, 80, 100],
        labels=["ausgeschlossen", "schlecht", "mittel", "gut", "sehr gut"]
    ).astype(str)

    # ── Potentialflächen ableiten ──────────────────────────────────
    good = hex_proj[hex_proj["mce_gesamtscore"] >= use_case.min_score_threshold]
    if good.empty:
        print("\n⚠️  Keine Hexagone über Schwellenwert – keine Potentialflächen.")
        areas = gpd.GeoDataFrame(geometry=[], crs="EPSG:25832")
    else:
        areas = good.dissolve(
            aggfunc={"mce_gesamtscore": "mean", "hangneigung_grad": "max"}
        ).explode(index_parts=False)
        areas["flaeche_m2"] = areas.geometry.area
        areas = areas[(areas["flaeche_m2"] >= 12) & (areas["flaeche_m2"] <= 50)]

    print(f"\n✅ Fertig: {len(hex_proj)} Hexagone, {len(areas)} Potentialflächen")
    return hex_proj, areas
