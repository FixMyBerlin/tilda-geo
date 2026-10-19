import h3
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely import area as _shp_area, intersection as _shp_intersection
from shapely.geometry import Polygon
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

from .config import (
    USER_LINE_BUFFER_M,
    USER_POINT_BUFFER_M,
    ZIELORT_CATEGORIES,
    UseCaseConfig,
    oepnv_category_factors,
    zielort_category_factors,
)
from .dem import DEMAdapter
from .eigendaten import combine_eigendaten
from .geometry import (
    buffer_by_geom_type,
    dist_to_union as _dist_to_union,
    weighted_proximity_sum,
)
from .tilda import TildaLoader


# H3 resolutions: BASE is the fine scoring grid (high zoom levels), AGG the coarse
# aggregate for low zoom levels (z < 16). AGG_H3_RES must match the zoom branch in
# planning-worker/sql/martin_functions.sql.
BASE_H3_RES = 13
AGG_H3_RES = 11

# Score columns averaged during aggregation (eignungsklasse is re-derived from
# them, not averaged).
_SCORE_COLS = [
    "mce_gesamtscore", "score_bedarf", "score_bebauung",
    "score_radweg", "score_zielorte",
    "score_hangneigung", "score_oepnv", "score_vegetation",
    "score_kreuzung", "score_parken", "score_platz", "score_fussgaengerzone",
    "score_bestand", "score_eigendaten", "score_bewohnerbedarf",
]

# Classification thresholds for eignungsklasse (shared by run_flaechenfinder
# and aggregate_hexagons).
_KLASSE_BINS = [-1, 0, 40, 60, 80, 100]
_KLASSE_LABELS = ["ausgeschlossen", "schlecht", "mittel", "gut", "sehr gut"]


def aggregate_hexagons(hex_proj: gpd.GeoDataFrame, target_res: int = AGG_H3_RES) -> gpd.GeoDataFrame:
    """Aggregates the fine BASE grid to a coarser H3 resolution.

    For low zoom levels: averages the score columns per parent cell
    (`h3.cell_to_parent`) and re-derives `eignungsklasse` from the averaged
    total score. Pure post-processing of already computed values – no spatial
    joins, no I/O.

    Returns: GeoDataFrame in EPSG:25832 with `h3_id` (= parent cell index),
    `resolution`, the averaged score columns and `eignungsklasse`.
    """
    if hex_proj is None or len(hex_proj) == 0:
        return gpd.GeoDataFrame(geometry=[], crs="EPSG:25832")

    df = pd.DataFrame(hex_proj.drop(columns=hex_proj.geometry.name))
    df["parent_id"] = df["h3_id"].map(lambda h: h3.cell_to_parent(h, target_res))

    present = [c for c in _SCORE_COLS if c in df.columns]
    agg = df.groupby("parent_id")[present].mean().round(1).reset_index()
    agg = agg.rename(columns={"parent_id": "h3_id"})
    agg["resolution"] = target_res
    # The building flag is deliberately a fine-grid detail only (z >= 16). On the coarse
    # aggregate cells "no construction possible" would be misleading, hence always False –
    # but the column must exist (scenario_hexagons.gebaeude is NOT NULL).
    agg["gebaeude"] = False
    # Same reasoning as for "gebaeude": on the coarse aggregate grid a per-fine-cell
    # flag is not meaningful.
    agg["fahrbahn"] = False
    agg["eigendaten_ausschluss"] = False
    # The per-dataset breakdown is a fine-grid detail as well.
    agg["eigendaten_details"] = None
    agg["eignungsklasse"] = pd.cut(
        agg["mce_gesamtscore"], bins=_KLASSE_BINS, labels=_KLASSE_LABELS
    ).astype(str)
    agg["geometry"] = agg["h3_id"].map(
        lambda h: Polygon([(lng, lat) for lat, lng in h3.cell_to_boundary(h)])
    )

    agg_gdf = gpd.GeoDataFrame(agg, geometry="geometry", crs="EPSG:4326")
    print(f"   → {len(agg_gdf)} aggregated hexagons (res {target_res})")
    return agg_gdf.to_crs("EPSG:25832")


def assign_clusters(hex_proj: gpd.GeoDataFrame, min_score: float) -> gpd.GeoDataFrame:
    """Adds `cluster_area_m2`: total area (m²) of the contiguous area a hexagon
    belongs to. Cluster = neighboring (H3-adjacent) cells with
    mce_gesamtscore >= min_score. Cells below the threshold get NaN (→ DB NULL).
    Pure post-processing via H3 neighborhood (h3.grid_disk), no spatial joins.
    Only for the fine BASE grid (res 13).
    """
    hex_proj["cluster_area_m2"] = np.nan
    if hex_proj is None or len(hex_proj) == 0:
        return hex_proj

    mask = hex_proj["mce_gesamtscore"] >= min_score
    ids = hex_proj.loc[mask, "h3_id"].tolist()
    if not ids:
        return hex_proj

    idx_of = {h: i for i, h in enumerate(ids)}
    n = len(ids)

    rows, cols = [], []
    for h, i in idx_of.items():
        for nb in h3.grid_disk(h, 1):        # h + 6 neighbors
            j = idx_of.get(nb)
            if j is not None and j > i:      # each edge only once
                rows.append(i); cols.append(j)

    if rows:
        graph = coo_matrix((np.ones(len(rows)), (rows, cols)), shape=(n, n))
        _, labels = connected_components(graph, directed=False)
    else:
        labels = np.arange(n)                # all single cells

    cell_area = np.fromiter(
        (h3.cell_area(h, unit="m^2") for h in ids), dtype=float, count=n
    )
    area_per_label = pd.Series(cell_area).groupby(labels).transform("sum")
    hex_proj.loc[mask, "cluster_area_m2"] = area_per_label.to_numpy()
    print(f"   → Area clusters: {pd.Series(labels).nunique()} clusters "
          f"from {n} cells (score ≥ {min_score:g})")
    return hex_proj


# The 14 domain steps of a run, in order. Used both for the log output and (via
# progress_cb) for the progress display in the UI, so the names (German UI labels)
# must match the step list in the frontend (SpaceFinderRunSteps.tsx). Step 1
# ("Vegetationsflächen berechnen") and step 14 ("Ergebnisse speichern") run outside
# run_flaechenfinder() in the worker (worker.py); numbering here therefore starts at 2.
# Intersections (7) and car parking areas (8) are separate, visible loading steps –
# only the bonus derivation itself happens later in the MCE step (13).
SCORING_STEPS = [
    "Vegetationsflächen berechnen",
    "H3-Gitter generieren",
    "Radwege laden",
    "Gebäude laden",
    "Bewohnerbedarf laden (Zensus)",
    "ÖPNV + Bikesharing laden",
    "Kreuzungen laden",
    "KFZ-Parkflächen laden",
    "Zielorte laden",
    "Hangneigung berechnen",
    "Vegetationsabdeckung verschneiden",
    "Eigene Daten verschneiden",
    "MCE-Score berechnen",
    "Ergebnisse speichern",
]
SCORING_STEP_COUNT = len(SCORING_STEPS)


def apply_score_exclusion(hex_proj, mask, cols=("mce_gesamtscore",)) -> None:
    """Zeroes the given score columns for all hexagons hit by `mask`.

    Modular hard exclusion: `mask` is a boolean series over `hex_proj`.
    By default only `mce_gesamtscore` is zeroed – e.g. for the user data
    exclusion, which deliberately leaves the demand/buildability sub-scores
    untouched.
    """
    if mask is None or not mask.any():
        return
    for col in cols:
        hex_proj.loc[mask, col] = 0.0


def apply_bebauung_exclusion(hex_proj, mask) -> None:
    """Buildability exclusion: zeroes the combined score AND buildability, keeps demand.

    For the classic buildability criteria (buildings, slope): demand also exists
    where nothing can be built.
    """
    apply_score_exclusion(hex_proj, mask, cols=("mce_gesamtscore", "score_bebauung"))


def _census_demand_sources(
    census_proj: gpd.GeoDataFrame, buildings_proj: gpd.GeoDataFrame | None
) -> gpd.GeoDataFrame:
    """Resident demand sources: census residents aggregated onto building polygons.

    The points from `data.census_population_point` sit on the building centroid.
    For a distance ramp that starts at the building edge, they are assigned to the
    buildings via point-in-polygon and summed per building; the polygon is then the
    source. Points without a building hit – the 0.5 % `cluster_typ='gitter_mitte'`
    plus mismatches between ALKIS (census) and OSM (`public._buildings`) – keep
    their point geometry so their residents are not lost.

    Both GeoDataFrames must be in the same metric CRS. Returns: GeoDataFrame with
    the column `einwohner` and mixed geometries (building polygons + leftover
    points).
    """
    points = census_proj.rename(columns={"total": "einwohner"})
    points["einwohner"] = pd.to_numeric(points["einwohner"], errors="coerce").fillna(0.0)
    points = points[["geometry", "einwohner"]]

    if buildings_proj is None or not len(buildings_proj):
        return points

    bld = buildings_proj[["geometry"]].reset_index(drop=True)
    hits = gpd.sjoin(points, bld, how="left", predicate="within")
    # With overlapping buildings a point hits several times – count only the first
    # hit, otherwise its residents would be summed more than once.
    hits = hits[~hits.index.duplicated(keep="first")]

    matched = hits["index_right"].notna()
    per_building = hits.loc[matched].groupby(
        hits.loc[matched, "index_right"].astype(int)
    )["einwohner"].sum()

    building_sources = bld.loc[per_building.index].copy()
    building_sources["einwohner"] = per_building.to_numpy()
    leftover = hits.loc[~matched, ["geometry", "einwohner"]]

    print(f"   ✓ Census: {int(matched.sum())} of {len(points)} points aggregated onto "
          f"{len(building_sources)} buildings, {int((~matched).sum())} kept as points")
    return gpd.GeoDataFrame(
        pd.concat([building_sources, leftover], ignore_index=True),
        geometry="geometry",
        crs=census_proj.crs,
    )


def _target_demand_sources(
    target_proj: gpd.GeoDataFrame,
    buildings_proj: gpd.GeoDataFrame | None,
    category_factors: dict[str, float],
) -> gpd.GeoDataFrame:
    """Target location sources: POI points (public."poiClassification") aggregated
    onto building polygons – like `_census_demand_sources`, but weighted by presence
    instead of summed. A building with several target locations of the SAME category
    (e.g. supermarket + bakery in one house) counts the same as one with a single
    one – the NUMBER of target locations in a building must not multiply demand
    (user decision). A building is counted once per category, though, because
    categories can be weighted differently: a house with a school AND a supermarket
    is a source for education and for shopping.

    `category_factors` (from `zielort_category_factors`) gives each category's share
    of the full bonus; it becomes the source weight directly. With an even split it
    is 1.0 everywhere – the same behavior as before category weighting.

    Points without a building hit keep their point geometry – a single target
    location without a detected building counts like a building with one.

    Both GeoDataFrames must be in the same metric CRS. Returns: GeoDataFrame with
    the column `ziel_gewicht` (category factor 0–1) and mixed geometries (building
    polygons + leftover points).
    """
    points = target_proj[["geometry", "category"]].copy()
    points["ziel_gewicht"] = (
        points["category"].map(category_factors).astype(float).fillna(0.0)
    )
    # Categories without weight (slider at 0) contribute nothing – drop them right away.
    points = points[points["ziel_gewicht"] > 0]
    if not len(points):
        return gpd.GeoDataFrame(
            {"ziel_gewicht": []}, geometry=[], crs=target_proj.crs
        )

    if buildings_proj is None or not len(buildings_proj):
        return points[["geometry", "ziel_gewicht"]]

    bld = buildings_proj[["geometry"]].reset_index(drop=True)
    hits = gpd.sjoin(points, bld, how="left", predicate="within")
    # Several target locations of the same category in one building count the building
    # only ONCE as a source – not summed as for resident demand, but taken once per
    # (building, category).
    matched = hits["index_right"].notna()
    per_building = (
        hits.loc[matched, ["index_right", "category", "ziel_gewicht"]]
        .astype({"index_right": int})
        .drop_duplicates(subset=["index_right", "category"])
    )
    building_sources = bld.loc[per_building["index_right"].to_numpy()].copy()
    building_sources["ziel_gewicht"] = per_building["ziel_gewicht"].to_numpy()
    leftover = hits.loc[~matched, ["geometry", "ziel_gewicht"]].copy()

    print(f"   ✓ Target locations: {int(matched.sum())} of {len(points)} points aggregated onto "
          f"{len(building_sources)} building-category sources, "
          f"{int((~matched).sum())} kept as points")
    return gpd.GeoDataFrame(
        pd.concat([building_sources, leftover], ignore_index=True),
        geometry="geometry",
        crs=target_proj.crs,
    )


def run_flaechenfinder(
    study_area_geom,
    use_case: UseCaseConfig,
    dem_adapter: DEMAdapter,
    tilda_loader: TildaLoader,
    h3_resolution: int = BASE_H3_RES,
    osm_loader=None,
    vegetation_gdf=None,
    carriageway_gdf=None,
    user_datasets=None,
    eigendaten_weights=None,
    progress_cb=None,
):
    """Computes the H3 scoring grid with an MCE score per hexagon.

    Returns the hexagon GeoDataFrame in EPSG:25832 (metric). Writes NO files –
    the worker handles persistence (results.py).

    `vegetation_gdf` (optional, EPSG:25832) holds the vegetation polygons computed
    on demand; the coverage per hexagon is derived from it.

    `carriageway_gdf` (optional, EPSG:25832) holds the road surfaces precomputed by
    the worker and buffered by their width
    (`flaechenfinder.carriageways.compute_carriageway_areas`) – only set when
    `use_case.exclude_carriageways` was active. Used here only for the hard
    buildability exclusion; the worker renders the map layer directly from the
    same GeoDataFrame (see `results.py`).

    `progress_cb` (optional) is called before each step run here
    (step:int 2..13, total:int, label:str) so the worker can pass the current step
    on to the UI. The worker reports step 1 ("Vegetationsflächen berechnen") and
    step 14 ("Ergebnisse speichern") itself, outside this function.
    """

    def _step(n: int):
        """Logs the n-th step (1-based) and reports it via progress_cb."""
        label = SCORING_STEPS[n - 1]
        print(f"\n[{n}/{SCORING_STEP_COUNT}] {label}...")
        if progress_cb is not None:
            progress_cb(n, SCORING_STEP_COUNT, label)

    print(f"\n🚀 Flächenfinder started: {use_case.name}")
    print(f"   H3 resolution: {h3_resolution} | DEM: {use_case.dem_source}")

    # ── 2. H3 grid ────────────────────────────────────────────────
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
    print(f"   → {len(hex_gdf)} hexagons (res {h3_resolution})")
    if len(hex_gdf) == 0:
        return hex_gdf.to_crs("EPSG:25832")

    latlng_points = list(zip(hex_gdf["zentrum_lng"], hex_gdf["zentrum_lat"]))
    hex_proj = hex_gdf.to_crs("EPSG:25832")
    hex_proj["resolution"] = h3_resolution
    del rows, hex_gdf
    centroids = hex_proj.geometry.centroid

    # ── 3. Cycleways (PostGIS) ────────────────────────────────────
    # Cycleway proximity is a demand factor (no longer an exclusion). Load only with
    # weight > 0; otherwise mark abstand_radweg_m as NaN (→ score_radweg NaN → DB NULL).
    _step(3)
    if (use_case.weights.get("w_cyclepath", 0) or 0) > 0:
        cycleways = tilda_loader.load_cycleways(study_area_geom)
        cycleway_proj = cycleways.to_crs("EPSG:25832") if len(cycleways) else cycleways
        hex_proj["abstand_radweg_m"] = _dist_to_union(centroids, cycleway_proj)
        del cycleways, cycleway_proj
    else:
        hex_proj["abstand_radweg_m"] = np.nan

    # ── 4. Buildings ───────────────────────────────────────────────
    _step(4)
    # Buildings from the tilda DB: only hexagons whose area is covered by a building
    # to more than GEBAEUDE_EXCLUSION_COVERAGE are hard-excluded (like
    # FAHRBAHN_EXCLUSION_COVERAGE below). Hexagons that touch a building only to a
    # smaller share (e.g. at the edge) stay buildable and keep their full value –
    # the exclusion should hit the building itself, not its surroundings.
    GEBAEUDE_EXCLUSION_COVERAGE = 2 / 3
    buildings = tilda_loader.load_buildings(study_area_geom)
    # Resident demand (step 5) and target locations (step 9) need the same polygons:
    # their point sources (census or poiClassification) are aggregated onto them and
    # the distance ramp is measured from the building edge. Keep only with weight > 0 –
    # otherwise free them right away as before.
    keep_buildings = (
        (use_case.weights.get("w_bewohnerbedarf", 0) or 0) > 0
        or (use_case.weights.get("w_target", 0) or 0) > 0
    )
    buildings_for_demand = None
    if len(buildings):
        # load_buildings() returns the geometry in the column "geom" (SELECT … AS geom);
        # normalize to "geometry" so the column selection below works.
        buildings_proj = buildings.to_crs("EPSG:25832").rename_geometry("geometry")
        hexes = hex_proj[["geometry"]].copy()
        hexes["_hid"] = np.arange(len(hexes))
        hex_area = hex_proj.geometry.area.to_numpy()
        pairs = gpd.sjoin(hexes, buildings_proj[["geometry"]], how="inner", predicate="intersects")
        coverage = np.zeros(len(hexes))
        if len(pairs):
            left = pairs.geometry.to_numpy()
            right = buildings_proj.geometry.to_numpy()[pairs["index_right"].to_numpy()]
            pairs = pairs.assign(_ia=_shp_area(_shp_intersection(left, right)))
            coverage = (
                pairs.groupby("_hid")["_ia"].sum()
                .reindex(np.arange(len(hexes)), fill_value=0.0)
                .to_numpy()
            )
        hex_proj["gebaeude"] = (coverage / hex_area) >= GEBAEUDE_EXCLUSION_COVERAGE
        if keep_buildings:
            buildings_for_demand = buildings_proj[["geometry"]].reset_index(drop=True)
        del hexes, pairs, buildings_proj
    else:
        hex_proj["gebaeude"] = False
    del buildings

    # "Fahrbahnen ausschließen" (checkbox, no weight): the road surfaces pre-buffered
    # by the worker (carriageway_gdf) are hard-excluded like buildings – but only
    # when the carriageway covers most of the hexagon area
    # (> FAHRBAHN_EXCLUSION_COVERAGE), not on every tiny edge contact. Loading and
    # buffering happens once in the worker (see flaechenfinder.carriageways) so the
    # same GeoDataFrame can be reused for the map layer
    # (planning.scenario_carriageways).
    FAHRBAHN_EXCLUSION_COVERAGE = 2 / 3
    if use_case.exclude_carriageways and carriageway_gdf is not None and len(carriageway_gdf):
        roads_proj = carriageway_gdf.to_crs("EPSG:25832") if carriageway_gdf.crs != "EPSG:25832" else carriageway_gdf
        roads_proj = roads_proj[["geometry"]].reset_index(drop=True)
        hexes = hex_proj[["geometry"]].copy()
        hexes["_hid"] = np.arange(len(hexes))
        hex_area = hex_proj.geometry.area.to_numpy()
        pairs = gpd.sjoin(hexes, roads_proj, how="inner", predicate="intersects")
        coverage = np.zeros(len(hexes))
        if len(pairs):
            left = pairs.geometry.to_numpy()
            right = roads_proj.geometry.to_numpy()[pairs["index_right"].to_numpy()]
            pairs = pairs.assign(_ia=_shp_area(_shp_intersection(left, right)))
            coverage = (
                pairs.groupby("_hid")["_ia"].sum()
                .reindex(np.arange(len(hexes)), fill_value=0.0)
                .to_numpy()
            )
        hex_proj["fahrbahn"] = (coverage / hex_area) > FAHRBAHN_EXCLUSION_COVERAGE
        del hexes, pairs, roads_proj
    else:
        hex_proj["fahrbahn"] = False

    # ── 5. Resident demand (census) ───────────────────────────────
    # Resident points from `data.census_population_point` (census 2022, disaggregated
    # to buildings) create demand around inhabited buildings – regardless of age, only
    # `total` counts. The points sit on the building centroid; so the ramp starts at
    # the BUILDING EDGE (not at its center), they are aggregated via point-in-polygon
    # onto the buildings loaded in step 4 (`_census_demand_sources`). The result is
    # the weighted neighborhood sum `bewohner_ew`: residents, decreasing linearly with
    # distance. The bonus derivation happens in the MCE step (13). Loaded only with
    # weight > 0; otherwise `bewohner_ew` stays NaN (→ score_bewohnerbedarf NaN → DB NULL).
    _step(5)
    hex_proj["bewohner_ew"] = np.nan
    if (use_case.weights.get("w_bewohnerbedarf", 0) or 0) > 0:
        census = tilda_loader.load_census_population(study_area_geom)
        if len(census):
            # load_census_population() returns the geometry in the column "geom"
            # (SELECT … AS geom) – normalize to "geometry" like the buildings above.
            census_proj = (
                census.to_crs("EPSG:25832")
                .rename_geometry("geometry")[["geometry", "total"]]
                .reset_index(drop=True)
            )
            sources = _census_demand_sources(census_proj, buildings_for_demand)
            hex_proj["bewohner_ew"] = weighted_proximity_sum(
                centroids, sources, "einwohner", use_case.bewohnerbedarf_radius_m
            )
            print(f"   → {len(sources)} demand sources with "
                  f"{sources['einwohner'].sum():.0f} residents, reach "
                  f"{use_case.bewohnerbedarf_radius_m:g} m")
            del census_proj, sources
        else:
            hex_proj["bewohner_ew"] = 0.0
        del census

    # ── 6. Public transport stops + bikesharing ───────────────────
    # Load only with weight > 0 – otherwise skip the transit queries and mark
    # score_oepnv as NaN (→ DB NULL, sidebar shows "–").
    _step(6)
    if (use_case.weights.get("w_transit", 0) or 0) > 0:
        # The five classic stop types stay combined internally via max() (the nearest
        # type counts) — the UI ratio "ÖPNV vs. Bikesharing" only applies afterwards,
        # between this group and the separately loaded bikesharing type (see below).
        _TRANSIT_TYPES = [
            # Subway entrance and station building have no publicTransport tag dict entry
            # but their own table/loader, see below.
            ("U-Bahn-Eingang",   None,                          50),
            ("Straßenbahn",      {"railway": "tram_stop"},       50),
            ("Bus",              {"highway": "bus_stop"},         30),
            ("Bahnhof",          {"railway": ["station", "halt"]}, 100),
            # Station building (building=train_station): parking should be as close to
            # the building as possible, not just to the platform/station point.
            ("Bahnhofsgebäude",  None,                          100),
        ]
        _transit_scores = []
        for _tname, _ttags, _tradius in _TRANSIT_TYPES:
            try:
                if _tname == "U-Bahn-Eingang":
                    _stops = osm_loader.load_subway_entrances(study_area_geom)
                elif _tname == "Bahnhofsgebäude":
                    _stops = osm_loader.load_train_station_buildings(study_area_geom)
                else:
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
        _oepnv_group_score = pd.concat(_transit_scores, axis=1).max(axis=1)
        del _transit_scores

        # Bikesharing (poiClassification, *=bicycle_rental): own group; like bus stops a
        # "last mile" access point, hence the same 30 m radius.
        try:
            _bike_stops = osm_loader.load_bikesharing(study_area_geom)
            if len(_bike_stops):
                _bike_stops_p = _bike_stops.to_crs("EPSG:25832")
                _bike_dist = _dist_to_union(centroids, _bike_stops_p)
                _bikesharing_score = _bike_dist.apply(lambda d: max(0.0, 100.0 * (1.0 - d / 30)))
            else:
                _bikesharing_score = pd.Series(0.0, index=hex_proj.index)
        except Exception as _e:
            print(f"   ⚠️  Bikesharing: {_e}")
            _bikesharing_score = pd.Series(0.0, index=hex_proj.index)

        # Ratio between the two groups (see `oepnv_category_factors`): the more heavily
        # weighted group contributes its sub-score fully, the weaker one proportionally.
        # Unlike the previous max(), both groups can add up to the cap of 100 — a hexagon
        # near a bus stop AND bikesharing thus scores better than one near only one of them
        # (user decision, deliberately also changes the even-split behavior).
        _oepnv_factors = oepnv_category_factors(use_case.oepnv_category_shares)
        _oepnv_frac = (_oepnv_group_score / 100.0) * _oepnv_factors["ÖPNV"]
        _bikesharing_frac = (_bikesharing_score / 100.0) * _oepnv_factors["Bikesharing"]
        hex_proj["score_oepnv"] = ((_oepnv_frac + _bikesharing_frac).clip(0.0, 1.0) * 100.0).round(1)
        del _oepnv_group_score, _bikesharing_score, _oepnv_frac, _bikesharing_frac
    else:
        hex_proj["score_oepnv"] = np.nan

    # ── 7. Load intersections ─────────────────────────────────────
    # Curb corners for the intersection bonus. Run the (expensive) PostGIS query only
    # with weight > 0; otherwise mark abstand_kreuzung_m as NaN. The bonus itself is
    # derived from this distance in the MCE step (13).
    _step(7)
    if (use_case.weights.get("w_intersection", 0) or 0) > 0:
        corners = tilda_loader.load_intersection_corners(study_area_geom)
        corners_proj = corners.to_crs("EPSG:25832") if len(corners) else corners
        hex_proj["abstand_kreuzung_m"] = _dist_to_union(centroids, corners_proj)
        del corners, corners_proj
    else:
        hex_proj["abstand_kreuzung_m"] = np.nan

    # Pedestrian zone corners (street × pedestrian zone) – same corner mechanism, but
    # own loader/weight. Run the PostGIS query only with weight > 0.
    # Bonus derivation also in the MCE step (13).
    if (use_case.weights.get("w_fussgaengerzone", 0) or 0) > 0:
        fussgz = tilda_loader.load_pedestrian_intersection_corners(study_area_geom)
        fussgz_proj = fussgz.to_crs("EPSG:25832") if len(fussgz) else fussgz
        hex_proj["abstand_fussgaengerzone_m"] = _dist_to_union(centroids, fussgz_proj)
        del fussgz, fussgz_proj
    else:
        hex_proj["abstand_fussgaengerzone_m"] = np.nan

    # ── 8. Load car parking areas ─────────────────────────────────
    # Car parking areas for the conversion bonus. Load only with weight > 0; otherwise
    # mark abstand_parken_m as NaN. Bonus derivation in the MCE step (13).
    _step(8)
    if (use_case.weights.get("w_parken", 0) or 0) > 0:
        parken = tilda_loader.load_car_parking(study_area_geom)
        parken_proj = parken.to_crs("EPSG:25832") if len(parken) else parken
        hex_proj["abstand_parken_m"] = _dist_to_union(centroids, parken_proj)
        del parken, parken_proj
    else:
        hex_proj["abstand_parken_m"] = np.nan

    # Squares (place=square) for the square bonus/penalty – same area distance
    # mechanism as parking, but own loader/weight.
    # Load only with weight > 0. Effect derivation also in the MCE step (13).
    if (use_case.weights.get("w_platz", 0) or 0) > 0:
        platz = tilda_loader.load_squares(study_area_geom)
        platz_proj = platz.to_crs("EPSG:25832") if len(platz) else platz
        hex_proj["abstand_platz_m"] = _dist_to_union(centroids, platz_proj)
        del platz, platz_proj
    else:
        hex_proj["abstand_platz_m"] = np.nan

    # ── 9. Load target locations ─────────────────────────────────────
    # Everyday destinations (public."poiClassification": basic services, education,
    # shopping, leisure – see `load_target_locations`) create demand around their
    # buildings, like resident demand (step 5): points are aggregated via
    # point-in-polygon onto the buildings loaded in step 4 (`_target_demand_sources`,
    # per-category weighting via `zielort_category_shares`), then the weighted
    # neighborhood sum `ziel_praesenz` (number of reachable target buildings,
    # decreasing linearly with distance). The bonus derivation happens in the MCE
    # step (13). Loaded only with weight > 0; otherwise `ziel_praesenz` stays NaN
    # (→ score_zielorte NaN → DB NULL).
    _step(9)
    hex_proj["ziel_praesenz"] = np.nan
    if (use_case.weights.get("w_target", 0) or 0) > 0:
        targets = tilda_loader.load_target_locations(study_area_geom)
        if len(targets):
            # load_target_locations() returns the geometry in the column "geom"
            # (SELECT … AS geom) – normalize to "geometry" like the buildings above.
            targets_proj = (
                targets.to_crs("EPSG:25832")
                .rename_geometry("geometry")[["geometry", "category"]]
                .reset_index(drop=True)
            )
            category_factors = zielort_category_factors(use_case.zielort_category_shares)
            print("   → Target location categories applied at: " + ", ".join(
                f"{c} {category_factors[c] * 100:.0f} %" for c in ZIELORT_CATEGORIES
            ))
            sources = _target_demand_sources(
                targets_proj, buildings_for_demand, category_factors
            )
            if len(sources):
                hex_proj["ziel_praesenz"] = weighted_proximity_sum(
                    centroids, sources, "ziel_gewicht", use_case.zielort_radius_m
                )
                print(f"   → {len(sources)} target location sources, reach "
                      f"{use_case.zielort_radius_m:g} m")
            del targets_proj, sources
        del targets

    # ── 10. DEM / slope ───────────────────────────────────────────────
    # Query only with weight > 0 – as for all other factors (see e.g. cycleways in
    # step 3) the expensive DEM query is skipped otherwise and hangneigung_grad
    # stays NaN (→ score_hangneigung NaN → DB NULL, no exclusion).
    _step(10)
    if (use_case.weights.get("w_slope", 0) or 0) > 0:
        hex_proj["hangneigung_grad"] = dem_adapter.get_slopes(latlng_points)
    else:
        hex_proj["hangneigung_grad"] = np.nan
    del latlng_points

    # ── 11. Intersect vegetation coverage ───────────────────────────
    # Compute only when the factor is weighted – otherwise vegetation is just a
    # display layer and the expensive intersection is skipped.
    _step(11)
    hex_proj["vegetation_coverage_pct"] = 0.0
    w_veg = use_case.weights.get("w_vegetation", 0) or 0
    if w_veg > 0 and vegetation_gdf is not None and len(vegetation_gdf):
        veg_proj = vegetation_gdf.to_crs("EPSG:25832")[["geometry"]].reset_index(drop=True)
        veg_proj = veg_proj[veg_proj.geometry.notna() & ~veg_proj.geometry.is_empty]
        if len(veg_proj):
            hexes = hex_proj[["geometry"]].copy()
            hexes["_hid"] = np.arange(len(hexes))
            hex_area = hex_proj.geometry.area.to_numpy()
            # Candidate pairs via spatial index (STRtree) instead of union_all –
            # only intersect hexagon/vegetation pairs that actually overlap.
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

    # ── 12. Intersect user data ("Eigene Daten") ─────────────────
    # User uploads (factorConfig.user_datasets): per dataset, points/lines are buffered
    # (1.5 m / 2.5 m), polygons stay unchanged; distance per hexagon to the dataset's union.
    # The actual score/exclusion derivation happens in the MCE step. Without datasets
    # `eigendaten_distances` stays empty (→ factor has no effect).
    _step(12)
    eigendaten_distances: dict[str, pd.Series] = {}
    for _dataset in user_datasets or []:
        _ds_id = _dataset.get("id")
        try:
            _geojson = _dataset.get("geojson") or {}
            _feats = _geojson.get("features", []) if isinstance(_geojson, dict) else _geojson
            user_gdf = gpd.GeoDataFrame.from_features(_feats, crs="EPSG:4326")
        except Exception as exc:  # defensive: sanitized, but never trust the client
            print(f"   ⚠️  User dataset \"{_dataset.get('name')}\" unreadable, skipped: {exc}")
            user_gdf = None
        if user_gdf is not None and len(user_gdf):
            user_gdf = user_gdf[user_gdf.geometry.notna() & ~user_gdf.geometry.is_empty]
        if user_gdf is not None and len(user_gdf):
            user_proj = buffer_by_geom_type(
                user_gdf.to_crs("EPSG:25832"), USER_POINT_BUFFER_M, USER_LINE_BUFFER_M
            )
            eigendaten_distances[_ds_id] = _dist_to_union(centroids, user_proj)
            del user_proj
        del user_gdf

    # ── 13. MCE scoring ────────────────────────────────────────────
    _step(13)
    w = use_case.weights

    def slope_score(deg):
        if deg <= 2:    return 100.0
        elif deg <= 5:  return 100.0 - (deg - 2) / 3 * 40
        elif deg <= 10: return 60.0 - (deg - 5) / 5 * 60
        else:           return 0.0

    # Cycleway proximity: demand factor, computed only with weight > 0 (abstand_radweg_m
    # is NaN otherwise, since step 3 was skipped) → score_radweg NaN → DB NULL.
    if (w.get("w_cyclepath", 0) or 0) > 0:
        hex_proj["score_radweg"] = hex_proj["abstand_radweg_m"].apply(
            lambda d: TildaLoader.score_cycleway_proximity(d, use_case.max_cyclepath_dist_m)
        )
    else:
        hex_proj["score_radweg"] = np.nan
    # Only with weight > 0 – like score_radweg above. Without weight hangneigung_grad
    # is already NaN (step 10); score_hangneigung is additionally set to NaN here
    # explicitly, because slope_score(NaN) would otherwise wrongly return 0.0 via the
    # else-branch comparisons – and exactly this "0.0" is the exclusion condition
    # further below (`== 0`).
    if (w.get("w_slope", 0) or 0) > 0:
        hex_proj["score_hangneigung"] = hex_proj["hangneigung_grad"].apply(slope_score)
    else:
        hex_proj["score_hangneigung"] = np.nan

    # ── Base score: weighted average of the criteria ──────────────────────
    # Vegetation is NOT a criterion but a separate penalty (or bonus) further
    # below – like all modifiers it shifts the final score by points instead of
    # taking a share of it. Skipped factors (public transport with weight 0) have a
    # NaN score column; `_term` skips them as scalar 0.0 so the sum is not
    # poisoned by `NaN * 0 = NaN`.
    def _term(col, wkey):
        wv = w.get(wkey, 0) or 0
        return hex_proj[col] * wv if wv else 0.0

    # Weighted average instead of weighted sum: dividing by the sum of the active
    # weights keeps the result in 0–100 however the weights are set. Only their
    # ratio matters – so the UI does not have to force the weights to a fixed sum.
    def _group_score(terms):
        wsum = sum((w.get(k, 0) or 0) for _, k in terms)
        if wsum <= 0:
            return pd.Series(np.nan, index=hex_proj.index)
        raw = sum(_term(col, k) for col, k in terms)
        return raw / wsum

    BEDARF_TERMS = [
        ("score_radweg", "w_cyclepath"),
        ("score_oepnv", "w_transit"),
    ]
    BEBAUUNG_TERMS = [
        ("score_hangneigung", "w_slope"),
    ]
    # Without a single weighted criterion the base score stays 0 (instead of NaN),
    # so the total score then consists of the modifiers only and the NOT NULL
    # column `mce_gesamtscore` stays filled.
    base_score = _group_score(BEDARF_TERMS + BEBAUUNG_TERMS).fillna(0.0)

    # ── Vegetation effect: continuous penalty or bonus ─────────────────────
    # `w_vegetation` (0–1) is the maximum effect in points (× 100). Below the
    # tolerance threshold the effect is 0, above it rises linearly up to the
    # maximum at 100 % coverage.
    #   direction "negative" (protect green)  → penalty
    #   direction "positive" (prefer green)   → bonus
    # `score_vegetation` holds the effect actually applied in points, signed like
    # `score_bestand` (−w_vegetation*100 .. +w_vegetation*100) – otherwise the
    # sidebar cannot show the direction, which only lives in factorConfig. Without
    # weight NaN (→ DB NULL, sidebar shows "–"), since coverage was not computed.
    w_veg = w.get("w_vegetation", 0) or 0
    if w_veg > 0:
        thr = use_case.vegetation_penalty_threshold_pct
        span = max(1.0, 100.0 - thr)
        ramp = ((hex_proj["vegetation_coverage_pct"] - thr) / span).clip(0.0, 1.0)
        veg_effect = (w_veg * 100.0) * ramp
        sign = 1.0 if use_case.vegetation_direction == "positive" else -1.0
        veg_delta = sign * veg_effect
        hex_proj["score_vegetation"] = veg_delta.round(1)
    else:
        hex_proj["score_vegetation"] = np.nan
        veg_delta = 0.0

    # ── Intersection bonus: continuous bonus near curb corners ─────────────
    # Bicycle parking fits well at street corners – ideally ~5–8 m from the curb
    # corner (not in the middle of the intersection). The bonus is a modifier on
    # the base score (like vegetation); `w_intersection` (0–1) is the maximum bonus
    # in points (× 100). The corner distance `abstand_kreuzung_m` was loaded in
    # step 7 (NaN without weight); without weight `score_kreuzung` stays NaN as
    # well (→ DB NULL).
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

    # ── Parking bonus: bonus on/near car parking areas ─────────────────────
    # Existing car parking areas (public.parkings / parkings_separate) are easy to
    # convert into bicycle parking. The bonus is a modifier on the base score (like
    # intersections); `w_parken` (0–1) is the maximum bonus in points (× 100).
    # Unlike intersections, the bonus is maximal when the hexagon lies directly on
    # the parking area (distance 0) and drops linearly to 0 at `parken_radius_m`.
    # The area distance `abstand_parken_m` was loaded in step 8 (NaN without
    # weight); without weight `score_parken` stays NaN as well (→ DB NULL).
    w_parken = w.get("w_parken", 0) or 0
    if w_parken > 0:
        abstand_parken = hex_proj["abstand_parken_m"]
        _pr = use_case.parken_radius_m

        def _parken_faktor(d, r=_pr):
            if d <= 0:      # hexagon lies on the parking area → full bonus
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

    # ── Square bonus/penalty: bonus or penalty on squares ──────────────────
    # Squares (place=square, public._places_squares) are attractive public space.
    # The effect is a modifier on the base score (like intersections/parking);
    # `w_platz` (0–1) is the effect in points (× 100). Unlike intersections/parking
    # there is no distance falloff: only hexagons lying directly on the square
    # (distance 0) get the full effect, all others 0. `platz_direction` sets the
    # sign (like vegetation): "positive" = bonus (activity/visibility),
    # "negative" = penalty (keep the square as open space). The area distance
    # `abstand_platz_m` was loaded in step 8 (NaN without weight); without weight
    # `score_platz` stays NaN as well (→ DB NULL).
    w_platz = w.get("w_platz", 0) or 0
    if w_platz > 0:
        abstand_platz = hex_proj["abstand_platz_m"]
        platz_effect = (w_platz * 100.0) * (abstand_platz <= 0).astype(float)
        platz_sign = 1.0 if use_case.platz_direction == "positive" else -1.0
        platz_delta = platz_sign * platz_effect
        hex_proj["score_platz"] = platz_delta.round(1)
    else:
        hex_proj["score_platz"] = np.nan
        platz_delta = 0.0

    # ── Pedestrian zone bonus: bonus at street × pedestrian zone corners ───
    # Where one of the usual street categories meets a pedestrian zone, demand is
    # particularly high. Same curb corner mechanism and distance ramp as the
    # intersection bonus (ideally 5–8 m from the corner), but own weight
    # `w_fussgaengerzone` and own outer reach `fussgaengerzone_radius_m`.
    # The bonus belongs to the demand group (see below). `abstand_fussgaengerzone_m`
    # was loaded in step 7 (NaN without weight); without weight
    # `score_fussgaengerzone` stays NaN as well (→ DB NULL).
    w_fussgz = w.get("w_fussgaengerzone", 0) or 0
    if w_fussgz > 0:
        abstand_fussgz = hex_proj["abstand_fussgaengerzone_m"]
        _flo = use_case.intersection_ideal_min_m
        _fhi = min(use_case.intersection_ideal_max_m, use_case.fussgaengerzone_radius_m)
        _fr = use_case.fussgaengerzone_radius_m

        def _fussgz_faktor(d, lo=_flo, hi=_fhi, r=_fr):
            if d <= 0:
                return 0.0
            if d < lo:
                return d / lo if lo > 0 else 1.0
            if d <= hi:
                return 1.0
            if d <= r:
                return max(0.0, (r - d) / max(1.0, r - hi))
            return 0.0

        fussgz_bonus = (w_fussgz * 100.0) * abstand_fussgz.apply(_fussgz_faktor)
        hex_proj["score_fussgaengerzone"] = fussgz_bonus.round(1)
        fussgz_delta = fussgz_bonus
    else:
        hex_proj["score_fussgaengerzone"] = np.nan
        fussgz_delta = 0.0

    # ── Resident demand: bonus around inhabited buildings ──────────────────
    # The weighted neighborhood sum `bewohner_ew` from step 5 (residents, decreasing
    # linearly with distance from the building edge) becomes a bonus on the DEMAND
    # group – where many people live, bikes get parked.
    # `bewohnerbedarf_saettigung_ew` is the value at which the bonus is maxed out
    # (capped above); `w_bewohnerbedarf` (0–1) the maximum bonus in points (× 100).
    # Hexagons mostly covered by a building (`gebaeude`, see step 4) deliberately
    # get 0: demand arises AROUND the building, not on it. They are hard-excluded
    # anyway (mce/buildability), but demand would remain and the sidebar would show
    # demand on the roof. Hexagons that touch a building only to a smaller share do
    # NOT count as `gebaeude` and keep their full bonus.
    # Without weight `score_bewohnerbedarf` stays NaN (→ DB NULL, sidebar shows "–").
    w_bewohner = w.get("w_bewohnerbedarf", 0) or 0
    if w_bewohner > 0:
        saettigung = max(1.0, use_case.bewohnerbedarf_saettigung_ew)
        bewohner_faktor = (hex_proj["bewohner_ew"].fillna(0.0) / saettigung).clip(0.0, 1.0)
        bewohner_faktor = bewohner_faktor.where(~hex_proj["gebaeude"], 0.0)
        bewohner_bonus = (w_bewohner * 100.0) * bewohner_faktor
        hex_proj["score_bewohnerbedarf"] = bewohner_bonus.round(1)
        bewohner_delta = bewohner_bonus
    else:
        hex_proj["score_bewohnerbedarf"] = np.nan
        bewohner_delta = 0.0

    # ── Target location bonus: bonus around buildings with everyday destinations ──
    # The weighted neighborhood sum `ziel_praesenz` from step 9 (number of reachable
    # target buildings – basic services/education/shopping/leisure from
    # public."poiClassification" –, decreasing linearly with distance from the
    # building edge) becomes a bonus on the DEMAND group – like resident demand, but
    # with target location instead of census sources (see `_target_demand_sources`)
    # AND with saturation hard-wired to 1.0 (user decision, no config field): a single
    # target building of the strongest category right at the hexagon edge
    # (ziel_praesenz=1.0) already triggers the full bonus; the plain `.clip(0, 1)`
    # replaces the division by saturation. Weaker weighted categories contribute their
    # source only proportionally (source weight = `zielort_category_factors`); several
    # categories add up to the cap of 1.0.
    # `w_target` (0–1) is the maximum bonus in points (× 100). As with resident
    # demand, hexagons mostly covered by a building deliberately get 0 (demand arises
    # AROUND the building, not on it). Without weight `score_zielorte` stays NaN
    # (→ DB NULL, sidebar shows "–").
    w_ziel = w.get("w_target", 0) or 0
    if w_ziel > 0:
        ziel_faktor = hex_proj["ziel_praesenz"].fillna(0.0).clip(0.0, 1.0)
        ziel_faktor = ziel_faktor.where(~hex_proj["gebaeude"], 0.0)
        ziel_bonus = (w_ziel * 100.0) * ziel_faktor
        hex_proj["score_zielorte"] = ziel_bonus.round(1)
        ziel_delta = ziel_bonus
    else:
        hex_proj["score_zielorte"] = np.nan
        ziel_delta = 0.0

    # ── Existing parking: lower demand around existing bicycle parking ──────
    # Existing bicycle parking (public."bicycleParking_points") lowers demand: where
    # bikes can already be parked, fewer new facilities are needed.
    # Negative modifier on the DEMAND group (like the pedestrian zone bonus, just
    # with the opposite sign). `w_bestand` (0–1) is the maximum penalty in points
    # (× 100). Each facility's reach depends on its capacity:
    # diameter = capacity/2 m (→ radius capacity/4); without a capacity tag the
    # default diameter applies. Full penalty inside the catchment circle, 0 outside
    # (hard edge – strength comes from the weight alone). The PostGIS query runs only
    # with weight > 0; otherwise `score_bestand` stays NaN (→ DB NULL).
    # Excluding buildability because of existing facilities is deliberately not
    # implemented (yet) – only the demand reduction.
    w_bestand = w.get("w_bestand", 0) or 0
    if w_bestand > 0:
        bp = tilda_loader.load_bicycle_parking(study_area_geom)
        if len(bp):
            bp_proj = bp.to_crs("EPSG:25832")
            default_radius = use_case.bestand_default_diameter_m / 2.0
            if "capacity" in bp_proj.columns:
                cap = pd.to_numeric(bp_proj["capacity"], errors="coerce").to_numpy()
            else:
                cap = np.full(len(bp_proj), np.nan)
            radii = np.where(cap > 0, cap / 4.0, default_radius)
            coverage = bp_proj.geometry.buffer(radii).union_all()
            covered = (
                centroids.within(coverage)
                if coverage is not None and not coverage.is_empty
                else pd.Series(False, index=hex_proj.index)
            )
        else:
            covered = pd.Series(False, index=hex_proj.index)
        del bp
        bestand_abzug = (w_bestand * 100.0) * covered.astype(float)
        hex_proj["score_bestand"] = (-bestand_abzug).round(1)
        bestand_delta = -bestand_abzug
    else:
        hex_proj["score_bestand"] = np.nan
        bestand_delta = 0.0

    # ── User data ("Eigene Daten"): soft modifier OR hard exclusion ──────
    # Each dataset carries its mode; the distances from step 12 are already buffered
    # (points/lines) or exact (polygons) – a hexagon counts as "inside" when its
    # distance to the dataset's union is 0 (see `eigendaten.combine_eigendaten`).
    #   bonus/penalty    → full bonus/penalty inside, 0 outside; strength per dataset
    #                      eigendaten_weights[id] (× 100). Several datasets add up.
    #                      OWN category: feeds into the total score, but NOT into
    #                      demand/buildability.
    #   exclude_inside   → hexagon inside → mce = 0
    #   exclude_outside  → hexagon outside → mce = 0 (allowed-zones mask)
    # Hard exclusions (OR across all datasets) zero only mce_gesamtscore
    # (not demand/buildability).
    eig_score, eigendaten_delta, eig_exclude, eig_details = combine_eigendaten(
        user_datasets or [], eigendaten_distances, eigendaten_weights, hex_proj.index
    )
    eigendaten_exclude = eig_exclude if eig_exclude.any() else None
    hex_proj["score_eigendaten"] = eig_score
    # Per hexagon, which dataset had which effect (JSON text) – lets the sidebar name the
    # datasets.
    hex_proj["eigendaten_details"] = eig_details

    # Persisted flag like `gebaeude`/`fahrbahn` – lets the sidebar show the exclusion
    # reason "Eigene Daten" even when `score_eigendaten` is NaN in pure exclusion
    # modes (see above).
    hex_proj["eigendaten_ausschluss"] = (
        eigendaten_exclude if eigendaten_exclude is not None
        else pd.Series(False, index=hex_proj.index)
    )

    # ── Total score (combination) ──────────────────────────────────────────
    # `total` = `base_score ± veg + kreuz + parken + fussgz + bewohner + ziel + bestand
    # + eigendaten`; the modifiers are separate delta series so they can be reused
    # below for the sub-scores. `fussgz_delta`/`bewohner_delta`/`bestand_delta`/
    # `eigendaten_delta` default to 0 (weights 0), so they don't change existing runs.
    # `ziel_delta` is NO LONGER 0 by default: w_target used to be a criterion with
    # default weight 0.15, now it is a modifier with the same weight – existing runs
    # therefore behave differently on their next recalculation.
    total = (
        base_score + veg_delta + kreuz_delta + parken_delta + platz_delta
        + fussgz_delta + bewohner_delta + ziel_delta + bestand_delta + eigendaten_delta
    )
    # Clamp the total score to [0, 100] – it must never drop below 0.
    hex_proj["mce_gesamtscore"] = total.clip(lower=0.0, upper=100.0).round(1)

    # ── Sub-scores: "Bedarf" vs. "Bebauung" (issue #3415) ──────────────────
    # The hexagon scores mix two separate domain questions. They are additionally
    # computed here as two separately normalized 0–100 views (the combined
    # `mce_gesamtscore` above is unaffected):
    #   Demand ("Bedarf", "wants to park here")  → cycleway (w_cyclepath),
    #       public transport (w_transit), target locations (w_target) + modifiers
    #       pedestrian zones (bonus), resident demand (bonus) and existing parking (penalty)
    #   Buildability ("Bebauung", "can build here") → slope (w_slope)
    #       + modifiers vegetation, intersections, parking, squares; hard exclusions.
    # Each group is divided by the sum of its active weights (the same `_group_score`
    # as for the base score above) so the sub-score stays 0–100 regardless of the
    # weight distribution. If a group is completely unweighted, its score stays NaN
    # (→ DB NULL).
    #
    # Pedestrian zone bonus, resident demand and target locations (bonuses) as well
    # as existing parking (penalty) are demand modifiers (like intersections/parking
    # for buildability): normalize first, then add the deltas, then clip.
    base_bedarf = _group_score(BEDARF_TERMS)
    score_bedarf = (
        base_bedarf + fussgz_delta + bewohner_delta + ziel_delta + bestand_delta
    ).clip(lower=0.0, upper=100.0)

    base_bebauung = _group_score(BEBAUUNG_TERMS)
    score_bebauung = (
        base_bebauung + veg_delta + kreuz_delta + parken_delta + platz_delta
    ).clip(lower=0.0, upper=100.0)

    hex_proj["score_bedarf"] = score_bedarf.round(1)
    hex_proj["score_bebauung"] = score_bebauung.round(1)

    # Hard exclusion criteria are buildability criteria only: they zero buildability
    # AND the combined score, but NOT demand (demand also exists where nothing can be
    # built). Cycleway distance deliberately no longer counts – cycleway proximity is
    # a demand criterion, not a buildability one.
    # If slope is switched off (w_slope = 0), score_hangneigung is NaN (see above) and
    # `NaN == 0` is always False – so the steep-slope exclusion consistently does not
    # apply, just like any other factor with weight 0.
    exclusion = (
        (hex_proj["score_hangneigung"]       == 0) |
        hex_proj["gebaeude"] |
        hex_proj["fahrbahn"]
    )
    apply_bebauung_exclusion(hex_proj, exclusion)

    # User data exclusion (if mode is exclude_*): zeroes ONLY mce_gesamtscore and
    # deliberately leaves demand/buildability untouched (own category, see above).
    apply_score_exclusion(hex_proj, eigendaten_exclude, cols=("mce_gesamtscore",))

    hex_proj["eignungsklasse"] = pd.cut(
        hex_proj["mce_gesamtscore"], bins=_KLASSE_BINS, labels=_KLASSE_LABELS
    ).astype(str)

    assign_clusters(hex_proj, use_case.min_score_threshold)

    print(f"\n✅ Done: {len(hex_proj)} hexagons")
    return hex_proj
