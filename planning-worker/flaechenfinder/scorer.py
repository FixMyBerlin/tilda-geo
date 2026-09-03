import h3
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely import area as _shp_area, intersection as _shp_intersection
from shapely.geometry import Polygon
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components

from .config import USER_LINE_BUFFER_M, USER_POINT_BUFFER_M, UseCaseConfig
from .dem import DEMAdapter
from .geometry import (
    buffer_by_geom_type,
    dist_to_union as _dist_to_union,
    weighted_proximity_sum,
)
from .tilda import TildaLoader


# H3-Auflösungen: BASE ist das feine Scoring-Gitter (hohe Zoomstufen), AGG das
# grobe Aggregat für niedrige Zoomstufen (z < 16). AGG_H3_RES muss mit der
# Zoom-Verzweigung in planning-worker/sql/martin_functions.sql übereinstimmen.
BASE_H3_RES = 13
AGG_H3_RES = 11

# Score-Spalten, die beim Aggregieren gemittelt werden (eignungsklasse wird
# daraus neu abgeleitet, nicht gemittelt).
_SCORE_COLS = [
    "mce_gesamtscore", "score_bedarf", "score_bebauung",
    "score_radweg", "score_zielorte",
    "score_hangneigung", "score_oepnv", "score_vegetation",
    "score_kreuzung", "score_parken", "score_fussgaengerzone",
    "score_bestand", "score_eigendaten", "score_bewohnerbedarf",
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
    # Gleiche Begründung wie bei „gebaeude": auf dem groben Aggregat-Gitter ist
    # ein Einzel-Flag pro Feingitter-Zelle nicht aussagekräftig.
    agg["fahrbahn"] = False
    agg["eignungsklasse"] = pd.cut(
        agg["mce_gesamtscore"], bins=_KLASSE_BINS, labels=_KLASSE_LABELS
    ).astype(str)
    agg["geometry"] = agg["h3_id"].map(
        lambda h: Polygon([(lng, lat) for lat, lng in h3.cell_to_boundary(h)])
    )

    agg_gdf = gpd.GeoDataFrame(agg, geometry="geometry", crs="EPSG:4326")
    print(f"   → {len(agg_gdf)} aggregierte Hexagone (Res {target_res})")
    return agg_gdf.to_crs("EPSG:25832")


def assign_clusters(hex_proj: gpd.GeoDataFrame, min_score: float) -> gpd.GeoDataFrame:
    """Fügt `cluster_area_m2` hinzu: Gesamtfläche (m²) der zusammenhängenden
    Fläche, zu der ein Hexagon gehört. Cluster = benachbarte (H3-adjazente)
    Zellen mit mce_gesamtscore >= min_score. Zellen unter der Schwelle bekommen
    NaN (→ DB NULL). Reine Nachverarbeitung über H3-Nachbarschaft
    (h3.grid_disk), keine Spatial-Joins. Nur fürs feine BASE-Gitter (Res 13).
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
        for nb in h3.grid_disk(h, 1):        # h + 6 Nachbarn
            j = idx_of.get(nb)
            if j is not None and j > i:      # jede Kante nur einmal
                rows.append(i); cols.append(j)

    if rows:
        graph = coo_matrix((np.ones(len(rows)), (rows, cols)), shape=(n, n))
        _, labels = connected_components(graph, directed=False)
    else:
        labels = np.arange(n)                # lauter Einzelzellen

    cell_area = np.fromiter(
        (h3.cell_area(h, unit="m^2") for h in ids), dtype=float, count=n
    )
    area_per_label = pd.Series(cell_area).groupby(labels).transform("sum")
    hex_proj.loc[mask, "cluster_area_m2"] = area_per_label.to_numpy()
    print(f"   → Flächen-Cluster: {pd.Series(labels).nunique()} Cluster "
          f"aus {n} Zellen (Score ≥ {min_score:g})")
    return hex_proj


# Die 14 fachlichen Schritte des Laufs, in Reihenfolge. Wird sowohl für die
# Log-Ausgabe als auch (via progress_cb) für die Fortschrittsanzeige im UI
# verwendet. Die Namen müssen mit der Schrittliste im Frontend übereinstimmen
# (PlanningSteps.tsx). Schritt 1 (Vegetationsflächen berechnen) und Schritt 14
# (Ergebnisse speichern) laufen außerhalb von run_flaechenfinder() im Worker
# (worker.py); die Nummerierung hier beginnt daher bei 2.
# Kreuzungen (7) und KFZ-Parkflächen (8) sind eigene, sichtbare Ladeschritte –
# nur die reine Bonus-Ableitung passiert später im MCE-Schritt (13).
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
    "Eigene Flächen verschneiden",
    "MCE-Score berechnen",
    "Ergebnisse speichern",
]
SCORING_STEP_COUNT = len(SCORING_STEPS)


def apply_score_exclusion(hex_proj, mask, cols=("mce_gesamtscore",)) -> None:
    """Nullt die genannten Score-Spalten für alle vom `mask` getroffenen Hexagone.

    Modularer harter Ausschluss: `mask` ist eine boolesche Serie über `hex_proj`.
    Standardmäßig wird nur `mce_gesamtscore` genullt – z. B. für den
    Eigendaten-Ausschluss, der die Teil-Scores Bedarf/Bebauung bewusst unberührt
    lässt.
    """
    if mask is None or not mask.any():
        return
    for col in cols:
        hex_proj.loc[mask, col] = 0.0


def apply_bebauung_exclusion(hex_proj, mask) -> None:
    """Bebauungs-Ausschluss: nullt Kombination UND Bebauung, lässt den Bedarf.

    Für die klassischen Baubarkeits-Kriterien (Gebäude, Hangneigung):
    der Bedarf besteht auch dort, wo nicht gebaut werden kann.
    """
    apply_score_exclusion(hex_proj, mask, cols=("mce_gesamtscore", "score_bebauung"))


def _census_demand_sources(
    census_proj: gpd.GeoDataFrame, buildings_proj: gpd.GeoDataFrame | None
) -> gpd.GeoDataFrame:
    """Bewohnerbedarfs-Quellen: Zensus-Einwohner auf Gebäudepolygone aggregiert.

    Die Punkte aus `data.census_population_point` liegen auf dem Gebäudemittelpunkt.
    Für eine Distanzrampe, die an der Gebäudekante beginnt, werden sie den Gebäuden
    per Point-in-Polygon zugeordnet und je Gebäude aufsummiert; Quelle ist dann das
    Polygon. Punkte ohne Gebäudetreffer – die 0,5 % `cluster_typ='gitter_mitte'`
    sowie Abweichungen zwischen ALKIS (Zensus) und OSM (`public._buildings`) –
    behalten ihre Punktgeometrie, damit ihre Einwohner nicht verloren gehen.

    Beide GeoDataFrames müssen im selben metrischen CRS liegen. Rückgabe:
    GeoDataFrame mit der Spalte `einwohner` und gemischten Geometrien
    (Gebäudepolygone + Restpunkte).
    """
    points = census_proj.rename(columns={"total": "einwohner"})
    points["einwohner"] = pd.to_numeric(points["einwohner"], errors="coerce").fillna(0.0)
    points = points[["geometry", "einwohner"]]

    if buildings_proj is None or not len(buildings_proj):
        return points

    bld = buildings_proj[["geometry"]].reset_index(drop=True)
    hits = gpd.sjoin(points, bld, how="left", predicate="within")
    # Bei überlappenden Gebäuden trifft ein Punkt mehrfach – nur den ersten Treffer
    # zählen, sonst würden seine Einwohner mehrfach in die Summe eingehen.
    hits = hits[~hits.index.duplicated(keep="first")]

    matched = hits["index_right"].notna()
    per_building = hits.loc[matched].groupby(
        hits.loc[matched, "index_right"].astype(int)
    )["einwohner"].sum()

    building_sources = bld.loc[per_building.index].copy()
    building_sources["einwohner"] = per_building.to_numpy()
    leftover = hits.loc[~matched, ["geometry", "einwohner"]]

    print(f"   ✓ Zensus: {int(matched.sum())} von {len(points)} Punkten auf "
          f"{len(building_sources)} Gebäude aggregiert, {int((~matched).sum())} als Punkt")
    return gpd.GeoDataFrame(
        pd.concat([building_sources, leftover], ignore_index=True),
        geometry="geometry",
        crs=census_proj.crs,
    )


def _target_demand_sources(
    target_proj: gpd.GeoDataFrame, buildings_proj: gpd.GeoDataFrame | None
) -> gpd.GeoDataFrame:
    """Zielorte-Quellen: POI-Punkte (public."poiClassification") auf Gebäudepolygone
    aggregiert – analog `_census_demand_sources`, aber mit reiner Vorhandensein-
    Gewichtung (0/1) statt Summe. Ein Gebäude mit mehreren Zielorten (z. B.
    Supermarkt + Bäckerei im selben Haus) zählt genau wie eines mit nur einem –
    die ANZAHL der Zielorte im Gebäude soll den Bedarf nicht vervielfachen
    (User-Entscheid, siehe `zielort_saettigung` in config.py).

    Punkte ohne Gebäudetreffer behalten ihre Punktgeometrie, jeweils mit
    Gewicht 1.0 – ein einzelner Zielort ohne erkanntes Gebäude zählt wie ein
    Gebäude mit Zielort.

    Beide GeoDataFrames müssen im selben metrischen CRS liegen. Rückgabe:
    GeoDataFrame mit der Spalte `ziel_gewicht` (immer 1.0) und gemischten
    Geometrien (Gebäudepolygone + Restpunkte).
    """
    points = target_proj[["geometry"]].copy()

    if buildings_proj is None or not len(buildings_proj):
        points["ziel_gewicht"] = 1.0
        return points

    bld = buildings_proj[["geometry"]].reset_index(drop=True)
    hits = gpd.sjoin(points, bld, how="left", predicate="within")
    # Mehrere Zielorte im selben Gebäude sollen das Gebäude nur EINMAL als Quelle
    # zählen – nicht wie beim Bewohnerbedarf aufsummieren, sondern die betroffenen
    # Gebäude einmalig herausziehen.
    matched = hits["index_right"].notna()
    matched_building_ids = hits.loc[matched, "index_right"].astype(int).unique()

    building_sources = bld.loc[matched_building_ids].copy()
    building_sources["ziel_gewicht"] = 1.0
    leftover = hits.loc[~matched, ["geometry"]].copy()
    leftover["ziel_gewicht"] = 1.0

    print(f"   ✓ Zielorte: {int(matched.sum())} von {len(points)} Punkten auf "
          f"{len(building_sources)} Gebäude aggregiert, {int((~matched).sum())} als Punkt")
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
    user_geojson=None,
    progress_cb=None,
):
    """Berechnet das H3-Scoring-Gitter mit MCE-Score je Hexagon.

    Gibt das Hexagon-GeoDataFrame in EPSG:25832 (metrisch) zurück. Schreibt
    KEINE Dateien – die Persistenz übernimmt der Worker (results.py).

    `vegetation_gdf` (optional, EPSG:25832) enthält die on-demand berechneten
    Vegetationspolygone; daraus wird der Bedeckungsgrad je Hexagon abgeleitet.

    `carriageway_gdf` (optional, EPSG:25832) enthält die vom Worker vorab
    berechneten, um ihre Breite gepufferten Straßenflächen
    (`flaechenfinder.carriageways.compute_carriageway_areas`) – nur gesetzt,
    wenn `use_case.exclude_carriageways` aktiv war. Dient hier ausschließlich
    dem harten Bebauungs-Ausschluss; die Kartenanzeige übernimmt der Worker
    direkt aus demselben GeoDataFrame (siehe `results.py`).

    `progress_cb` (optional) wird vor jedem der hier ausgeführten Schritte
    (step:int 2..13, total:int, label:str) aufgerufen, damit der Worker den
    aktuellen Schritt an das UI weiterreichen kann. Schritt 1 (Vegetations-
    flächen berechnen) und Schritt 14 (Ergebnisse speichern) meldet der
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
    # Radwegnähe ist ein Bedarfsfaktor (kein Ausschluss mehr). Nur bei Gewicht > 0
    # laden; sonst abstand_radweg_m als NaN markieren (→ score_radweg NaN → DB NULL).
    _step(3)
    if (use_case.weights.get("w_cyclepath", 0) or 0) > 0:
        cycleways = tilda_loader.load_cycleways(study_area_geom)
        cycleway_proj = cycleways.to_crs("EPSG:25832") if len(cycleways) else cycleways
        hex_proj["abstand_radweg_m"] = _dist_to_union(centroids, cycleway_proj)
        del cycleways, cycleway_proj
    else:
        hex_proj["abstand_radweg_m"] = np.nan

    # ── 4. Gebäude ─────────────────────────────────────────────────
    _step(4)
    # Gebäude aus tilda DB: nur Hexagone, deren Fläche zu mehr als
    # GEBAEUDE_EXCLUSION_COVERAGE von einem Gebäude bedeckt ist, werden hart
    # ausgeschlossen (analog FAHRBAHN_EXCLUSION_COVERAGE unten). Hexagone, die ein
    # Gebäude nur zu einem kleineren Anteil berühren (z. B. am Rand), bleiben
    # bebaubar und behalten ihren vollen Wert – der Ausschluss soll das Gebäude
    # selbst treffen, nicht dessen Umgebung.
    GEBAEUDE_EXCLUSION_COVERAGE = 2 / 3
    buildings = tilda_loader.load_buildings(study_area_geom)
    # Der Bewohnerbedarf (Schritt 5) und die Zielorte (Schritt 9) brauchen dieselben
    # Polygone: ihre Punktquellen (Zensus bzw. poiClassification) werden darauf
    # aggregiert und die Distanzrampe ab der Gebäudekante gemessen. Nur bei Gewicht > 0
    # behalten – sonst wie bisher sofort freigeben.
    keep_buildings = (
        (use_case.weights.get("w_bewohnerbedarf", 0) or 0) > 0
        or (use_case.weights.get("w_target", 0) or 0) > 0
    )
    buildings_for_demand = None
    if len(buildings):
        # load_buildings() liefert die Geometrie in der Spalte "geom" (SELECT … AS geom);
        # auf "geometry" normalisieren, damit die Spaltenauswahl unten passt.
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

    # Fahrbahnen ausschließen (Checkbox, kein Gewicht): die vom Worker vorab
    # gepufferten Straßenflächen (carriageway_gdf) werden wie Gebäude hart
    # ausgeschlossen – aber erst, wenn die Fahrbahn den Großteil der
    # Hexagonfläche bedeckt (> FAHRBAHN_EXCLUSION_COVERAGE), nicht schon bei
    # jeder noch so kleinen Randberührung. Laden+Puffern passiert einmalig im
    # Worker (siehe flaechenfinder.carriageways), damit dasselbe GeoDataFrame
    # auch für die Kartenanzeige (planning.scenario_carriageways)
    # wiederverwendet werden kann.
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

    # ── 5. Bewohnerbedarf (Zensus) ────────────────────────────────
    # Einwohnerpunkte aus `data.census_population_point` (Zensus 2022, auf Gebäude
    # disaggregiert) erzeugen rund um bewohnte Gebäude Bedarf – altersunabhängig, es
    # zählt allein `total`. Die Punkte sitzen auf dem Gebäudemittelpunkt; damit die
    # Rampe an der GEBÄUDEKANTE beginnt (und nicht schon in der Gebäudemitte), werden
    # sie per Point-in-Polygon auf die in Schritt 4 geladenen Gebäude aggregiert
    # (`_census_demand_sources`). Ergebnis ist die gewichtete Nachbarschaftssumme
    # `bewohner_ew`: Einwohner, linear mit dem Abstand abfallend. Die Bonus-Ableitung
    # passiert im MCE-Schritt (13). Nur bei Gewicht > 0 wird geladen; sonst bleibt
    # `bewohner_ew` NaN (→ score_bewohnerbedarf NaN → DB NULL).
    _step(5)
    hex_proj["bewohner_ew"] = np.nan
    if (use_case.weights.get("w_bewohnerbedarf", 0) or 0) > 0:
        census = tilda_loader.load_census_population(study_area_geom)
        if len(census):
            # load_census_population() liefert die Geometrie in der Spalte "geom"
            # (SELECT … AS geom) – wie bei den Gebäuden oben auf "geometry" normalisieren.
            census_proj = (
                census.to_crs("EPSG:25832")
                .rename_geometry("geometry")[["geometry", "total"]]
                .reset_index(drop=True)
            )
            sources = _census_demand_sources(census_proj, buildings_for_demand)
            hex_proj["bewohner_ew"] = weighted_proximity_sum(
                centroids, sources, "einwohner", use_case.bewohnerbedarf_radius_m
            )
            print(f"   → {len(sources)} Bedarfsquellen mit "
                  f"{sources['einwohner'].sum():.0f} Einwohnern, Reichweite "
                  f"{use_case.bewohnerbedarf_radius_m:g} m")
            del census_proj, sources
        else:
            hex_proj["bewohner_ew"] = 0.0
        del census
    del buildings_for_census

    # ── 6. ÖPNV-Haltestellen + Bikesharing ────────────────────────
    # Nur bei Gewicht > 0 laden – sonst die Transit-Queries sparen und
    # score_oepnv als NaN (→ DB NULL, Sidebar „–") markieren.
    _step(6)
    if (use_case.weights.get("w_transit", 0) or 0) > 0:
        _TRANSIT_TYPES = [
            # U-Bahn-Eingang, Bahnhofsgebäude und Bikesharing haben keinen publicTransport-
            # Tag-Dict-Eintrag, sondern eigene Tabelle/Loader, siehe unten.
            ("U-Bahn-Eingang",   None,                          50),
            ("Straßenbahn",      {"railway": "tram_stop"},       50),
            ("Bus",              {"highway": "bus_stop"},         30),
            ("Bahnhof",          {"railway": ["station", "halt"]}, 100),
            # Bahnhofsgebäude (building=train_station): Abstellanlagen sollen möglichst
            # nah ans Gebäude, nicht nur an den Bahnsteig-/Stationspunkt.
            ("Bahnhofsgebäude",  None,                          100),
            # Bikesharing (poiClassification, *=bicycle_rental): wie Bushaltestellen ein
            # „Last Mile"-Zugangspunkt, deshalb derselbe Radius von 30 m.
            ("Bikesharing",      None,                           30),
        ]
        _transit_scores = []
        for _tname, _ttags, _tradius in _TRANSIT_TYPES:
            try:
                if _tname == "U-Bahn-Eingang":
                    _stops = osm_loader.load_subway_entrances(study_area_geom)
                elif _tname == "Bahnhofsgebäude":
                    _stops = osm_loader.load_train_station_buildings(study_area_geom)
                elif _tname == "Bikesharing":
                    _stops = osm_loader.load_bikesharing(study_area_geom)
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
        hex_proj["score_oepnv"] = pd.concat(_transit_scores, axis=1).max(axis=1)
        del _transit_scores
    else:
        hex_proj["score_oepnv"] = np.nan

    # ── 7. Kreuzungen laden ───────────────────────────────────────
    # Bordstein-Ecken für den Kreuzungs-Bonus. Nur bei Gewicht > 0 den (teuren)
    # PostGIS-Query fahren; sonst abstand_kreuzung_m als NaN markieren. Die
    # Bonus-Ableitung selbst passiert im MCE-Schritt (13) aus dieser Distanz.
    _step(7)
    if (use_case.weights.get("w_intersection", 0) or 0) > 0:
        corners = tilda_loader.load_intersection_corners(study_area_geom)
        corners_proj = corners.to_crs("EPSG:25832") if len(corners) else corners
        hex_proj["abstand_kreuzung_m"] = _dist_to_union(centroids, corners_proj)
        del corners, corners_proj
    else:
        hex_proj["abstand_kreuzung_m"] = np.nan

    # Fußgängerzonen-Ecken (Straße × Fußgängerzone) – gleicher Ecken-Mechanismus,
    # aber eigener Loader/Gewicht. Nur bei Gewicht > 0 den PostGIS-Query fahren.
    # Bonus-Ableitung ebenfalls im MCE-Schritt (13).
    if (use_case.weights.get("w_fussgaengerzone", 0) or 0) > 0:
        fussgz = tilda_loader.load_pedestrian_intersection_corners(study_area_geom)
        fussgz_proj = fussgz.to_crs("EPSG:25832") if len(fussgz) else fussgz
        hex_proj["abstand_fussgaengerzone_m"] = _dist_to_union(centroids, fussgz_proj)
        del fussgz, fussgz_proj
    else:
        hex_proj["abstand_fussgaengerzone_m"] = np.nan

    # ── 8. KFZ-Parkflächen laden ──────────────────────────────────
    # KFZ-Parkflächen für den Umwidmungs-Bonus. Nur bei Gewicht > 0 laden; sonst
    # abstand_parken_m als NaN markieren. Bonus-Ableitung im MCE-Schritt (13).
    _step(8)
    if (use_case.weights.get("w_parken", 0) or 0) > 0:
        parken = tilda_loader.load_car_parking(study_area_geom)
        parken_proj = parken.to_crs("EPSG:25832") if len(parken) else parken
        hex_proj["abstand_parken_m"] = _dist_to_union(centroids, parken_proj)
        del parken, parken_proj
    else:
        hex_proj["abstand_parken_m"] = np.nan

    # ── 9. Zielorte laden ────────────────────────────────────────────
    # Alltagsziele (public."poiClassification": Grundversorgung, Bildung, Einkauf,
    # Freizeit – siehe `load_target_locations`) erzeugen rund um ihre Gebäude Bedarf,
    # analog zum Bewohnerbedarf (Schritt 5): Punkte werden per Point-in-Polygon auf
    # die in Schritt 4 geladenen Gebäude aggregiert (`_target_demand_sources`,
    # Vorhandensein-Gewichtung 0/1), dann gewichtete Nachbarschaftssumme
    # `ziel_praesenz` (Anzahl erreichbarer Zielort-Gebäude, linear mit dem Abstand
    # abfallend). Die Bonus-Ableitung passiert im MCE-Schritt (13). Nur bei
    # Gewicht > 0 wird geladen; sonst bleibt `ziel_praesenz` NaN
    # (→ score_zielorte NaN → DB NULL).
    _step(9)
    hex_proj["ziel_praesenz"] = np.nan
    if (use_case.weights.get("w_target", 0) or 0) > 0:
        targets = tilda_loader.load_target_locations(study_area_geom)
        if len(targets):
            # load_target_locations() liefert die Geometrie in der Spalte "geom"
            # (SELECT … AS geom) – wie bei den Gebäuden oben auf "geometry" normalisieren.
            targets_proj = (
                targets.to_crs("EPSG:25832")
                .rename_geometry("geometry")[["geometry"]]
                .reset_index(drop=True)
            )
            sources = _target_demand_sources(targets_proj, buildings_for_demand)
            hex_proj["ziel_praesenz"] = weighted_proximity_sum(
                centroids, sources, "ziel_gewicht", use_case.zielort_radius_m
            )
            print(f"   → {len(sources)} Zielort-Quellen, Reichweite "
                  f"{use_case.zielort_radius_m:g} m")
            del targets_proj, sources
        del targets

    # ── 10. DEM / Hangneigung ─────────────────────────────────────────
    _step(10)
    hex_proj["hangneigung_grad"] = dem_adapter.get_slopes(latlng_points)
    del latlng_points

    # ── 11. Vegetationsabdeckung verschneiden ───────────────────────
    # Nur berechnen, wenn der Faktor auch gewichtet ist – sonst dient die
    # Vegetation nur als Anzeige-Layer und die teure Verschneidung entfällt.
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

    # ── 12. Eigene Flächen verschneiden ────────────────────────────
    # Nutzer-Upload (factorConfig.user_geojson): Punkte/Linien werden gepuffert
    # (1,5 m / 2,5 m), Flächen unverändert; Distanz je Hexagon zur Union. Die
    # eigentliche Score-/Ausschluss-Ableitung passiert im MCE-Schritt. Ohne Datei
    # bleibt abstand_eigendaten_m NaN (→ Faktor wirkungslos).
    _step(12)
    hex_proj["abstand_eigendaten_m"] = np.nan
    if user_geojson is not None:
        try:
            _feats = user_geojson.get("features", []) if isinstance(user_geojson, dict) else user_geojson
            user_gdf = gpd.GeoDataFrame.from_features(_feats, crs="EPSG:4326")
        except Exception as exc:  # defensive: sanitisiert, aber nie dem Client trauen
            print(f"   ⚠️  Eigene Flächen unlesbar, übersprungen: {exc}")
            user_gdf = None
        if user_gdf is not None and len(user_gdf):
            user_gdf = user_gdf[user_gdf.geometry.notna() & ~user_gdf.geometry.is_empty]
        if user_gdf is not None and len(user_gdf):
            user_proj = buffer_by_geom_type(
                user_gdf.to_crs("EPSG:25832"), USER_POINT_BUFFER_M, USER_LINE_BUFFER_M
            )
            hex_proj["abstand_eigendaten_m"] = _dist_to_union(centroids, user_proj)
            del user_proj
        del user_gdf

    # ── 13. MCE-Scoring ────────────────────────────────────────────
    _step(13)
    w = use_case.weights

    def slope_score(deg):
        if deg <= 2:   return 100.0
        elif deg <= 5: return 100.0 - (deg - 2) / 3 * 40
        elif deg <= 8: return 60.0 - (deg - 5) / 3 * 60
        else:          return 0.0

    # Radwegnähe: Bedarfsfaktor, nur bei Gewicht > 0 berechnet (abstand_radweg_m
    # ist sonst NaN, da Schritt 3 übersprungen wurde) → score_radweg NaN → DB NULL.
    if (w.get("w_cyclepath", 0) or 0) > 0:
        hex_proj["score_radweg"] = hex_proj["abstand_radweg_m"].apply(
            lambda d: TildaLoader.score_cycleway_proximity(d, use_case.max_cyclepath_dist_m)
        )
    else:
        hex_proj["score_radweg"] = np.nan
    hex_proj["score_hangneigung"] = hex_proj["hangneigung_grad"].apply(slope_score)

    # ── Basis-Score: gewichteter Durchschnitt der Kriterien ───────────────
    # Vegetation ist KEIN Kriterium, sondern ein separater Abzug (bzw. Bonus)
    # weiter unten – wie alle Modifier verschiebt sie den fertigen Score um
    # Punkte, statt sich einen Anteil an ihm zu teilen. Übersprungene Faktoren
    # (ÖPNV bei Gewicht 0) haben eine NaN-Score-Spalte; `_term` überspringt sie
    # als Skalar 0.0, damit die Summe nicht durch `NaN * 0 = NaN` vergiftet wird.
    def _term(col, wkey):
        wv = w.get(wkey, 0) or 0
        return hex_proj[col] * wv if wv else 0.0

    # Gewichteter Durchschnitt statt gewichteter Summe: durch die Division durch
    # die Summe der aktiven Gewichte liegt das Ergebnis immer in 0–100, egal wie
    # die Gewichte gesetzt sind. Nur ihr Verhältnis zueinander zählt – die UI
    # muss die Gewichte deshalb nicht auf eine feste Summe zwingen.
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
    # Ohne ein einziges gewichtetes Kriterium bleibt der Grundscore 0 (statt NaN),
    # damit der Gesamtscore auch dann nur aus den Modifiern besteht und die
    # NOT-NULL-Spalte `mce_gesamtscore` gefüllt bleibt.
    base_score = _group_score(BEDARF_TERMS + BEBAUUNG_TERMS).fillna(0.0)

    # ── Vegetations-Effekt: stufenloser Abzug bzw. Bonus ───────────────────
    # `w_vegetation` (0–1) ist der maximale Effekt in Punkten (× 100). Unter der
    # Toleranzschwelle bleibt der Effekt 0, darüber steigt er linear bis zum
    # Maximum bei 100 % Bedeckung.
    #   direction "negative" (Grün schützen)   → Abzug
    #   direction "positive" (Grün bevorzugen) → Bonus
    # `score_vegetation` hält den tatsächlich angewandten Effekt in Punkten,
    # vorzeichenbehaftet wie `score_bestand` (−w_vegetation*100 .. +w_vegetation*100) –
    # die Sidebar kann die Richtung sonst nicht anzeigen, sie steht nur im
    # factorConfig. Ohne Gewicht NaN (→ DB NULL, Sidebar zeigt „–"), da die
    # Coverage dann gar nicht berechnet wurde.
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

    # ── Kreuzungs-Bonus: stufenloser Zuschlag nahe Bordstein-Ecken ─────────
    # Radabstellanlagen lassen sich an Straßenecken gut platzieren – ideal
    # ~5–8 m von der Bordsteinecke entfernt (nicht in der Kreuzungsmitte). Der
    # Bonus ist ein Modifier auf den Basis-Score (wie Vegetation); `w_intersection`
    # (0–1) ist der maximale Zuschlag in Punkten (× 100). Die Ecken-Distanz
    # `abstand_kreuzung_m` wurde bereits in Schritt 7 geladen (NaN ohne Gewicht);
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
    # bereits in Schritt 8 geladen (NaN ohne Gewicht); ohne Gewicht bleibt auch
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

    # ── Fußgängerzonen-Bonus: Zuschlag an Ecken Straße × Fußgängerzone ─────
    # An Kreuzungen, wo eine der üblichen Straßenkategorien auf eine
    # Fußgängerzone trifft, besteht besonders hoher Bedarf. Gleicher
    # Bordstein-Ecken-Mechanismus und dieselbe Distanz-Rampe wie beim
    # Kreuzungs-Bonus (ideal 5–8 m von der Ecke), aber eigenes Gewicht
    # `w_fussgaengerzone` und eigene äußere Reichweite `fussgaengerzone_radius_m`.
    # Der Bonus zählt zur Bedarfsgruppe (siehe unten). `abstand_fussgaengerzone_m`
    # wurde bereits in Schritt 7 geladen (NaN ohne Gewicht); ohne Gewicht bleibt
    # auch `score_fussgaengerzone` NaN (→ DB NULL).
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

    # ── Bewohnerbedarf: Zuschlag rund um bewohnte Gebäude ──────────────────
    # Aus der in Schritt 5 berechneten gewichteten Nachbarschaftssumme `bewohner_ew`
    # (Einwohner, linear mit dem Abstand ab Gebäudekante abfallend) wird ein Zuschlag
    # auf die BEDARFS-Gruppe – wo viele Menschen wohnen, wird auch abgestellt.
    # `bewohnerbedarf_saettigung_ew` ist der Wert, ab dem der Zuschlag voll ausgereizt
    # ist (darüber wird gekappt); `w_bewohnerbedarf` (0–1) der maximale Zuschlag in
    # Punkten (× 100).
    # Hexagone, die überwiegend von einem Gebäude bedeckt sind (`gebaeude`, s.
    # Schritt 4), bekommen bewusst 0: der Bedarf entsteht RUND UM das Gebäude,
    # nicht darauf. Sie sind ohnehin hart ausgeschlossen (mce/Bebauung), der
    # Bedarf bliebe sonst aber stehen und die Sidebar wiese Bedarf auf dem Dach
    # aus. Hexagone, die ein Gebäude nur zu einem kleineren Anteil berühren,
    # gelten NICHT als `gebaeude` und behalten ihren vollen Zuschlag.
    # Ohne Gewicht bleibt `score_bewohnerbedarf` NaN (→ DB NULL, Sidebar „–").
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

    # ── Zielorte-Bonus: Zuschlag rund um Gebäude mit Alltagszielen ──────────
    # Aus der in Schritt 9 berechneten gewichteten Nachbarschaftssumme `ziel_praesenz`
    # (Anzahl erreichbarer Zielort-Gebäude – Grundversorgung/Bildung/Einkauf/Freizeit
    # aus public."poiClassification" –, linear mit dem Abstand ab Gebäudekante
    # abfallend) wird ein Zuschlag auf die BEDARFS-Gruppe – analog zum Bewohnerbedarf,
    # nur mit Zielort- statt Zensus-Quellen (siehe `_target_demand_sources`).
    # `zielort_saettigung` ist der Wert, ab dem der Zuschlag voll ausgereizt ist;
    # `w_target` (0–1) der maximale Zuschlag in Punkten (× 100). Wie beim
    # Bewohnerbedarf bekommen Hexagone, die überwiegend von einem Gebäude bedeckt
    # sind, bewusst 0 (Bedarf entsteht RUND UM das Gebäude, nicht darauf). Ohne
    # Gewicht bleibt `score_zielorte` NaN (→ DB NULL, Sidebar „–").
    w_ziel = w.get("w_target", 0) or 0
    if w_ziel > 0:
        ziel_saettigung = max(1.0, use_case.zielort_saettigung)
        ziel_faktor = (hex_proj["ziel_praesenz"].fillna(0.0) / ziel_saettigung).clip(0.0, 1.0)
        ziel_faktor = ziel_faktor.where(~hex_proj["gebaeude"], 0.0)
        ziel_bonus = (w_ziel * 100.0) * ziel_faktor
        hex_proj["score_zielorte"] = ziel_bonus.round(1)
        ziel_delta = ziel_bonus
    else:
        hex_proj["score_zielorte"] = np.nan
        ziel_delta = 0.0

    # ── Bestandsanlagen: Bedarfssenkung um bestehende Radabstellanlagen ─────
    # Bestehende Fahrradabstellanlagen (public."bicycleParking_points") senken den
    # Bedarf: wo bereits abgestellt werden kann, braucht es weniger neue Anlagen.
    # Negativer Modifier auf die BEDARFS-Gruppe (analog zum Fußgängerzonen-Bonus,
    # nur mit umgekehrtem Vorzeichen). `w_bestand` (0–1) ist der maximale Abzug in
    # Punkten (× 100). Die Reichweite je Anlage hängt an ihrer Kapazität:
    # Durchmesser = capacity/2 m (→ Radius capacity/4); ohne capacity-Tag gilt der
    # Default-Durchmesser. Innerhalb des Einzugskreises voller Abzug, außen 0 (harte
    # Kante – die Stärke kommt allein aus dem Gewicht). Nur bei Gewicht > 0 wird der
    # PostGIS-Query gefahren; sonst bleibt `score_bestand` NaN (→ DB NULL).
    # Ausschluss der Bebauung durch Bestandsanlagen ist bewusst (noch) nicht
    # umgesetzt – nur die Bedarfssenkung.
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

    # ── Eigene Flächen: weicher Modifier ODER harter Ausschluss ────────────
    # `user_geojson_mode` bestimmt die Wirkung der in Schritt 12 berechneten
    # Distanz. Punkte/Linien sind bereits gepuffert, Flächen exakt – ein Hexagon
    # gilt als „innerhalb", wenn seine Distanz zur (gepufferten) Union 0 ist.
    #   bonus/penalty    → voller Zu-/Abschlag innerhalb, 0 außerhalb; Stärke
    #                      w_eigendaten (× 100). EIGENE Kategorie: fließt in den
    #                      Gesamtscore, aber NICHT in Bedarf/Bebauung.
    #   exclude_inside   → Hexagon innerhalb → mce = 0
    #   exclude_outside  → Hexagon außerhalb → mce = 0 (erlaubte-Zonen-Maske)
    # Harte Ausschlüsse nullen ausschließlich mce_gesamtscore (nicht Bedarf/Bebauung).
    eigendaten_delta = 0.0
    eigendaten_exclude = None
    abstand_eig = hex_proj["abstand_eigendaten_m"]
    has_eig = abstand_eig.notna().any()
    inside_eig = abstand_eig.notna() & (abstand_eig <= 0)
    eig_mode = use_case.user_geojson_mode
    if has_eig and eig_mode == "exclude_inside":
        eigendaten_exclude = inside_eig
        hex_proj["score_eigendaten"] = np.nan
    elif has_eig and eig_mode == "exclude_outside":
        eigendaten_exclude = abstand_eig.notna() & ~inside_eig
        hex_proj["score_eigendaten"] = np.nan
    else:
        w_eig = w.get("w_eigendaten", 0) or 0
        if has_eig and w_eig > 0 and eig_mode in ("bonus", "penalty"):
            sign = 1.0 if eig_mode == "bonus" else -1.0
            effect = (w_eig * 100.0) * inside_eig.astype(float)
            hex_proj["score_eigendaten"] = (sign * effect).round(1)
            eigendaten_delta = sign * effect
        else:
            hex_proj["score_eigendaten"] = np.nan

    # ── Gesamtscore (Kombination) ──────────────────────────────────────────
    # `total` = `base_score ± veg + kreuz + parken + fussgz + bewohner + ziel + bestand
    # + eigendaten`; die Modifier liegen als eigene Delta-Serien vor, damit sie unten
    # für die Teil-Scores wiederverwendbar sind. `fussgz_delta`/`bewohner_delta`/
    # `bestand_delta`/`eigendaten_delta` sind per Default 0 (Gewichte 0), ändern
    # bestehende Läufe also nicht. `ziel_delta` NICHT mehr per Default 0: w_target war
    # vorher ein Kriterium mit Default-Gewicht 0.15, jetzt ein Modifier mit demselben
    # Gewicht – bestehende Läufe verhalten sich also beim nächsten Neuberechnen anders.
    total = (
        base_score + veg_delta + kreuz_delta + parken_delta
        + fussgz_delta + bewohner_delta + ziel_delta + bestand_delta + eigendaten_delta
    )
    # Gesamtscore auf [0, 100] begrenzen – darf nie unter 0 fallen.
    hex_proj["mce_gesamtscore"] = total.clip(lower=0.0, upper=100.0).round(1)

    # ── Teil-Scores: Bedarf vs. Bebauung (Issue #3415) ─────────────────────
    # Die Hexagon-Scores vermischen zwei fachlich getrennte Fragen. Sie werden
    # hier zusätzlich als zwei getrennt normalisierte 0–100-Ansichten berechnet
    # (die Kombination `mce_gesamtscore` oben bleibt davon unberührt):
    #   Bedarf  („will hier parken")  → Radweg (w_cyclepath), ÖPNV (w_transit),
    #       Zielorte (w_target) + Modifier Fußgängerzonen (Zuschlag),
    #       Bewohnerbedarf (Zuschlag) und Bestandsanlagen (Abzug)
    #   Bebauung („kann hier bauen") → Hangneigung (w_slope)
    #       + Modifier Vegetation, Kreuzungen, Parken; harte Ausschlüsse.
    # Jede Gruppe wird durch die Summe ihrer aktiven Gewichte geteilt (dasselbe
    # `_group_score` wie beim Grundscore oben), damit der Teil-Score unabhängig
    # von der Gewichtsverteilung 0–100 bleibt. Ist eine Gruppe komplett
    # ungewichtet, bleibt ihr Score NaN (→ DB NULL).
    #
    # Fußgängerzonen-Bonus, Bewohnerbedarf und Zielorte (Zuschläge) sowie
    # Bestandsanlagen (Abzug) sind Bedarfs-Modifier (analog Kreuzung/Parken bei
    # Bebauung): erst normalisieren, dann die Deltas addieren, dann clippen.
    base_bedarf = _group_score(BEDARF_TERMS)
    score_bedarf = (
        base_bedarf + fussgz_delta + bewohner_delta + ziel_delta + bestand_delta
    ).clip(lower=0.0, upper=100.0)

    base_bebauung = _group_score(BEBAUUNG_TERMS)
    score_bebauung = (base_bebauung + veg_delta + kreuz_delta + parken_delta).clip(
        lower=0.0, upper=100.0
    )

    hex_proj["score_bedarf"] = score_bedarf.round(1)
    hex_proj["score_bebauung"] = score_bebauung.round(1)

    # Harte Ausschlusskriterien sind ausschließlich Bebauungs-Kriterien: sie
    # nullen Bebauung UND Kombination, aber NICHT den Bedarf (der Bedarf besteht
    # auch dort, wo nicht gebaut werden kann). Die Radwegdistanz zählt bewusst
    # NICHT mehr dazu – Radwegnähe ist ein Bedarfs-, kein Bebauungskriterium.
    exclusion = (
        (hex_proj["score_hangneigung"]       == 0) |
        hex_proj["gebaeude"] |
        hex_proj["fahrbahn"]
    )
    apply_bebauung_exclusion(hex_proj, exclusion)

    # Eigendaten-Ausschluss (falls Modus exclude_*): nullt NUR mce_gesamtscore,
    # lässt Bedarf/Bebauung bewusst unberührt (eigene Kategorie, siehe oben).
    apply_score_exclusion(hex_proj, eigendaten_exclude, cols=("mce_gesamtscore",))

    hex_proj["eignungsklasse"] = pd.cut(
        hex_proj["mce_gesamtscore"], bins=_KLASSE_BINS, labels=_KLASSE_LABELS
    ).astype(str)

    assign_clusters(hex_proj, use_case.min_score_threshold)

    print(f"\n✅ Fertig: {len(hex_proj)} Hexagone")
    return hex_proj
