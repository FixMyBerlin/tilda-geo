"""PostGIS-Datenquelle für den Flächenfinder.

Ersetzt den PBF-basierten OsmPbfLoader: liest Eingangsgeometrien direkt aus
tildas bereits prozessiertem `public`-Schema (EPSG:3857). Damit entfällt das
Parsen des 4,4 GB großen OSM-PBF und es werden dieselben Daten wie im tilda-Viewer
genutzt.

Modularer Erweiterungspunkt: `_TRANSIT_TAG_MAP` bildet OSM-Tag-Dicts auf
DB-Kategorien in `public."publicTransport"` ab. Für nicht zugeordnete Tags
wird ein leeres GeoDataFrame zurückgegeben.
"""
from __future__ import annotations

import geopandas as gpd
from shapely.geometry.base import BaseGeometry


def _empty(crs="EPSG:3857") -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(geometry=[], crs=crs)


def _sql_literal(v) -> str:
    """Escape a string value for SQL (single-quote, no parameterisation needed here)."""
    return v.replace("'", "''")


# Maps OSM tag dicts (as used in scorer.py _TRANSIT_TYPES) to publicTransport categories.
# Values are lists of category strings stored in tags->>'category' in the DB.
# Bus stops (highway=bus_stop) are not yet in the publicTransport table.
_TRANSIT_TAG_MAP: list[tuple[dict, list[str]]] = [
    ({"railway": "tram_stop"},             ["tram_station"]),
    ({"railway": "subway_entrance"},        ["subway_station"]),
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
        """Liest Geometrien einer `public`-Tabelle, die die Studienfläche schneiden.

        `polygon_4326` ist in EPSG:4326; `public.*.geom` liegt in EPSG:3857.
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
            print(f"   ✓ PostGIS: {len(gdf)} Features aus public.{table}")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS-Abfrage public.{table} fehlgeschlagen: {e}")
            return _empty()

    def load_buildings(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Gebäudepolygone aus `public._buildings` (EPSG:5243 → gibt EPSG:4326 zurück)."""
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
            print(f"   ✓ PostGIS: {len(gdf)} Gebäude aus public._buildings")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS-Abfrage public._buildings fehlgeschlagen: {e}")
            return _empty("EPSG:4326")

    def load_cycleways(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Radwege aus `public.bikelanes` (ersetzt den PBF-Pfad)."""
        gdf = self._read_table("bikelanes", polygon_4326)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")

    def load_intersection_corners(
        self, polygon_4326: BaseGeometry, road_classes: list[str] | None = None
    ) -> gpd.GeoDataFrame:
        """Bordstein-Eckpunkte an Straßenkreuzungen (für den Kreuzungs-Bonus).

        Wiederverwendet die vom Parking-Topic berechneten Ecken:
        `_parking_intersection_corners` ist der Schnittpunkt der beiden Kerbs
        (= um die halbe – aus OSM `width` bzw. Klassen-Fallback approximierte –
        Straßenbreite versetzten Mittellinien = Außenkanten) an Kreuzungsknoten.
        Wir filtern auf die gewünschten Straßenklassen: BEIDE an der Ecke
        beteiligten Straßen müssen in `road_classes` liegen.

        Abhängigkeit: die `_parking_*`-Tabellen existieren nur, wenn das
        Parking-Topic für die Region prozessiert wurde. Fehlen sie, wird ein
        leeres GeoDataFrame zurückgegeben (der Faktor trägt dann 0 bei) – analog
        zum graceful Fallback bei fehlenden CIR-Kacheln in der Vegetation.

        Geometrie liegt in EPSG:5243; Rückgabe in EPSG:4326.
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
            print(f"   ✓ PostGIS: {len(gdf)} Kreuzungs-Ecken aus _parking_intersection_corners")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS-Abfrage _parking_intersection_corners fehlgeschlagen: {e}")
            return _empty("EPSG:4326")

    def load_pedestrian_intersection_corners(
        self, polygon_4326: BaseGeometry, road_classes: list[str] | None = None
    ) -> gpd.GeoDataFrame:
        """Bordstein-Ecken, wo eine Straße auf eine Fußgängerzone trifft.

        Wie `load_intersection_corners`, aber mit anderem Klassen-Filter: an der
        Ecke muss die EINE beteiligte Straße in `road_classes` (die üblichen
        Straßenkategorien) liegen und die ANDERE eine Fußgängerzone
        (`tags->>'road' = 'pedestrian'`) sein. Reine Fußgängerzonen-Ecken (beide
        Seiten `pedestrian`) und normale Straßenkreuzungen werden ausgeschlossen.

        Datengrundlage: lineare `highway=pedestrian` liegen in `_parking_roads`
        (nur `area=yes`-Polygone fehlen) und erzeugen über den regulären
        Kerb-/Kreuzungs-Mechanismus des Parking-Topics Ecken in
        `_parking_intersection_corners`. Der Ecken-Datensatz selbst muss dafür
        nicht geändert werden.

        Abhängigkeit + Fallback identisch zu `load_intersection_corners`.
        Geometrie liegt in EPSG:5243; Rückgabe in EPSG:4326.
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
            print(f"   ✓ PostGIS: {len(gdf)} Fußgängerzonen-Ecken aus _parking_intersection_corners")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS-Abfrage _parking_intersection_corners (Fußgängerzone) fehlgeschlagen: {e}")
            return _empty("EPSG:4326")

    def load_car_parking(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """KFZ-Parkflächen als Umwidmungs-Kandidaten (für den Parken-Bonus).

        Wiederverwendet die vom Parking-Topic berechneten öffentlichen Tabellen:
        `public.parkings` (On-Street-Parkstreifen als Linien) und
        `public.parkings_separate` (Off-Street-Parkflächen als Polygone), als
        Union. Es zählt nur tatsächlich vorhandenes/erlaubtes Parken: für die
        Linien `capacity > 0` und kein Halte-/Parkverbot (`condition_category`
        ≠ no_parking/no_stopping/no_standing); für die Flächen fehlt meist ein
        `capacity`-Tag, daher zählen sie schon ohne den Tag (nur ein explizit
        gesetztes `capacity` ≤ 0 schließt aus). Beide Geometrietypen werden
        zusätzlich nach `access` gefiltert: `no` und `customers` sind
        ausgeschlossen (nicht öffentlich nutzbar für eine Umwidmung).

        Der `capacity`-JSONB-Wert ist nicht garantiert numerisch, daher wird per
        Regex auf eine Zahl geprüft, bevor gecastet wird (sonst würfe der Cast).
        Wichtig: `NULLIF(...) ~ regex` liefert bei fehlendem Tag SQL-`NULL`
        (nicht `FALSE`), daher braucht die Fläche-Bedingung eine explizite
        `IS NULL`-Klausel statt eines simplen `NOT`.

        Abhängigkeit: die `parkings*`-Tabellen existieren nur, wenn das
        Parking-Topic für die Region prozessiert wurde. Fehlen sie, wird ein
        leeres GeoDataFrame zurückgegeben (der Faktor trägt dann 0 bei) – analog
        zum graceful Fallback bei den Kreuzungs-Ecken.

        Geometrie liegt in EPSG:3857; Rückgabe in EPSG:4326.
        """
        wkt = polygon_4326.wkt
        bbox = f"ST_Transform(ST_GeomFromText('{wkt}', 4326), 3857)"
        # Nur numerische capacity-Werte casten; sonst als 0 behandeln.
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
            print(f"   ✓ PostGIS: {len(gdf)} KFZ-Parkflächen aus parkings/parkings_separate")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS-Abfrage parkings/parkings_separate fehlgeschlagen: {e}")
            return _empty("EPSG:4326")

    def load_bicycle_parking(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Bestehende Fahrradabstellanlagen (für den Bestands-Bedarfsfaktor).

        Liest `public."bicycleParking_points"` – die Punkt-Tabelle des
        bicycleParking-Topics. Sie ist der Superset „eine Anlage = ein Punkt":
        OSM-Knoten (`amenity=bicycle_parking`) UND die Zentroide der Flächen aus
        `bicycleParking_areas` emittieren hierher. Es zählen bewusst ALLE
        erfassten Anlagen (kein Typ-/Kapazitätsfilter).

        Die (optionale) Kapazität wird als numerische Spalte `capacity`
        zurückgegeben – der Scorer leitet daraus die Reichweite je Anlage ab
        (Durchmesser = capacity/2). Der JSONB-Wert ist nicht garantiert
        numerisch, daher wird per Regex geprüft, bevor gecastet wird (sonst würfe
        der Cast); fehlt/ungültig → NULL (→ NaN → Default-Reichweite).

        Abhängigkeit: die `bicycleParking_*`-Tabellen existieren nur, wenn das
        bicycleParking-Topic für die Region prozessiert wurde. Fehlen sie, wird
        ein leeres GeoDataFrame zurückgegeben (der Faktor trägt dann 0 bei) –
        analog zum graceful Fallback bei den KFZ-Parkflächen.

        Geometrie liegt in EPSG:3857; Rückgabe in EPSG:4326.
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
            print(f"   ✓ PostGIS: {len(gdf)} Bestands-Radabstellanlagen aus bicycleParking_points")
            return gdf
        except Exception as e:
            print(f"   ⚠️  PostGIS-Abfrage bicycleParking_points fehlgeschlagen: {e}")
            return _empty("EPSG:4326")

    def features_from_polygon(self, polygon_4326: BaseGeometry, tags: dict) -> gpd.GeoDataFrame:
        """Drop-in-Ersatz für OsmPbfLoader.features_from_polygon().

        Mappt OSM-Tag-Dicts auf `public."publicTransport"` (categories via JSONB).
        Nicht zugeordnete Tags (z. B. highway=bus_stop) geben ein leeres GeoDataFrame zurück.
        """
        categories = _match_transit_tags(tags)
        if not categories:
            return _empty("EPSG:4326")

        cats_sql = ", ".join(f"'{_sql_literal(c)}'" for c in categories)
        where = f"tags->>'category' IN ({cats_sql})"
        gdf = self._read_table("publicTransport", polygon_4326, where=where)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")
