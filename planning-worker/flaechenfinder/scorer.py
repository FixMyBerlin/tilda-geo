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

# H3-Auflösungen: BASE ist das feine Scoring-Gitter (hohe Zoomstufen), AGG das
# grobe Aggregat für niedrige Zoomstufen (z < 16). AGG_H3_RES muss mit der
# Zoom-Verzweigung in planning-worker/sql/martin_functions.sql übereinstimmen.
BASE_H3_RES = 13
AGG_H3_RES = 11

# Score-Spalten, die beim Aggregieren gemittelt werden (eignungsklasse wird
# daraus neu abgeleitet, nicht gemittelt).
_SCORE_COLS = [
    "mce_gesamtscore", "score_bedarf", "score_bebauung",
    "score_radweg", "score_bodenbelag", "score_zielorte",
    "score_hangneigung", "score_hindernisfreiheit", "score_oepnv", "score_vegetation",
    "score_kreuzung", "score_parken",
]

# Klassifikationsschwellen für eignungsklasse (identisch in run_flaechenfinder
# und aggregate_hexagons verwendet).
_KLASSE_BINS = [-1, 0, 40, 60, 80, 100]
_KLASSE_LABELS = ["ausgeschlossen", "schlecht", "mittel", "gut", "sehr gut"]


def aggregate_hexagons(hex_proj: gpd.GeoDataFrame, target_res: int = AGG_H3_RES) -> gpd.GeoDataFrame:
    """Aggregiert das feine BASE-Gitter auf eine gröbere H3-Auflösung.

    Für niedrige Zoomstufen: mittelt die Score-Spalten je Elternzelle
    (`h3.cell_to_parent`) und leitet `eignungsklasse` aus dem gemittelten
    Gesamtscore neu ab. Reine Nachverarbeitung der bereits berechneten Werte –
    keine Spatial-Joins, kein I/O.

    Rückgabe: GeoDataFrame in EPSG:25832 mit `h3_id` (= Eltern-Zellindex),
    `resolution`, den gemittelten Score-Spalten und `eignungsklasse`.
    """
    if hex_proj is None or len(hex_proj) == 0:
        return gpd.GeoDataFrame(geometry=[], crs="EPSG:25832")

    df = pd.DataFrame(hex_proj.drop(columns=hex_proj.geometry.name))
    df["parent_id"] = df["h3_id"].map(lambda h: h3.cell_to_parent(h, target_res))

    present = [c for c in _SCORE_COLS if c in df.columns]
    agg = df.groupby("parent_id")[present].mean().round(1).reset_index()
    agg = agg.rename(columns={"parent_id": "h3_id"})
    agg["resolution"] = target_res
    # Gebäude-Flag ist bewusst nur ein Feingitter-Detail (z >= 16). Auf den groben
    # Aggregat-Zellen wäre „keine Bebauung möglich" irreführend, daher immer False –
    # die Spalte muss aber existieren (scenario_hexagons.gebaeude ist NOT NULL).
    agg["gebaeude"] = False
    agg["eignungsklasse"] = pd.cut(
        agg["mce_gesamtscore"], bins=_KLASSE_BINS, labels=_KLASSE_LABELS
    ).astype(str)
    agg["geometry"] = agg["h3_id"].map(
        lambda h: Polygon([(lng, lat) for lat, lng in h3.cell_to_boundary(h)])
    )

    agg_gdf = gpd.GeoDataFrame(agg, geometry="geometry", crs="EPSG:4326")
    print(f"   → {len(agg_gdf)} aggregierte Hexagone (Res {target_res})")
    return agg_gdf.to_crs("EPSG:25832")

# Die 12 fachlichen Schritte des Laufs, in Reihenfolge. Wird sowohl für die
# Log-Ausgabe als auch (via progress_cb) für die Fortschrittsanzeige im UI
# verwendet. Die Namen müssen mit der Schrittliste im Frontend übereinstimmen
# (PlanningSteps.tsx). Schritt 1 (Vegetationsflächen berechnen) und Schritt 12
# (Ergebnisse speichern) laufen außerhalb von run_flaechenfinder() im Worker
# (worker.py); die Nummerierung hier beginnt daher bei 2.
# Kreuzungen (6) und KFZ-Parkflächen (7) sind eigene, sichtbare Ladeschritte –
# nur die reine Bonus-Ableitung passiert später im MCE-Schritt (11).
SCORING_STEPS = [
    "Vegetationsflächen berechnen",
    "H3-Gitter generieren",
    "Radwege laden",
    "Hindernisse & Untergrund laden",
    "ÖPNV-Haltestellen laden",
    "Kreuzungen laden",
    "KFZ-Parkflächen laden",
    "Zielorte bewerten",
    "Hangneigung berechnen",
    "Vegetationsabdeckung verschneiden",
    "MCE-Score berechnen",
    "Ergebnisse speichern",
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
    h3_resolution: int = BASE_H3_RES,
    osm_loader=None,
    vegetation_gdf=None,
    progress_cb=None,
):
    """Berechnet das H3-Scoring-Gitter mit MCE-Score je Hexagon.

    Gibt das Hexagon-GeoDataFrame in EPSG:25832 (metrisch) zurück. Schreibt
    KEINE Dateien – die Persistenz übernimmt der Worker (results.py).

    `vegetation_gdf` (optional, EPSG:25832) enthält die on-demand berechneten
    Vegetationspolygone; daraus wird der Bedeckungsgrad je Hexagon abgeleitet.

    `progress_cb` (optional) wird vor jedem der hier ausgeführten Schritte
    (step:int 2..11, total:int, label:str) aufgerufen, damit der Worker den
    aktuellen Schritt an das UI weiterreichen kann. Schritt 1 (Vegetations-
    flächen berechnen) und Schritt 12 (Ergebnisse speichern) meldet der
    Worker selbst, außerhalb dieser Funktion.
    """

    def _step(n: int):
        """Loggt den n-ten Schritt (1-basiert) und meldet ihn via progress_cb."""
        label = SCORING_STEPS[n - 1]
        print(f"\n[{n}/{SCORING_STEP_COUNT}] {label}...")
        if progress_cb is not None:
            progress_cb(n, SCORING_STEP_COUNT, label)

    print(f"\n🚀 Flächenfinder gestartet: {use_case.name}")
    print(f"   H3-Auflösung: {h3_resolution} | DEM: {use_case.dem_source}")

    # ── 2. H3-Gitter ──────────────────────────────────────────────
    _step(2)
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
        return hex_gdf.to_crs("EPSG:25832")

    latlng_points = list(zip(hex_gdf["zentrum_lng"], hex_gdf["zentrum_lat"]))
    hex_proj = hex_gdf.to_crs("EPSG:25832")
    hex_proj["resolution"] = h3_resolution
    del rows, hex_gdf
    centroids = hex_proj.geometry.centroid

    # ── 3. Radwege (PostGIS) ──────────────────────────────────────
    _step(3)
    cycleways = tilda_loader.load_cycleways(study_area_geom)
    cycleway_proj = cycleways.to_crs("EPSG:25832") if len(cycleways) else cycleways
    hex_proj["abstand_radweg_m"] = _dist_to_union(centroids, cycleway_proj)
    del cycleways, cycleway_proj

    # ── 4. Hindernisse / Untergrund ───────────────────────────────
    _step(4)
    obstacles = osm_loader.features_from_polygon(study_area_geom, {
        "building": True,
        "landuse": ["grass", "forest", "meadow"],
        "natural": ["water", "wood"],
    })
    obstacles_proj = obstacles.to_crs("EPSG:25832") if len(obstacles) else obstacles
    hex_proj["abstand_hindernis_m"] = _dist_to_union(centroids, obstacles_proj)
    del obstacles, obstacles_proj

    # Gebäude aus tilda DB: Hexagone mit Gebäudeüberschneidung werden hart ausgeschlossen.
    buildings = tilda_loader.load_buildings(study_area_geom)
    if len(buildings):
        # load_buildings() liefert die Geometrie in der Spalte "geom" (SELECT … AS geom);
        # auf "geometry" normalisieren, damit die Spaltenauswahl unten passt.
        buildings_proj = buildings.to_crs("EPSG:25832").rename_geometry("geometry")
        hexes = hex_proj[["geometry"]].copy()
        pairs = gpd.sjoin(hexes, buildings_proj[["geometry"]], how="inner", predicate="intersects")
        hex_proj["gebaeude"] = hex_proj.index.isin(pairs.index)
        del hexes, pairs, buildings_proj
    else:
        hex_proj["gebaeude"] = False
    del buildings

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

    # ── 5. ÖPNV-Haltestellen ──────────────────────────────────────
    # Nur bei Gewicht > 0 laden – sonst die vier Transit-Queries sparen und
    # score_oepnv als NaN (→ DB NULL, Sidebar „–") markieren.
    _step(5)
    if (use_case.weights.get("w_transit", 0) or 0) > 0:
        _TRANSIT_TYPES = [
            ("U-Bahn-Eingang", {"railway": "subway_entrance"}, 50),
            ("Straßenbahn",    {"railway": "tram_stop"},       50),
            # Bus bleibt vorerst wirkungslos: highway=bus_stop wird in
            # public."publicTransport" nicht abgelegt (siehe postgis_loader.py),
            # daher liefert features_from_polygon() hier immer 0 Treffer.
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
    else:
        hex_proj["score_oepnv"] = np.nan

    # ── 6. Kreuzungen laden ───────────────────────────────────────
    # Bordstein-Ecken für den Kreuzungs-Bonus. Nur bei Gewicht > 0 den (teuren)
    # PostGIS-Query fahren; sonst abstand_kreuzung_m als NaN markieren. Die
    # Bonus-Ableitung selbst passiert im MCE-Schritt (11) aus dieser Distanz.
    _step(6)
    if (use_case.weights.get("w_intersection", 0) or 0) > 0:
        corners = tilda_loader.load_intersection_corners(study_area_geom)
        corners_proj = corners.to_crs("EPSG:25832") if len(corners) else corners
        hex_proj["abstand_kreuzung_m"] = _dist_to_union(centroids, corners_proj)
        del corners, corners_proj
    else:
        hex_proj["abstand_kreuzung_m"] = np.nan

    # ── 7. KFZ-Parkflächen laden ──────────────────────────────────
    # KFZ-Parkflächen für den Umwidmungs-Bonus. Nur bei Gewicht > 0 laden; sonst
    # abstand_parken_m als NaN markieren. Bonus-Ableitung im MCE-Schritt (11).
    _step(7)
    if (use_case.weights.get("w_parken", 0) or 0) > 0:
        parken = tilda_loader.load_car_parking(study_area_geom)
        parken_proj = parken.to_crs("EPSG:25832") if len(parken) else parken
        hex_proj["abstand_parken_m"] = _dist_to_union(centroids, parken_proj)
        del parken, parken_proj
    else:
        hex_proj["abstand_parken_m"] = np.nan

    # ── 8. Zielorte ────────────────────────────────────────────────
    # Nur bei Gewicht > 0 laden – sonst die OSM-Zielort-Queries sparen und
    # score_zielorte als NaN (→ DB NULL, Sidebar „–") markieren.
    _step(8)
    if (use_case.weights.get("w_target", 0) or 0) > 0:
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
    else:
        hex_proj["score_zielorte"] = np.nan

    # ── 9. DEM / Hangneigung ─────────────────────────────────────────
    _step(9)
    hex_proj["hangneigung_grad"] = dem_adapter.get_slopes(latlng_points)
    del latlng_points

    # ── 10. Vegetationsabdeckung verschneiden ───────────────────────
    # Nur berechnen, wenn der Faktor auch gewichtet ist – sonst dient die
    # Vegetation nur als Anzeige-Layer und die teure Verschneidung entfällt.
    _step(10)
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

    # ── 11. MCE-Scoring ────────────────────────────────────────────
    _step(11)
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

    # ── Basis-Score: gewichtete Summe der sechs positiven Faktoren ─────────
    # Vegetation ist KEIN additiver Faktor mehr, sondern ein separater Abzug
    # (bzw. Bonus) weiter unten – sonst könnte die Summe der Gewichte 100
    # übersteigen. Übersprungene Faktoren (ÖPNV/Zielorte bei Gewicht 0) haben
    # eine NaN-Score-Spalte; `_term` überspringt sie als Skalar 0.0, damit die
    # Summe nicht durch `NaN * 0 = NaN` vergiftet wird.
    def _term(col, wkey):
        wv = w.get(wkey, 0) or 0
        return hex_proj[col] * wv if wv else 0.0

    base_score = (
        _term("score_radweg",            "w_cyclepath") +
        _term("score_bodenbelag",        "w_surface")   +
        _term("score_zielorte",          "w_target")    +
        _term("score_hangneigung",       "w_slope")     +
        _term("score_hindernisfreiheit", "w_clearance") +
        _term("score_oepnv",             "w_transit")
    )

    # ── Vegetations-Effekt: stufenloser Abzug bzw. Bonus ───────────────────
    # `w_vegetation` (0–1) ist der maximale Effekt in Punkten (× 100). Unter der
    # Toleranzschwelle bleibt der Effekt 0, darüber steigt er linear bis zum
    # Maximum bei 100 % Bedeckung.
    #   direction "negative" (Grün schützen)   → Abzug
    #   direction "positive" (Grün bevorzugen) → Bonus
    # `score_vegetation` hält den tatsächlich angewandten Effekt in Punkten
    # (0 .. w_vegetation*100); ohne Gewicht NaN (→ DB NULL, Sidebar zeigt „–"),
    # da die Coverage dann gar nicht berechnet wurde.
    w_veg = w.get("w_vegetation", 0) or 0
    if w_veg > 0:
        thr = use_case.vegetation_penalty_threshold_pct
        span = max(1.0, 100.0 - thr)
        ramp = ((hex_proj["vegetation_coverage_pct"] - thr) / span).clip(0.0, 1.0)
        veg_effect = (w_veg * 100.0) * ramp
        hex_proj["score_vegetation"] = veg_effect.round(1)
        sign = 1.0 if use_case.vegetation_direction == "positive" else -1.0
        veg_delta = sign * veg_effect
    else:
        hex_proj["score_vegetation"] = np.nan
        veg_delta = 0.0

    # ── Kreuzungs-Bonus: stufenloser Zuschlag nahe Bordstein-Ecken ─────────
    # Radabstellanlagen lassen sich an Straßenecken gut platzieren – ideal
    # ~5–8 m von der Bordsteinecke entfernt (nicht in der Kreuzungsmitte). Der
    # Bonus ist ein Modifier auf den Basis-Score (wie Vegetation); `w_intersection`
    # (0–1) ist der maximale Zuschlag in Punkten (× 100). Die Ecken-Distanz
    # `abstand_kreuzung_m` wurde bereits in Schritt 6 geladen (NaN ohne Gewicht);
    # ohne Gewicht bleibt auch `score_kreuzung` NaN (→ DB NULL).
    w_kreuz = w.get("w_intersection", 0) or 0
    if w_kreuz > 0:
        abstand_kreuzung = hex_proj["abstand_kreuzung_m"]
        _lo = use_case.intersection_ideal_min_m
        _hi = min(use_case.intersection_ideal_max_m, use_case.intersection_radius_m)
        _r = use_case.intersection_radius_m

        def _kreuz_faktor(d, lo=_lo, hi=_hi, r=_r):
            if d <= 0:
                return 0.0
            if d < lo:
                return d / lo if lo > 0 else 1.0
            if d <= hi:
                return 1.0
            if d <= r:
                return max(0.0, (r - d) / max(1.0, r - hi))
            return 0.0

        kreuz_bonus = (w_kreuz * 100.0) * abstand_kreuzung.apply(_kreuz_faktor)
        hex_proj["score_kreuzung"] = kreuz_bonus.round(1)
        kreuz_delta = kreuz_bonus
    else:
        hex_proj["score_kreuzung"] = np.nan
        kreuz_delta = 0.0

    # ── Parken-Bonus: Zuschlag auf/nahe KFZ-Parkflächen ────────────────────
    # Bestehende KFZ-Parkflächen (public.parkings / parkings_separate) lassen
    # sich gut in Radabstellanlagen umwidmen. Der Bonus ist ein Modifier auf den
    # Basis-Score (wie Kreuzung); `w_parken` (0–1) ist der maximale Zuschlag in
    # Punkten (× 100). Anders als bei der Kreuzung ist der Bonus maximal, wenn das
    # Hexagon direkt auf der Parkfläche liegt (Distanz 0), und fällt linear bis
    # `parken_radius_m` auf 0 ab. Die Flächen-Distanz `abstand_parken_m` wurde
    # bereits in Schritt 7 geladen (NaN ohne Gewicht); ohne Gewicht bleibt auch
    # `score_parken` NaN (→ DB NULL).
    w_parken = w.get("w_parken", 0) or 0
    if w_parken > 0:
        abstand_parken = hex_proj["abstand_parken_m"]
        _pr = use_case.parken_radius_m

        def _parken_faktor(d, r=_pr):
            if d <= 0:      # Hexagon liegt auf der Parkfläche → voller Bonus
                return 1.0
            if d <= r:
                return max(0.0, (r - d) / max(1.0, r))
            return 0.0

        parken_bonus = (w_parken * 100.0) * abstand_parken.apply(_parken_faktor)
        hex_proj["score_parken"] = parken_bonus.round(1)
        parken_delta = parken_bonus
    else:
        hex_proj["score_parken"] = np.nan
        parken_delta = 0.0

    # ── Gesamtscore (Kombination) – unverändert gegenüber früher ───────────
    # `total` ist bit-identisch zur alten Formel `base_score ± veg + kreuz +
    # parken`; die Modifier liegen jetzt nur als eigene Delta-Serien vor, damit
    # sie unten für die Bebauungswahrscheinlichkeit wiederverwendbar sind.
    total = base_score + veg_delta + kreuz_delta + parken_delta
    # Gesamtscore auf [0, 100] begrenzen – darf nie unter 0 fallen.
    hex_proj["mce_gesamtscore"] = total.clip(lower=0.0, upper=100.0).round(1)

    # ── Teil-Scores: Bedarf vs. Bebauung (Issue #3415) ─────────────────────
    # Die Hexagon-Scores vermischen zwei fachlich getrennte Fragen. Sie werden
    # hier zusätzlich als zwei getrennt normalisierte 0–100-Ansichten berechnet
    # (die Kombination `mce_gesamtscore` oben bleibt davon unberührt):
    #   Bedarf  („will hier parken")  → ÖPNV (w_transit), Zielorte (w_target)
    #   Bebauung („kann hier bauen") → Radweg (w_cyclepath), Untergrund
    #       (w_surface), Hangneigung (w_slope), Hindernisfreiheit (w_clearance)
    #       + Modifier Vegetation, Kreuzungen, Parken; harte Ausschlüsse.
    # Jede Gruppe wird durch die Summe ihrer aktiven Gewichte geteilt, damit der
    # Teil-Score unabhängig von der Gewichtsverteilung 0–100 bleibt. Ist eine
    # Gruppe komplett ungewichtet, bleibt ihr Score NaN (→ DB NULL).
    def _group_score(terms):
        wsum = sum((w.get(k, 0) or 0) for _, k in terms)
        if wsum <= 0:
            return pd.Series(np.nan, index=hex_proj.index)
        raw = sum(_term(col, k) for col, k in terms)
        return raw / wsum

    score_bedarf = _group_score(
        [("score_oepnv", "w_transit"), ("score_zielorte", "w_target")]
    ).clip(lower=0.0, upper=100.0)

    base_bebauung = _group_score(
        [("score_radweg", "w_cyclepath"), ("score_bodenbelag", "w_surface"),
         ("score_hangneigung", "w_slope"), ("score_hindernisfreiheit", "w_clearance")]
    )
    score_bebauung = (base_bebauung + veg_delta + kreuz_delta + parken_delta).clip(
        lower=0.0, upper=100.0
    )

    hex_proj["score_bedarf"] = score_bedarf.round(1)
    hex_proj["score_bebauung"] = score_bebauung.round(1)

    # Harte Ausschlusskriterien sind ausschließlich Bebauungs-Kriterien: sie
    # nullen Bebauung UND Kombination, aber NICHT den Bedarf (der Bedarf besteht
    # auch dort, wo nicht gebaut werden kann).
    exclusion = (
        (hex_proj["score_hangneigung"]       == 0) |
        (hex_proj["score_hindernisfreiheit"] == 0) |
        (hex_proj["score_bodenbelag"]        < use_case.min_surface_score) |
        (hex_proj["abstand_radweg_m"]        > use_case.max_cyclepath_dist_m) |
        hex_proj["gebaeude"]
    )
    hex_proj.loc[exclusion, "mce_gesamtscore"] = 0.0
    hex_proj.loc[exclusion, "score_bebauung"] = 0.0

    hex_proj["eignungsklasse"] = pd.cut(
        hex_proj["mce_gesamtscore"], bins=_KLASSE_BINS, labels=_KLASSE_LABELS
    ).astype(str)

    print(f"\n✅ Fertig: {len(hex_proj)} Hexagone")
    return hex_proj
