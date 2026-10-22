"""PostGIS data source for the Flächenfinder.

Replaces the PBF-based OsmPbfLoader: reads input geometries directly from
tilda's already processed `public` schema (EPSG:3857). This avoids parsing the
4.4 GB OSM PBF and uses the same data as the tilda viewer.

Extension point: `_TRANSIT_TAG_MAP` maps OSM tag dicts to DB categories in
`public."publicTransport"`. Unmapped tags return an empty GeoDataFrame.
"""
from __future__ import annotations

import geopandas as gpd
from shapely.geometry.base import BaseGeometry

from .config import ZIELORT_CATEGORIES


def _empty(crs="EPSG:3857") -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(geometry=[], crs=crs)


def _sql_literal(v) -> str:
    """Escape a string value for SQL (single-quote, no parameterisation needed here)."""
    return v.replace("'", "''")


# Maps OSM tag dicts (as used in scorer.py _TRANSIT_TYPES) to publicTransport categories.
# Values are lists of category strings stored in tags->>'category' in the DB.
# Bus stops (highway=bus_stop) land in the same table with category='bus_stop'
# (see processing/topics/publicTransport/helper/result_tags.lua).
# subway_entrance is not mapped here: it has its own table/loader (`_publicTransport_entrances`,
# `PostgisLoader.load_subway_entrances`), not a publicTransport category.
_TRANSIT_TAG_MAP: list[tuple[dict, list[str]]] = [
    ({"highway": "bus_stop"},              ["bus_stop"]),
    ({"railway": "tram_stop"},             ["tram_station"]),
    ({"railway": ["station", "halt"]},      ["railway_station", "light_rail_station"]),
]


def _match_transit_tags(tags: dict) -> list[str] | None:
    """Return DB category list for a given OSM tag dict, or None if unmapped."""
    for osm_tags, categories in _TRANSIT_TAG_MAP:
        if set(osm_tags.keys()) != set(tags.keys()):
            continue
        match = True
        for k, v in osm_tags.items():
            tag_v = tags.get(k)
            if isinstance(v, list):
                if tag_v not in v:
                    match = False
                    break
            else:
                if tag_v != v:
                    match = False
                    break
        if match:
            return categories
    return None


class PostgisLoader:
    def __init__(self, engine):
        self.engine = engine
        self._cache: dict = {}

    def _read_table(self, table: str, polygon_4326: BaseGeometry, where: str = "") -> gpd.GeoDataFrame:
        """Read geometries of a `public` table that intersect the study area.

        `polygon_4326` is in EPSG:4326; `public.*.geom` is in EPSG:3857.
        """
        cache_key = (table, where, tuple(round(b, 6) for b in polygon_4326.bounds))
        if cache_key in self._cache:
            return self._cache[cache_key]

        wkt = polygon_4326.wkt
        extra = f" AND {where}" if where else ""
        sql = f"""
            SELECT geom
            FROM public."{table}"
            WHERE geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 3857){extra}
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:3857")
            self._cache[cache_key] = gdf
            print(f"   ✓ PostGIS: {len(gdf)} features from public.{table}")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query public.{table} failed: {e}")
            return _empty()

    def load_buildings(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Building polygons from `public._buildings` (EPSG:5243 → returns EPSG:4326)."""
        wkt = polygon_4326.wkt
        sql = f"""
            SELECT ST_Transform(geom, 4326) AS geom
            FROM public."_buildings"
            WHERE geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 5243)
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} buildings from public._buildings")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query public._buildings failed: {e}")
            return _empty("EPSG:4326")

    def load_train_station_buildings(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Train station buildings (building=train_station) from `public._buildings_train_station`.

        Processing-side `_` table (see processing/topics/landcover/buildings/
        buildings_train_station.lua), EPSG:5243 like `_buildings`. Separate table instead of
        `_buildings` because that one stores no tags and drops buildings < 100 m².
        """
        wkt = polygon_4326.wkt
        sql = f"""
            SELECT ST_Transform(geom, 4326) AS geom
            FROM public."_buildings_train_station"
            WHERE geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 5243)
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} train station buildings from public._buildings_train_station")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query public._buildings_train_station failed: {e}")
            return _empty("EPSG:4326")

    def load_building_entrances(
        self,
        polygon_4326: BaseGeometry,
        kinds: tuple[str, ...] = ("yes", "main", "home", "staircase"),
    ) -> gpd.GeoDataFrame:
        """Building entrances (`entrance=*`) from `public."buildingEntrances"`.

        Map layer in the standard topic shape (see processing/topics/landcover/buildings/
        building_entrances.lua), EPSG:3857 like the other `public.*` tables; the value
        lives in `tags->>'entrance'`. The table holds all entrance values; `kinds` filters
        them. Default is the entrances relevant to residents: `yes`/`main` plus
        `home`/`staircase`, which are the norm on residential blocks in Germany.
        `kinds=()` returns all (incl. `service`, `emergency`). Keep the default in sync with
        `mainEntranceValues` in the map style (`subcat_poi_plus_buildingEntrances.const.ts`).

        Returns `geom` (EPSG:4326) and the `entrance` column. The table is built by the
        weekend topic `landcover`; if it is missing (instance without a landcover run), an
        empty GeoDataFrame is returned – like `load_train_station_buildings`.
        """
        wkt = polygon_4326.wkt
        kind_filter = ""
        if kinds:
            values = ", ".join(f"'{_sql_literal(k)}'" for k in kinds)
            kind_filter = f" AND tags->>'entrance' IN ({values})"
        sql = f"""
            SELECT tags->>'entrance' AS entrance, ST_Transform(geom, 4326) AS geom
            FROM public."buildingEntrances"
            WHERE geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 3857){kind_filter}
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} building entrances from public.buildingEntrances")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query public.buildingEntrances failed: {e}")
            return _empty("EPSG:4326")

    def load_cycleways(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Cycleways from `public.bikelanes` (replaces the PBF path)."""
        gdf = self._read_table("bikelanes", polygon_4326)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")

    def load_subway_entrances(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Subway entrances (railway=subway_entrance) from `public._publicTransport_entrances`.

        Processing-side `_` table (see processing/topics/publicTransport/
        public_transport_entrances.lua), EPSG:3857 like the main publicTransport table.
        Replaces the earlier stopgap that scored the station point
        (category='subway_station') instead.
        """
        gdf = self._read_table("_publicTransport_entrances", polygon_4326)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")

    def load_squares(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Square areas (place=square) from `public._places_squares` (for the square bonus/penalty).

        Processing-side `_` table (see processing/topics/places/places_squares.lua),
        EPSG:3857 like the other `places` tables. MVP: closed ways only, no
        multipolygon relations (same as the pedestrian zone MVP decision).
        """
        gdf = self._read_table("_places_squares", polygon_4326)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")

    def load_bikesharing(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Bike sharing stations (`*=bicycle_rental`) from `public."bicycleParking_rental"`.

        Bike sharing is not in `publicTransport` but in its own table of the
        bicycleParking topic (processing/topics/bicycleParking/bicycle_rental.lua) –
        hence a separate loader instead of an entry in `_TRANSIT_TAG_MAP`. It is
        kept out of `bicycleParking_points`, so `load_bicycle_parking` does not
        count rental stations as existing parking. The map shows the same table in
        the "Fahrradstellplätze" layer (`subcat_bicycleParking.ts`).

        Dependency: the table only exists if the bicycleParking topic was processed
        for the region. If missing, `_read_table` returns an empty GeoDataFrame
        (bikesharing then contributes 0).
        """
        gdf = self._read_table("bicycleParking_rental", polygon_4326)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")

    def load_intersection_corners(
        self, polygon_4326: BaseGeometry, road_classes: list[str] | None = None
    ) -> gpd.GeoDataFrame:
        """Kerb corner points at road intersections (for the intersection bonus).

        Reuses the corners computed by the parking topic:
        `_parking_intersection_corners` is the intersection of the two kerbs
        (= centrelines offset by half the road width – approximated from OSM `width`
        or a class fallback – i.e. the outer edges) at intersection nodes.
        We filter on the requested road classes: BOTH roads at the corner
        must be in `road_classes`.

        Dependency: the `_parking_*` tables only exist if the parking topic was
        processed for the region. If missing, an empty GeoDataFrame is returned
        (the factor then contributes 0) – like the graceful fallback for missing
        CIR tiles in vegetation.

        Geometry is in EPSG:5243; returned in EPSG:4326.
        """
        classes = road_classes or [
            "primary", "secondary", "tertiary", "residential", "living_street",
        ]
        cats_sql = ", ".join(f"'{_sql_literal(c)}'" for c in classes)
        wkt = polygon_4326.wkt
        sql = f"""
            SELECT ST_Transform(c.geom, 4326) AS geom
            FROM public."_parking_intersection_corners" c
            JOIN public."_parking_kerbs" k1 ON k1.id = c.kerb1_id
            JOIN public."_parking_kerbs" k2 ON k2.id = c.kerb2_id
            JOIN public."_parking_roads" r1 ON r1.osm_id = k1.osm_id
            JOIN public."_parking_roads" r2 ON r2.osm_id = k2.osm_id
            WHERE c.geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 5243)
              AND r1.tags->>'road' IN ({cats_sql})
              AND r2.tags->>'road' IN ({cats_sql})
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} intersection corners from _parking_intersection_corners")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query _parking_intersection_corners failed: {e}")
            return _empty("EPSG:4326")

    def load_pedestrian_intersection_corners(
        self, polygon_4326: BaseGeometry, road_classes: list[str] | None = None
    ) -> gpd.GeoDataFrame:
        """Kerb corners where a road meets a pedestrian zone.

        Like `load_intersection_corners`, but with a different class filter: ONE
        road at the corner must be in `road_classes` (the usual road categories)
        and the OTHER a pedestrian zone (`tags->>'road' = 'pedestrian'`).
        Pure pedestrian zone corners (both sides `pedestrian`) and regular road
        intersections are excluded.

        Data basis: linear `highway=pedestrian` ways are in `_parking_roads`
        (only `area=yes` polygons are missing) and produce corners in
        `_parking_intersection_corners` via the parking topic's regular
        kerb/intersection mechanism. The corner dataset itself needs no changes.

        Dependency + fallback same as `load_intersection_corners`.
        Geometry is in EPSG:5243; returned in EPSG:4326.
        """
        classes = road_classes or [
            "primary", "secondary", "tertiary", "residential", "living_street",
        ]
        cats_sql = ", ".join(f"'{_sql_literal(c)}'" for c in classes)
        wkt = polygon_4326.wkt
        sql = f"""
            SELECT ST_Transform(c.geom, 4326) AS geom
            FROM public."_parking_intersection_corners" c
            JOIN public."_parking_kerbs" k1 ON k1.id = c.kerb1_id
            JOIN public."_parking_kerbs" k2 ON k2.id = c.kerb2_id
            JOIN public."_parking_roads" r1 ON r1.osm_id = k1.osm_id
            JOIN public."_parking_roads" r2 ON r2.osm_id = k2.osm_id
            WHERE c.geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 5243)
              AND (
                    (r1.tags->>'road' IN ({cats_sql}) AND r2.tags->>'road' = 'pedestrian')
                 OR (r1.tags->>'road' = 'pedestrian' AND r2.tags->>'road' IN ({cats_sql}))
              )
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} pedestrian zone corners from _parking_intersection_corners")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query _parking_intersection_corners (pedestrian zone) failed: {e}")
            return _empty("EPSG:4326")

    def load_roads(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Road lines with width (for the carriageway exclusion).

        Reads ALL rows from `public._parking_roads` (incl. service ways/
        driveways/tracks, no class filter) with the width already computed by
        the parking topic (`tags->>'width'`, see `road_width_tags.lua` — resolves
        the OSM `width` tag or a highway type/oneway fallback, practically always set).

        Bridges/tunnels (`tags->>'bridge'`/`tags->>'tunnel'` = 'yes', see
        `result_tags.lua`) are excluded: the carriageway is not at ground level
        there, so building beneath/next to it is possible in principle.
        `IS DISTINCT FROM 'yes'` instead of `<> 'yes'` because both tags are
        usually missing (NULL) and `NULL <> 'yes'` yields NULL (the row would
        drop out of the WHERE instead of staying included).

        Dependency + fallback same as `load_intersection_corners`:
        `_parking_roads` only exists if the parking topic was processed for the
        region. Geometry is in EPSG:5243; returned in EPSG:4326.
        """
        wkt = polygon_4326.wkt
        sql = f"""
            SELECT ST_Transform(geom, 4326) AS geom, (tags->>'width')::numeric AS width_m
            FROM public."_parking_roads"
            WHERE geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 5243)
              AND tags->>'bridge' IS DISTINCT FROM 'yes'
              AND tags->>'tunnel' IS DISTINCT FROM 'yes'
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} roads from _parking_roads")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query _parking_roads failed: {e}")
            return _empty("EPSG:4326")

    def load_car_parking(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Car parking as conversion candidates (for the parking bonus).

        Reuses the public tables computed by the parking topic:
        `public.parkings` (on-street parking lanes as lines) and
        `public.parkings_separate` (off-street parking areas as polygons), as a
        union. Only parking that actually exists/is allowed counts: for the
        lines `capacity > 0` and no stopping/parking ban (`condition_category`
        ≠ no_parking/no_stopping/no_standing); the areas mostly lack a
        `capacity` tag, so they count without it (only an explicitly set
        `capacity` ≤ 0 excludes them). Both geometry types are also filtered
        by `access`: `no` and `customers` are excluded (not publicly usable
        for a conversion).

        The `capacity` JSONB value is not guaranteed numeric, so a regex checks
        for a number before casting (the cast would throw otherwise).
        Note: `NULLIF(...) ~ regex` yields SQL `NULL` (not `FALSE`) for a
        missing tag, so the area condition needs an explicit
        `IS NULL` clause instead of a plain `NOT`.

        Dependency: the `parkings*` tables only exist if the parking topic was
        processed for the region. If missing, an empty GeoDataFrame is returned
        (the factor then contributes 0) – like the graceful fallback for the
        intersection corners.

        Geometry is in EPSG:3857; returned in EPSG:4326.
        """
        wkt = polygon_4326.wkt
        bbox = f"ST_Transform(ST_GeomFromText('{wkt}', 4326), 3857)"
        # Only cast numeric capacity values; treat others as 0.
        cap_num = "NULLIF(tags->>'capacity', '') ~ '^[0-9]+(\\.[0-9]+)?$'"
        access_ok = "COALESCE(tags->>'access', '') NOT IN ('no', 'customers')"
        sql = f"""
            SELECT ST_Transform(geom, 4326) AS geom
            FROM public."parkings"
            WHERE geom && {bbox}
              AND {cap_num} AND (tags->>'capacity')::numeric > 0
              AND COALESCE(tags->>'condition_category', '')
                  NOT IN ('no_parking', 'no_stopping', 'no_standing')
              AND {access_ok}
            UNION ALL
            SELECT ST_Transform(geom, 4326) AS geom
            FROM public."parkings_separate"
            WHERE geom && {bbox}
              AND ({cap_num} IS NOT TRUE OR (tags->>'capacity')::numeric > 0)
              AND {access_ok}
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} car parking features from parkings/parkings_separate")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query parkings/parkings_separate failed: {e}")
            return _empty("EPSG:4326")

    def load_bicycle_parking(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Existing bicycle parking (for the existing-supply demand factor).

        Reads `public."bicycleParking_points"` – the point table of the
        bicycleParking topic. It is the superset "one facility = one point":
        OSM nodes (`amenity=bicycle_parking`) AND the centroids of the areas from
        `bicycleParking_areas` are emitted here. Deliberately ALL recorded
        facilities count (no type/capacity filter).

        The (optional) capacity is returned as numeric column `capacity` – the
        scorer derives each facility's reach from it (diameter = capacity/2).
        The JSONB value is not guaranteed numeric, so a regex checks before
        casting (the cast would throw otherwise); missing/invalid → NULL
        (→ NaN → default reach).

        Dependency: the `bicycleParking_*` tables only exist if the
        bicycleParking topic was processed for the region. If missing, an empty
        GeoDataFrame is returned (the factor then contributes 0) – like the
        graceful fallback for car parking.

        Geometry is in EPSG:3857; returned in EPSG:4326.
        """
        wkt = polygon_4326.wkt
        bbox = f"ST_Transform(ST_GeomFromText('{wkt}', 4326), 3857)"
        cap_num = "NULLIF(tags->>'capacity', '') ~ '^[0-9]+(\\.[0-9]+)?$'"
        sql = f"""
            SELECT
                ST_Transform(geom, 4326) AS geom,
                CASE WHEN {cap_num} THEN (tags->>'capacity')::numeric END AS capacity
            FROM public."bicycleParking_points"
            WHERE geom && {bbox}
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} existing bicycle parking facilities from bicycleParking_points")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query bicycleParking_points failed: {e}")
            return _empty("EPSG:4326")

    def load_census_population(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Census population points for the resident demand factor.

        Reads `data.census_population_point` – the 2022 census population counts
        disaggregated to buildings (Destatis, see
        `data-schema/census_population_point/spec.yaml`). A point usually sits on
        the building centre (`cluster_typ='gebaeude_mitte'`, 99.5 %); the rest
        sits on the centre of the 100 m grid cell when the population could not
        be assigned to a building.

        Only `total` (total residents) is returned – the table's age group
        columns are deliberately unused; demand is age-independent.

        The table is in EPSG:5243 and covers all of Germany (~24 M points); the
        bbox filter therefore runs in the source CRS using the GiST index.
        Returned in EPSG:4326.

        Dependency: the table only exists if the data schema was imported on
        this environment (see data-schema/README.md). If missing, an empty
        GeoDataFrame is returned and the factor contributes 0 – like the
        graceful fallback of the other loaders.
        """
        wkt = polygon_4326.wkt
        sql = f"""
            SELECT ST_Transform(geom, 4326) AS geom, total
            FROM data.census_population_point
            WHERE geom && ST_Transform(ST_GeomFromText('{wkt}', 4326), 5243)
              AND total > 0
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} census points from data.census_population_point")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query data.census_population_point failed: {e}")
            return _empty("EPSG:4326")

    def load_target_locations(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Target location points for the "Zielorte" bonus.

        Reads `public."poiClassification"` – tilda's POI classification
        (processing/topics/poiClassification), which sorts every relevant OSM point
        (shop=*/amenity=*/tourism=*/leisure=*) into exactly one of four categories:
        Grundversorgung, Bildung, Einkauf, Freizeit. All four are read; the category
        is returned as column `category` because their ratio is configurable
        (`zielort_category_shares` in config.py).

        Geometry is in EPSG:3857 (osm2pgsql default, like `bicycleParking_points`);
        returned in EPSG:4326.

        Dependency: the table only exists if the poiClassification topic was
        processed for the region. If missing, an empty GeoDataFrame is returned
        and the factor contributes 0 – like the graceful fallback of the other
        loaders.
        """
        wkt = polygon_4326.wkt
        bbox = f"ST_Transform(ST_GeomFromText('{wkt}', 4326), 3857)"
        cats_sql = ", ".join(f"'{_sql_literal(c)}'" for c in ZIELORT_CATEGORIES)
        sql = f"""
            SELECT ST_Transform(geom, 4326) AS geom, tags->>'category' AS category
            FROM public."poiClassification"
            WHERE geom && {bbox}
              AND tags->>'category' IN ({cats_sql})
        """
        try:
            gdf = gpd.read_postgis(sql, self.engine, geom_col="geom")
            if gdf.crs is None:
                gdf = gdf.set_crs("EPSG:4326")
            print(f"   ✓ PostGIS: {len(gdf)} target locations from public.poiClassification")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS query public.poiClassification failed: {e}")
            return _empty("EPSG:4326")

    def features_from_polygon(self, polygon_4326: BaseGeometry, tags: dict) -> gpd.GeoDataFrame:
        """Drop-in replacement for OsmPbfLoader.features_from_polygon().

        Maps OSM tag dicts to `public."publicTransport"` (categories via JSONB).
        Unmapped tags return an empty GeoDataFrame.
        """
        categories = _match_transit_tags(tags)
        if not categories:
            return _empty("EPSG:4326")

        cats_sql = ", ".join(f"'{_sql_literal(c)}'" for c in categories)
        where = f"tags->>'category' IN ({cats_sql})"
        gdf = self._read_table("publicTransport", polygon_4326, where=where)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")
