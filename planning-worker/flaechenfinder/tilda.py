import geopandas as gpd
from shapely.geometry.base import BaseGeometry


class TildaLoader:
    """Lädt Radwege aus tildas PostGIS (`public.bikelanes`).

    Wrappt einen PostgisLoader; die Scoring-Funktion bleibt unverändert.
    """

    def __init__(self, postgis_loader):
        self._loader = postgis_loader
        self._cache = None

    def load_cycleways(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        if self._cache is not None:
            return self._cache
        try:
            gdf = self._loader.load_cycleways(study_area_geom)
            gdf = gdf[gdf.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy()
            self._cache = gdf
            print(f"   ✓ Radwege: {len(gdf)} Features aus public.bikelanes")
            return gdf
        except Exception as e:
            print(f"   ⚠️  Radweg-Abfrage fehlgeschlagen: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    @staticmethod
    def score_cycleway_proximity(dist_m: float, max_dist_m: float) -> float:
        """0–100: < 20 m → 100, linear bis max_dist_m → 0, darüber 0."""
        if dist_m <= 20:
            return 100.0
        if dist_m >= max_dist_m:
            return 0.0
        return max(0.0, 100.0 * (1.0 - (dist_m - 20) / (max_dist_m - 20)))
