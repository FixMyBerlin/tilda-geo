"""Sealed ground share per hexagon (scoring/sealing.py) with synthetic geometries.

A 10 × 10 m square stands in for a hexagon (area 100 m²), so shares are easy to
read. All geometries are in EPSG:25832.
"""

import geopandas as gpd
import numpy as np
import unittest
from shapely.geometry import LineString, Point, box

from scoring.sealing import SEALING_GROUPS, compute_sealed_share, sealing_bonus_factor

CRS = "EPSG:25832"
HEX = box(0, 0, 10, 10)


def _hexes(*geoms):
    return gpd.GeoSeries(list(geoms) or [HEX], crs=CRS)


def _surfaces(rows):
    """rows: (geometry, group, extra dict)."""
    return gpd.GeoDataFrame(
        [{"sealing_group": g, **(extra or {})} for _, g, extra in rows],
        geometry=[geom for geom, _, _ in rows],
        crs=CRS,
    )


def _areas(*geoms):
    return gpd.GeoDataFrame(geometry=list(geoms), crs=CRS)


def _share(rows, **kw):
    return compute_sealed_share(_hexes(), _surfaces(rows), **kw)[0]


class SealedShareTest(unittest.TestCase):
    def test_paving_counts_its_area(self):
        self.assertAlmostEqual(_share([(box(0, 0, 5, 10), "A", None)]), 0.5, places=2)


    def test_grass_paver_counts_half(self):
        self.assertAlmostEqual(_share([(box(0, 0, 10, 10), "A2", None)]), 0.5, places=2)


    def test_gravel_bed_inside_square_is_deducted(self):
        rows = [(box(0, 0, 10, 10), "B", None), (box(0, 0, 2, 10), "D", None)]
        self.assertAlmostEqual(_share(rows), 0.8, places=2)


    def test_lawn_inside_square_is_deducted(self):
        rows = [(box(-50, -50, 50, 50), "B", None), (box(0, 0, 3, 10), "D", None)]
        self.assertAlmostEqual(_share(rows), 0.7, places=2)


    def test_paved_path_in_park_counts(self):
        park = box(-100, -100, 100, 100)
        path = LineString([(0, 5), (10, 5)])
        rows = [(park, "D", None), (path, "A", {"width_m": 2.0})]
        self.assertAlmostEqual(_share(rows), 0.2, places=2)


    def test_path_without_surface_in_park_is_deducted(self):
        park = box(-100, -100, 100, 100)
        path = LineString([(0, 5), (10, 5)])
        rows = [(park, "D", None), (path, "B", {"width_m": 2.0})]
        self.assertAlmostEqual(_share(rows), 0.0, places=2)


    def test_sidewalk_touching_a_verge_stays(self):
        # Sidewalk y 4..6 (2 m wide), green verge reaching up to y = 4.5: only a
        # quarter of the sidewalk lies in the verge, so it is not removed.
        verge = box(-100, -100, 100, 4.5)
        sidewalk = LineString([(0, 5), (10, 5)])
        rows = [(verge, "D", None), (sidewalk, "B", {"width_m": 2.0})]
        self.assertAlmostEqual(_share(rows), 0.2, places=2)


    def test_paved_area_smaller_than_park_wins(self):
        rows = [(box(-100, -100, 100, 100), "D", None), (box(0, 0, 5, 10), "A", None)]
        self.assertAlmostEqual(_share(rows), 0.5, places=2)


    def test_sidewalk_in_pedestrian_area_is_not_counted_twice(self):
        rows = [
            (box(0, 0, 10, 10), "B", None),
            (LineString([(0, 5), (10, 5)]), "B", {"width_m": 2.5}),
        ]
        self.assertAlmostEqual(_share(rows), 1.0, places=2)


    def test_tree_pit_is_deducted(self):
        # The crown above the paving does not matter, only the pit (r = 1.5 m).
        rows = [(box(0, 0, 10, 10), "A", None), (Point(5, 5), "tree", {"crown_m": 6.0})]
        expected = 1 - (np.pi * 1.5**2) / 100
        self.assertAlmostEqual(_share(rows), expected, places=2)


    def test_carriageway_counts_when_not_excluded(self):
        cw = _areas(box(5, 0, 10, 10))
        rows = [(box(0, 0, 5, 10), "A", None)]
        self.assertAlmostEqual(_share(rows, carriageways=cw, carriageways_sealed=True), 1.0, places=2)


    def test_carriageway_is_deducted_when_excluded(self):
        cw = _areas(box(5, 0, 10, 10))
        rows = [(box(0, 0, 10, 10), "B", None)]
        self.assertAlmostEqual(_share(rows, carriageways=cw, carriageways_sealed=False), 0.5, places=2)


    def test_road_sidewalk_is_shifted_by_its_offset(self):
        # Road along y = -5, sidewalk 2 m wide, axis 7 m to the left → covers y 1..3.
        road = LineString([(0, -5), (10, -5)])
        rows = [(road, "B", {"width_m": 2.0, "offset_m": 7.0})]
        self.assertAlmostEqual(_share(rows), 0.2, places=2)


    def test_road_sidewalk_mapped_twice_counts_once(self):
        # Road along y = -5 says sidewalk on the left (axis y 2), and the same
        # sidewalk is also mapped as its own footway at y 2.5: only the footway counts.
        road = LineString([(0, -5), (10, -5)])
        footway = LineString([(0, 2.5), (10, 2.5)])
        rows = [
            (road, "B", {"width_m": 2.0, "offset_m": 7.0, "highway": "residential"}),
            (footway, "B", {"width_m": 2.0, "highway": "footway"}),
        ]
        self.assertAlmostEqual(_share(rows), 0.2, places=2)


    def test_no_surfaces_gives_zero(self):
        self.assertEqual(compute_sealed_share(_hexes(), None)[0], 0.0)


    def test_hexagons_far_away_stay_zero(self):
        shares = compute_sealed_share(
            _hexes(HEX, box(100, 100, 110, 110)), _surfaces([(box(0, 0, 10, 10), "A", None)])
        )
        self.assertEqual([round(x, 6) for x in shares.tolist()], [1.0, 0.0])


    def test_group_names_match_processing(self):
        """Guard: the Lua topic (processing/topics/sealing) writes exactly these groups."""
        from pathlib import Path

        lua_dir = Path(__file__).resolve().parent.parent / "processing" / "topics" / "sealing"
        sources = "\n".join(p.read_text() for p in lua_dir.rglob("*.lua") if "__tests__" not in p.parts)
        for group in SEALING_GROUPS:
            self.assertTrue(f"'{group}'" in sources or f'"{group}"' in sources, group)


class SealingBonusFactorTest(unittest.TestCase):
    def test_linear_below_saturation(self):
        self.assertAlmostEqual(sealing_bonus_factor(25.0, 50.0), 0.5)

    def test_full_at_and_above_saturation(self):
        self.assertEqual(sealing_bonus_factor(50.0, 50.0), 1.0)
        self.assertEqual(sealing_bonus_factor(80.0, 50.0), 1.0)

    def test_no_data_stays_nan(self):
        self.assertTrue(np.isnan(sealing_bonus_factor(np.nan, 50.0)))

    def test_saturation_100_is_the_plain_share(self):
        self.assertAlmostEqual(sealing_bonus_factor(59.0, 100.0), 0.59)


class VegetationNeededTest(unittest.TestCase):
    def test_sealing_alone_skips_the_aerial_phase(self):
        from worker import vegetation_needed

        self.assertFalse(vegetation_needed({"w_versiegelung": 0.2}))
        self.assertTrue(vegetation_needed({"w_vegetation": 0.1}))
        self.assertFalse(vegetation_needed({"w_versiegelung": 0, "w_vegetation": 0}))
        self.assertFalse(vegetation_needed({}))


if __name__ == "__main__":
    unittest.main()
