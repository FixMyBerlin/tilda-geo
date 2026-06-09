"""PostGIS-Datenquelle für den Flächenfinder.

Ersetzt den PBF-basierten OsmPbfLoader: liest Eingangsgeometrien direkt aus
tildas bereits prozessiertem `public`-Schema (EPSG:3857). Damit entfällt das
Parsen des 4,4 GB großen OSM-PBF und es werden dieselben Daten wie im tilda-Viewer
genutzt.

Modularer Erweiterungspunkt (statische Datensätze, ÖPNV/POI-Layer): die Registry
`LAYER_SOURCES` bildet einen logischen Layer-Namen auf eine `public`-Tabelle +
optionalen SQL-WHERE-Filter ab. Tilda prozessiert (Stand MVP) nur Radwege als
sinnvoll nutzbaren Layer (`bikelanes`); für Tag-Abfragen, die keiner Tabelle
zugeordnet sind, wird ein leeres GeoDataFrame zurückgegeben (der Scorer behandelt
das robust). Weitere Layer werden später durch Einträge hier ergänzt.
"""
from __future__ import annotations

import geopandas as gpd
from shapely.geometry.base import BaseGeometry


def _empty(crs="EPSG:3857") -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(geometry=[], crs=crs)


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

        MVP: tildas `public`-Schema exponiert keine beliebigen OSM-Tags, daher
        wird für nicht zugeordnete Layer ein leeres GeoDataFrame zurückgegeben.
        Der Scorer interpretiert das als „Layer nicht vorhanden“ (Score 0 bzw.
        kein Hindernis). Erweiterung später via LAYER_SOURCES-Registry.
        """
        return _empty()
