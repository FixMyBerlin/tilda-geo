"""Spiegel der `zielortCategoryEffect`-Fälle in
`app/src/components/regionen/pageRegionSlug/Planning/zielortShares.test.ts` — beide Seiten müssen
denselben Kategorie-Faktor ergeben, sonst zeigt die UI etwas anderes an, als der Worker rechnet.
"""

import unittest

from flaechenfinder.config import (
    DEFAULT_ZIELORT_CATEGORY_SHARES,
    ZIELORT_CATEGORIES,
    zielort_category_factors,
)


class ZielortCategoryFactorsTest(unittest.TestCase):
    def test_gleichverteilung_wirkt_ueberall_voll(self):
        factors = zielort_category_factors(DEFAULT_ZIELORT_CATEGORY_SHARES)
        self.assertEqual(factors, {c: 1.0 for c in ZIELORT_CATEGORIES})

    def test_normiert_auf_den_groessten_anteil(self):
        factors = zielort_category_factors(
            {"Grundversorgung": 25, "Bildung": 40, "Einkauf": 25, "Freizeit": 10}
        )
        self.assertEqual(factors["Bildung"], 1.0)
        self.assertAlmostEqual(factors["Freizeit"], 0.25)
        self.assertAlmostEqual(factors["Einkauf"], 0.625)

    def test_fehlende_und_kaputte_werte(self):
        # Alte Läufe ohne das Feld verhalten sich wie vor der Kategorie-Gewichtung.
        self.assertEqual(
            zielort_category_factors({}), {c: 1.0 for c in ZIELORT_CATEGORIES}
        )
        factors = zielort_category_factors({"Bildung": "kaputt", "Einkauf": 50})
        self.assertEqual(factors["Einkauf"], 1.0)
        self.assertEqual(factors["Bildung"], 0.0)

    def test_einzelne_kategorie_auf_100(self):
        factors = zielort_category_factors(
            {"Grundversorgung": 0, "Bildung": 0, "Einkauf": 100, "Freizeit": 0}
        )
        self.assertEqual(
            factors,
            {"Grundversorgung": 0.0, "Bildung": 0.0, "Einkauf": 1.0, "Freizeit": 0.0},
        )


if __name__ == "__main__":
    unittest.main()
