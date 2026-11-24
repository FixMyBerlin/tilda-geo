"""The vegetation mask uses the NDVI threshold of the tile's source."""

import os
import tempfile
import unittest

import numpy as np
import rasterio
from affine import Affine

from scoring.cir_sources import SOURCE_BAYERN, SOURCE_BB, SOURCE_HESSEN
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

    def test_bb_roof_level_ndvi_is_not_green(self):
        # NDVI 0.15: typical for roofs and asphalt in the Berlin/Brandenburg PNGs.
        self.assertEqual(self._green_area(115, 85, SOURCE_BB), 0)

    def test_same_ndvi_is_green_for_bayern_and_hessen(self):
        self.assertGreater(self._green_area(115, 85, SOURCE_BAYERN), 0)
        self.assertGreater(self._green_area(115, 85, SOURCE_HESSEN), 0)

    def test_bb_lawn_level_ndvi_is_green(self):
        # NDVI 0.3: median of OSM green areas in Neukölln.
        self.assertGreater(self._green_area(130, 70, SOURCE_BB), 0)


if __name__ == "__main__":
    unittest.main()
