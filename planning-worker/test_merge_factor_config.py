"""Mirrors the cases in `app/src/server/planning/mergeFactorConfig.test.ts`."""

import unittest

from merge_factor_config import FALLBACK_SAETTIGUNG_EW, merge_factor_config


def area(**overrides):
    row = {
        "studyArea": {"type": "Polygon", "coordinates": []},
        "useCase": "fahrradbox",
        "areaSizeM2": None,
        "censusSaettigungEw": None,
        "censusEwPerHa": None,
        "userDatasets": [],
    }
    row.update(overrides)
    return row


class TestMergeFactorConfig(unittest.TestCase):
    def test_uses_census_suggestion_while_variant_has_no_own_value(self):
        merged = merge_factor_config({}, area(censusSaettigungEw=20, censusEwPerHa=195.3))
        self.assertEqual(merged["bewohnerbedarf_saettigung_ew"], 20)
        self.assertTrue(merged["bewohnerbedarf_saettigung_auto"])
        self.assertEqual(merged["bewohnerbedarf_ew_pro_ha"], 195.3)

    def test_keeps_hand_set_value_and_reports_suggestion(self):
        merged = merge_factor_config(
            {"bewohnerbedarf_saettigung_ew": 45},
            area(censusSaettigungEw=20),
        )
        self.assertEqual(merged["bewohnerbedarf_saettigung_ew"], 45)
        self.assertFalse(merged["bewohnerbedarf_saettigung_auto"])
        self.assertEqual(merged["bewohnerbedarf_saettigung_auto_ew"], 20)

    def test_falls_back_to_worker_default_without_census_data(self):
        merged = merge_factor_config({}, area())
        self.assertEqual(merged["bewohnerbedarf_saettigung_ew"], FALLBACK_SAETTIGUNG_EW)
        self.assertFalse(merged["bewohnerbedarf_saettigung_auto"])
        self.assertIsNone(merged["bewohnerbedarf_saettigung_auto_ew"])

    def test_merges_all_datasets_of_the_area(self):
        datasets = [
            {"id": "a", "name": "A", "mode": "bonus", "geojson": {"type": "FeatureCollection", "features": []}},
            {"id": "b", "name": "B", "mode": "exclude_inside", "geojson": {"type": "FeatureCollection", "features": []}},
        ]
        merged = merge_factor_config({"eigendaten_weights": {"a": 0.2}}, area(userDatasets=datasets))
        self.assertEqual(merged["user_datasets"], datasets)
        self.assertEqual(merged["eigendaten_weights"], {"a": 0.2})

    def test_no_datasets_in_area_drops_stale_snapshot_datasets(self):
        merged = merge_factor_config({"user_datasets": [{"id": "x"}]}, area())
        self.assertNotIn("user_datasets", merged)


if __name__ == "__main__":
    unittest.main()
