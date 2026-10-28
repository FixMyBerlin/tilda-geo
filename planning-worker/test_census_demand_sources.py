"""Census points go to the nearest building within CENSUS_BUILDING_TOLERANCE_M; points
farther away stay point sources, and no resident is counted twice."""

import unittest

import geopandas as gpd
from shapely.geometry import Point, box

from flaechenfinder.scorer import _census_demand_sources

CRS = "EPSG:25832"


def census(*points):
    """points: (x, y, total)"""
    return gpd.GeoDataFrame(
        {"total": [t for _, _, t in points]},
        geometry=[Point(x, y) for x, y, _ in points],
        crs=CRS,
    )


def buildings(*boxes):
    return gpd.GeoDataFrame(geometry=[box(*b) for b in boxes], crs=CRS)


def split(sources):
    """→ ({building bounds: residents}, [(x, y, residents)] of the leftover points)"""
    polys = sources[sources.geom_type == "Polygon"]
    pts = sources[sources.geom_type == "Point"]
    return (
        {tuple(g.bounds): e for g, e in zip(polys.geometry, polys["einwohner"])},
        [(g.x, g.y, e) for g, e in zip(pts.geometry, pts["einwohner"])],
    )


class TestCensusDemandSources(unittest.TestCase):
    def test_point_inside_building(self):
        polys, pts = split(_census_demand_sources(census((5, 5, 10)), buildings((0, 0, 10, 10))))
        self.assertEqual(polys, {(0, 0, 10, 10): 10})
        self.assertEqual(pts, [])

    def test_point_3_m_outside_goes_to_building(self):
        polys, pts = split(_census_demand_sources(census((13, 5, 10)), buildings((0, 0, 10, 10))))
        self.assertEqual(polys, {(0, 0, 10, 10): 10})
        self.assertEqual(pts, [])

    def test_point_8_m_outside_stays_point(self):
        polys, pts = split(_census_demand_sources(census((18, 5, 10)), buildings((0, 0, 10, 10))))
        self.assertEqual(polys, {})
        self.assertEqual(pts, [(18, 5, 10)])

    def test_inside_wins_over_nearby_building(self):
        # Point 1 m inside A and 2 m from B: distance 0 to A wins.
        polys, pts = split(
            _census_demand_sources(census((9, 5, 10)), buildings((0, 0, 10, 10), (11, 0, 21, 10)))
        )
        self.assertEqual(polys, {(0, 0, 10, 10): 10})
        self.assertEqual(pts, [])

    def test_nearest_of_two_buildings(self):
        # 2 m from A, 4 m from B.
        polys, _ = split(
            _census_demand_sources(census((12, 5, 10)), buildings((0, 0, 10, 10), (16, 0, 26, 10)))
        )
        self.assertEqual(polys, {(0, 0, 10, 10): 10})

    def test_equally_far_from_two_buildings_counts_once(self):
        polys, pts = split(
            _census_demand_sources(census((13, 5, 10)), buildings((0, 0, 10, 10), (16, 0, 26, 10)))
        )
        self.assertEqual(sum(polys.values()), 10)
        self.assertEqual(len(polys), 1)
        self.assertEqual(pts, [])

    def test_overlapping_buildings_count_once(self):
        polys, pts = split(
            _census_demand_sources(census((5, 5, 10)), buildings((0, 0, 10, 10), (2, 2, 8, 8)))
        )
        self.assertEqual(sum(polys.values()), 10)
        self.assertEqual(len(polys), 1)
        self.assertEqual(pts, [])

    def test_points_sum_per_building(self):
        sources = _census_demand_sources(
            census((5, 5, 10), (12, 5, 4), (30, 30, 7)), buildings((0, 0, 10, 10))
        )
        polys, pts = split(sources)
        self.assertEqual(polys, {(0, 0, 10, 10): 14})
        self.assertEqual(pts, [(30, 30, 7)])
        self.assertEqual(sources["einwohner"].sum(), 21)

    def test_without_buildings_all_stay_points(self):
        points = census((5, 5, 10), (13, 5, 4))
        for bld in (None, buildings()):
            polys, pts = split(_census_demand_sources(points, bld))
            self.assertEqual(polys, {})
            self.assertEqual(pts, [(5, 5, 10), (13, 5, 4)])


if __name__ == "__main__":
    unittest.main()
