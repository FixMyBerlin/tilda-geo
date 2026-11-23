"""Carriageway widths (scoring/carriageways.py) for the carriageway exclusion and Tempo 30."""

import unittest

import geopandas as gpd
from shapely.geometry import LineString

from scoring.carriageways import _widths, fallback_width


class FallbackWidthTest(unittest.TestCase):
    def test_matches_road_class_exactly_then_by_prefix(self):
        self.assertEqual(fallback_width("residential"), 8.0)
        self.assertEqual(fallback_width("residential_priority_road"), 8.0)
        self.assertEqual(fallback_width("service_road"), 4.0)
        self.assertEqual(fallback_width("service_alley"), 4.0)
        self.assertEqual(fallback_width("living_street"), 5.0)
        self.assertEqual(fallback_width("unspecified_road"), 8.0)
        self.assertEqual(fallback_width("secondary"), 14.0)

    def test_links(self):
        self.assertEqual(fallback_width("secondary_link"), 6.0)
        self.assertEqual(fallback_width("motorway_link"), 9.0)

    def test_main_roads_are_narrower_when_oneway(self):
        self.assertEqual(fallback_width("primary", "yes"), 12.0)
        self.assertEqual(fallback_width("secondary", "yes_dual_carriageway"), 9.0)
        self.assertEqual(fallback_width("tertiary", "yes"), 7.0)
        self.assertEqual(fallback_width("tertiary", None), 10.0)

    def test_other_roads_ignore_oneway(self):
        self.assertEqual(fallback_width("residential", "yes"), 8.0)
        self.assertEqual(fallback_width("primary_link", "yes"), 6.0)

    def test_unknown(self):
        self.assertEqual(fallback_width("something_else"), 8.0)
        self.assertEqual(fallback_width(None), 8.0)
        self.assertEqual(fallback_width(float("nan")), 8.0)


class WidthsTest(unittest.TestCase):
    def _roads(self, rows):
        return gpd.GeoDataFrame(
            rows, geometry=[LineString([(0, 0), (1, 1)])] * len(rows), crs="EPSG:4326"
        )

    def test_known_width_wins_over_fallback(self):
        roads = self._roads([{"road": "primary", "oneway": "yes", "width_m": 5.5}])
        self.assertEqual(_widths(roads).tolist(), [5.5])

    def test_parking_rows_and_roads_rows_mixed(self):
        roads = self._roads([
            {"road": None, "oneway": None, "width_m": 11.0},  # from _parking_roads
            {"road": "secondary", "oneway": "yes", "width_m": None},  # from roads
            {"road": "residential", "oneway": None, "width_m": None},
        ])
        self.assertEqual(_widths(roads).tolist(), [11.0, 9.0, 8.0])

    def test_without_oneway_column(self):
        roads = self._roads([{"road": "primary", "width_m": None}])
        self.assertEqual(_widths(roads).tolist(), [18.0])


if __name__ == "__main__":
    unittest.main()
