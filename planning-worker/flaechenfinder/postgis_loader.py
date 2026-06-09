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

    def load_cycleways(self, polygon_4326: BaseGeometry) -> gpd.GeoDataFrame:
        """Radwege aus `public.bikelanes` (ersetzt den PBF-Pfad)."""
        gdf = self._read_table("bikelanes", polygon_4326)
        return gdf.to_crs("EPSG:4326") if len(gdf) else _empty("EPSG:4326")

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
