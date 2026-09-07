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
        "userGeojson": None,
        "userGeojsonMode": None,
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


if __name__ == "__main__":
    unittest.main()
