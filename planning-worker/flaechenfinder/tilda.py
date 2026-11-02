import geopandas as gpd
from shapely.geometry.base import BaseGeometry


class TildaLoader:
    """Loads cycleways from TILDA's PostGIS (`public.bikelanes`).

    Wraps a PostgisLoader; the scoring function stays unchanged.
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
            print(f"   ✓ Cycleways: {len(gdf)} features from public.bikelanes")
            return gdf
        except Exception as e:
            print(f"   ⚠️  Cycleway query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_buildings(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        try:
            return self._loader.load_buildings(study_area_geom)
        except Exception as e:
            print(f"   ⚠️  Building query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_building_entrances(
        self,
        study_area_geom: BaseGeometry,
        kinds: tuple[str, ...] = ("yes", "main", "home", "staircase"),
    ) -> gpd.GeoDataFrame:
        """Building entrances (default `entrance=yes`/`main`/`home`/`staircase`) as points.

        Not used by any factor yet: meant as a starting point for letting resident demand
        originate at the entrance instead of the building in the future.
        """
        try:
            gdf = self._loader.load_building_entrances(study_area_geom, kinds)
            return gdf[gdf.geometry.geom_type == "Point"].copy() if len(gdf) else gdf
        except Exception as e:
            print(f"   ⚠️  Building entrance query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_intersection_corners(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Curb corner points at street intersections (for the intersection bonus)."""
        try:
            gdf = self._loader.load_intersection_corners(study_area_geom)
            return gdf[gdf.geometry.geom_type == "Point"].copy() if len(gdf) else gdf
        except Exception as e:
            print(f"   ⚠️  Intersection corner query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_pedestrian_intersection_corners(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Curb corners where a street meets a pedestrian zone."""
        try:
            gdf = self._loader.load_pedestrian_intersection_corners(study_area_geom)
            return gdf[gdf.geometry.geom_type == "Point"].copy() if len(gdf) else gdf
        except Exception as e:
            print(f"   ⚠️  Pedestrian zone corner query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_car_parking(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Car parking (lines + polygons) as conversion candidates."""
        try:
            return self._loader.load_car_parking(study_area_geom)
        except Exception as e:
            print(f"   ⚠️  Car parking query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_squares(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Squares (place=square) for the square bonus/penalty."""
        try:
            gdf = self._loader.load_squares(study_area_geom)
            return gdf[gdf.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].copy() if len(gdf) else gdf
        except Exception as e:
            print(f"   ⚠️  Square query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_bicycle_parking(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Existing bicycle parking (for the existing-parking demand factor)."""
        try:
            return self._loader.load_bicycle_parking(study_area_geom)
        except Exception as e:
            print(f"   ⚠️  Existing bicycle parking query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_census_population(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Census population points (for the resident demand factor)."""
        try:
            return self._loader.load_census_population(study_area_geom)
        except Exception as e:
            print(f"   ⚠️  Census population query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_target_locations(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Target location points from public.poiClassification (for the target location bonus)."""
        try:
            return self._loader.load_target_locations(study_area_geom)
        except Exception as e:
            print(f"   ⚠️  Target location query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    def load_roads(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Road lines with width (for the carriageway exclusion)."""
        try:
            gdf = self._loader.load_roads(study_area_geom)
            return gdf[gdf.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy() if len(gdf) else gdf
        except Exception as e:
            print(f"   ⚠️  Road query failed: {e}")
            return gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    @staticmethod
    def score_cycleway_proximity(dist_m: float, max_dist_m: float) -> float:
        """0–100: < 20 m → 100, linear down to 0 at max_dist_m, 0 beyond."""
        if dist_m <= 20:
            return 100.0
        if dist_m >= max_dist_m:
            return 0.0
        return max(0.0, 100.0 * (1.0 - (dist_m - 20) / (max_dist_m - 20)))
