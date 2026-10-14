"""Spiegel der Fälle in `app/src/server/planning/mergeFactorConfig.test.ts`."""

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
    def test_nimmt_den_zensus_vorschlag_solange_die_variante_keinen_eigenen_wert_hat(self):
        merged = merge_factor_config({}, area(censusSaettigungEw=20, censusEwPerHa=195.3))
        self.assertEqual(merged["bewohnerbedarf_saettigung_ew"], 20)
        self.assertTrue(merged["bewohnerbedarf_saettigung_auto"])
        self.assertEqual(merged["bewohnerbedarf_ew_pro_ha"], 195.3)

    def test_laesst_einen_von_hand_gesetzten_wert_stehen_und_nennt_den_vorschlag(self):
        merged = merge_factor_config(
            {"bewohnerbedarf_saettigung_ew": 45},
            area(censusSaettigungEw=20),
        )
        self.assertEqual(merged["bewohnerbedarf_saettigung_ew"], 45)
        self.assertFalse(merged["bewohnerbedarf_saettigung_auto"])
        self.assertEqual(merged["bewohnerbedarf_saettigung_auto_ew"], 20)

    def test_faellt_ohne_zensusdaten_auf_den_worker_default_zurueck(self):
        merged = merge_factor_config({}, area())
        self.assertEqual(merged["bewohnerbedarf_saettigung_ew"], FALLBACK_SAETTIGUNG_EW)
        self.assertFalse(merged["bewohnerbedarf_saettigung_auto"])
        self.assertIsNone(merged["bewohnerbedarf_saettigung_auto_ew"])

    def test_nimmt_alle_datensaetze_des_gebiets_in_den_merge(self):
        datasets = [
            {"id": "a", "name": "A", "mode": "bonus", "geojson": {"type": "FeatureCollection", "features": []}},
            {"id": "b", "name": "B", "mode": "exclude_inside", "geojson": {"type": "FeatureCollection", "features": []}},
        ]
        merged = merge_factor_config({"eigendaten_weights": {"a": 0.2}}, area(userDatasets=datasets))
        self.assertEqual(merged["user_datasets"], datasets)
        self.assertEqual(merged["eigendaten_weights"], {"a": 0.2})

    def test_ohne_datensaetze_im_gebiet_bleibt_kein_alter_stand_aus_dem_snapshot(self):
        merged = merge_factor_config({"user_datasets": [{"id": "x"}]}, area())
        self.assertNotIn("user_datasets", merged)


if __name__ == "__main__":
    unittest.main()
