"""The vegetation mask uses the NDVI threshold of the tile's source."""

import os
import tempfile
import unittest

import numpy as np
import rasterio
from affine import Affine

from scoring.cir_sources import SOURCE_BAYERN, SOURCE_BB, SOURCE_BERLIN, SOURCE_HESSEN
from scoring.vegetation import _verarbeite_kachel

TRANSFORM = Affine(0.2, 0, 0, 0, -0.2, 20)  # 100 × 100 px = 20 × 20 m


def _tile(path: str, nir: int, red: int) -> None:
    """A uniform tile with NIR in band 1 and red in band 2."""
    bands = np.stack([np.full((100, 100), v, dtype=np.uint8) for v in (nir, red, 80)])
    with rasterio.open(
        path, "w", driver="GTiff", width=100, height=100, count=3, dtype="uint8",
        transform=TRANSFORM, crs="EPSG:25832",
    ) as dst:
        dst.write(bands)


class VegetationThresholdTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.path = os.path.join(self.dir.name, "tile.tiff")

    def tearDown(self):
        self.dir.cleanup()

    def _green_area(self, nir, red, source):
        _tile(self.path, nir, red)
        polys = _verarbeite_kachel(self.path, 1, 2, source.ndvi_min, TRANSFORM)
        return sum(p["geometry"].area for p in polys)

    def test_berlin_roof_level_ndvi_is_not_green(self):
        # NDVI 0.2: still reached by some roofs in the Berlin summer images.
        self.assertEqual(self._green_area(120, 80, SOURCE_BERLIN), 0)

    def test_berlin_lawn_level_ndvi_is_green(self):
        # NDVI 0.4: below the median of OSM green areas in the Berlin summer images.
        self.assertGreater(self._green_area(140, 60, SOURCE_BERLIN), 0)

    def test_low_ndvi_is_green_for_summer_sources(self):
        # NDVI 0.15: dry lawn in Brandenburg; roofs there and in Bayern/Hessen stay below 0.1.
        for source in (SOURCE_BB, SOURCE_BAYERN, SOURCE_HESSEN):
            with self.subTest(source=source.key):
                self.assertGreater(self._green_area(115, 85, source), 0)

    def test_roof_level_ndvi_is_not_green_for_summer_sources(self):
        # NDVI about 0: typical roof in Bayern, Hessen and Brandenburg outside Berlin.
        for source in (SOURCE_BB, SOURCE_BAYERN, SOURCE_HESSEN):
            with self.subTest(source=source.key):
                self.assertEqual(self._green_area(100, 100, source), 0)

if __name__ == "__main__":
    unittest.main()
