"""Coarse cells show the mean of their best fine cells, not the mean of all."""

import unittest

import geopandas as gpd
import h3
import numpy as np
from shapely.geometry import Polygon

from scoring.scorer import AGG_H3_RES, AGG_TOP_CELLS, BASE_H3_RES, aggregate_hexagons

PARENT = h3.latlng_to_cell(50.43, 8.67, AGG_H3_RES)
CHILDREN = sorted(h3.cell_to_children(PARENT, BASE_H3_RES))


def fine_grid(scores, cluster_areas):
    polygons = [Polygon([(lng, lat) for lat, lng in h3.cell_to_boundary(h)]) for h in CHILDREN]
    return gpd.GeoDataFrame(
        {
            "h3_id": CHILDREN,
            "mce_gesamtscore": scores,
            "score_bedarf": scores,
            "cluster_area_m2": cluster_areas,
        },
        geometry=polygons,
        crs="EPSG:4326",
    ).to_crs("EPSG:25832")


class TestAggregateHexagons(unittest.TestCase):
    def test_enough_good_cells_among_excluded_ones_stay_visible(self):
        # 7 very good cells, 42 excluded ones (score 0, e.g. buildings): the mean of all would be 12.
        scores = [85.0] * AGG_TOP_CELLS + [0.0] * (49 - AGG_TOP_CELLS)
        areas = [5000.0] * AGG_TOP_CELLS + [np.nan] * (49 - AGG_TOP_CELLS)
        agg = aggregate_hexagons(fine_grid(scores, areas))

        self.assertEqual(len(agg), 1)
        row = agg.iloc[0]
        self.assertEqual(row["h3_id"], PARENT)
        self.assertEqual(row["resolution"], AGG_H3_RES)
        self.assertEqual(row["mce_gesamtscore"], 85.0)
        self.assertEqual(row["eignungsklasse"], "sehr gut")

    def test_single_good_cell_does_not_color_the_whole_cell(self):
        # One very good cell among mediocre ones: the maximum would say 90 ("sehr gut").
        scores = [90.0] + [30.0] * 48
        row = aggregate_hexagons(fine_grid(scores, [np.nan] * 49)).iloc[0]
        self.assertEqual(row["mce_gesamtscore"], round((90 + 30 * (AGG_TOP_CELLS - 1)) / AGG_TOP_CELLS, 1))
        self.assertEqual(row["eignungsklasse"], "schlecht")

    def test_cluster_area_is_the_largest_of_the_fine_cells(self):
        scores = [70.0, 65.0] + [0.0] * 47
        areas = [1200.0, 300.0] + [np.nan] * 47
        row = aggregate_hexagons(fine_grid(scores, areas)).iloc[0]
        self.assertEqual(row["cluster_area_m2"], 1200.0)

    def test_fully_excluded_cell_stays_excluded(self):
        row = aggregate_hexagons(fine_grid([0.0] * 49, [np.nan] * 49)).iloc[0]
        self.assertEqual(row["mce_gesamtscore"], 0.0)
        self.assertEqual(row["eignungsklasse"], "ausgeschlossen")
        self.assertTrue(np.isnan(row["cluster_area_m2"]))


if __name__ == "__main__":
    unittest.main()
