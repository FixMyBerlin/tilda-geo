"""Spiegel der `oepnvCategoryEffect`-Fälle in
`app/src/components/regionen/pageRegionSlug/Planning/oepnvShares.test.ts` — beide Seiten müssen
denselben Kategorie-Faktor ergeben, sonst zeigt die UI etwas anderes an, als der Worker rechnet.
"""

import unittest

from flaechenfinder.config import (
    DEFAULT_OEPNV_CATEGORY_SHARES,
    OEPNV_CATEGORIES,
    oepnv_category_factors,
)


class OepnvCategoryFactorsTest(unittest.TestCase):
    def test_gleichverteilung_wirkt_ueberall_voll(self):
        factors = oepnv_category_factors(DEFAULT_OEPNV_CATEGORY_SHARES)
        self.assertEqual(factors, {c: 1.0 for c in OEPNV_CATEGORIES})

    def test_normiert_auf_den_groessten_anteil(self):
        factors = oepnv_category_factors({"ÖPNV": 80, "Bikesharing": 20})
        self.assertEqual(factors["ÖPNV"], 1.0)
        self.assertAlmostEqual(factors["Bikesharing"], 0.25)

    def test_fehlende_und_kaputte_werte(self):
        # Alte Läufe ohne das Feld verhalten sich wie Gleichverteilung.
        self.assertEqual(
            oepnv_category_factors({}), {c: 1.0 for c in OEPNV_CATEGORIES}
        )
        factors = oepnv_category_factors({"ÖPNV": "kaputt", "Bikesharing": 50})
        self.assertEqual(factors["Bikesharing"], 1.0)
        self.assertEqual(factors["ÖPNV"], 0.0)

    def test_einzelne_gruppe_auf_100(self):
        factors = oepnv_category_factors({"ÖPNV": 0, "Bikesharing": 100})
        self.assertEqual(factors, {"ÖPNV": 0.0, "Bikesharing": 1.0})


if __name__ == "__main__":
    unittest.main()
