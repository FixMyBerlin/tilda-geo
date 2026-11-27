"""Courtyard detection (scoring/courtyards.py) for the "Hinterhöfe ausschließen" exclusion."""

import unittest

import numpy as np
from shapely.geometry import box

from scoring.courtyards import courtyard_coverage, courtyard_flags, courtyard_polygons


def perimeter_block(gap: float = 0.0, open_side: bool = False):
    """60 × 60 m block of 12 m deep houses around a 36 × 36 m yard.

    `gap` leaves a slit between the north-east corner house and its neighbor;
    `open_side` drops the whole north row (U-shaped block).
    """
    houses = [
        box(0, 0, 60, 12),  # south
        box(0, 12, 12, 48),  # west
        box(48, 12, 60, 48),  # east
    ]
    if not open_side:
        houses += [box(0, 48, 30, 60), box(30 + gap, 48, 60, 60)]  # north, two houses
    return np.array(houses, dtype=object)


class CourtyardPolygonsTest(unittest.TestCase):
    def test_closed_block_has_one_courtyard(self):
        yards = courtyard_polygons(perimeter_block())
        self.assertEqual(len(yards), 1)
        self.assertAlmostEqual(yards[0].area, 36 * 36, delta=5)

    def test_small_gap_between_houses_is_closed(self):
        self.assertEqual(len(courtyard_polygons(perimeter_block(gap=2.0))), 1)

    def test_driveway_keeps_the_block_open(self):
        self.assertEqual(len(courtyard_polygons(perimeter_block(gap=5.0))), 0)

    def test_u_shaped_block_has_no_courtyard(self):
        self.assertEqual(len(courtyard_polygons(perimeter_block(open_side=True))), 0)

    def test_no_buildings(self):
        self.assertEqual(len(courtyard_polygons([])), 0)


class CourtyardFlagsTest(unittest.TestCase):
    def test_cells_in_and_around_the_yard(self):
        yards = courtyard_polygons(perimeter_block())
        cells = np.array(
            [
                box(25, 25, 31, 31),  # middle of the yard
                box(9, 25, 15, 31),  # half house, half yard
                box(-3, 25, 3, 31),  # half sidewalk, half house (street facade)
                box(-20, 25, -14, 31),  # street
            ],
            dtype=object,
        )
        yard_share = courtyard_coverage(cells, yards)
        building_share = np.array([0.0, 0.5, 0.5, 0.0])
        self.assertEqual(
            courtyard_flags(yard_share, building_share).tolist(), [True, True, False, False]
        )


if __name__ == "__main__":
    unittest.main()
