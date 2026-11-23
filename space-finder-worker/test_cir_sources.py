"""`resolve_source`: "auto" only picks a CIR source that covers the study area."""

import unittest

from shapely.geometry import Point

from scoring.cir_sources import SOURCE_BAYERN, SOURCE_BB, SOURCE_HESSEN, resolve_source


def area(lon, lat):
    # Small square around the point; resolve_source uses its centroid.
    return Point(lon, lat).buffer(0.01)


class TestResolveSourceAuto(unittest.TestCase):
    def test_bayern(self):
        self.assertIs(resolve_source("auto", area(11.58, 48.14)), SOURCE_BAYERN)  # München
        self.assertIs(resolve_source("auto", area(11.08, 49.45)), SOURCE_BAYERN)  # Nürnberg

    def test_brandenburg_berlin(self):
        self.assertIs(resolve_source("auto", area(13.40, 52.52)), SOURCE_BB)  # Berlin
        self.assertIs(resolve_source("auto", area(13.06, 52.40)), SOURCE_BB)  # Potsdam
        self.assertIs(resolve_source("auto", area(14.33, 51.76)), SOURCE_BB)  # Cottbus

    def test_hessen(self):
        self.assertIs(resolve_source("auto", area(8.68, 50.11)), SOURCE_HESSEN)  # Frankfurt
        self.assertIs(resolve_source("auto", area(9.48, 51.31)), SOURCE_HESSEN)  # Kassel

    def test_outside_all_sources_returns_none(self):
        self.assertIsNone(resolve_source("auto", area(6.96, 50.94)))  # Köln
        self.assertIsNone(resolve_source("auto", area(10.00, 53.55)))  # Hamburg
        self.assertIsNone(resolve_source("auto", area(9.18, 48.78)))  # Stuttgart
        self.assertIsNone(resolve_source("auto", area(11.63, 52.13)))  # Magdeburg


class TestResolveSourceExplicit(unittest.TestCase):
    def test_explicit_key_ignores_location(self):
        koeln = area(6.96, 50.94)
        self.assertIs(resolve_source("bayern", koeln), SOURCE_BAYERN)
        self.assertIs(resolve_source("bb", koeln), SOURCE_BB)
        self.assertIs(resolve_source("hessen", koeln), SOURCE_HESSEN)

    def test_unknown_key_returns_none(self):
        self.assertIsNone(resolve_source("nrw", area(6.96, 50.94)))


if __name__ == "__main__":
    unittest.main()
