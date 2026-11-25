import geopandas as gpd
from shapely.geometry.base import BaseGeometry


class TildaLoader:
    """Geometry-type filters and the cycleway cache on top of a PostgisLoader.

    Does not catch errors: a failed query is already turned into an empty result
    plus a data note by the PostgisLoader (see its class docstring).
    """

    def __init__(self, postgis_loader):
        self._loader = postgis_loader
        self._cache = None

    def load_cycleways(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        if self._cache is not None:
            return self._cache
        gdf = self._loader.load_cycleways(study_area_geom)
        gdf = gdf[gdf.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy()
        self._cache = gdf
        print(f"   ✓ Cycleways: {len(gdf)} features from public.bikelanes")
        return gdf

    def load_buildings(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        return self._loader.load_buildings(study_area_geom)

    def load_building_entrances(
        self,
        study_area_geom: BaseGeometry,
        kinds: tuple[str, ...] = ("yes", "main", "home", "staircase"),
    ) -> gpd.GeoDataFrame:
        """Building entrances (default `entrance=yes`/`main`/`home`/`staircase`) as points.

        Not used by any factor yet: meant as a starting point for letting resident demand
        originate at the entrance instead of the building in the future.
        """
        gdf = self._loader.load_building_entrances(study_area_geom, kinds)
        return gdf[gdf.geometry.geom_type == "Point"].copy() if len(gdf) else gdf

    def load_intersection_corners(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Curb corner points at street intersections (for the intersection bonus)."""
        gdf = self._loader.load_intersection_corners(study_area_geom)
        return gdf[gdf.geometry.geom_type == "Point"].copy() if len(gdf) else gdf

    def load_pedestrian_intersection_corners(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Curb corners where a street meets a pedestrian zone."""
        gdf = self._loader.load_pedestrian_intersection_corners(study_area_geom)
        return gdf[gdf.geometry.geom_type == "Point"].copy() if len(gdf) else gdf

    def load_car_parking(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Car parking (lines + polygons) as conversion candidates."""
        return self._loader.load_car_parking(study_area_geom)

    def load_tempo30_roads(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Road lines with maxspeed ≤ 30 (and width_m, NULL if unknown) for the Tempo 30 bonus."""
        return self._loader.load_tempo30_roads(study_area_geom)

    def load_squares(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Squares (place=square) for the square bonus/penalty."""
        gdf = self._loader.load_squares(study_area_geom)
        return gdf[gdf.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].copy() if len(gdf) else gdf

    def load_bicycle_parking(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Existing bicycle parking (for the existing-parking demand factor)."""
        return self._loader.load_bicycle_parking(study_area_geom)

    def load_census_population(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Census population points (for the resident demand factor)."""
        return self._loader.load_census_population(study_area_geom)

    def load_target_locations(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Target location points from public.poiClassification (for the target location bonus)."""
        return self._loader.load_target_locations(study_area_geom)

    def load_roads(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame:
        """Road lines with width (for the carriageway exclusion)."""
        gdf = self._loader.load_roads(study_area_geom)
        return gdf[gdf.geometry.geom_type.isin(["LineString", "MultiLineString"])].copy() if len(gdf) else gdf

    def load_sealing_surfaces(self, study_area_geom: BaseGeometry) -> gpd.GeoDataFrame | None:
        """OSM input for the sealing bonus. None = could not be read (see PostgisLoader)."""
        return self._loader.load_sealing_surfaces(study_area_geom)

    @staticmethod
    def score_cycleway_proximity(dist_m: float, max_dist_m: float) -> float:
        """0–100: < 20 m → 100, linear down to 0 at max_dist_m, 0 beyond."""
        if dist_m <= 20:
            return 100.0
        if dist_m >= max_dist_m:
            return 0.0
        return max(0.0, 100.0 * (1.0 - (dist_m - 20) / (max_dist_m - 20)))
