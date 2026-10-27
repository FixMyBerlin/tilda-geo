"""Mirror of the `zielortCategoryEffect` cases in
`app/src/components/regionen/pageRegionSlug/modes/spaceFinder/factors/zielortShares.test.ts` — both sides must
yield the same category factor, otherwise the UI shows something different from what the worker computes.
"""

import unittest

from flaechenfinder.config import (
    DEFAULT_ZIELORT_CATEGORY_SHARES,
    ZIELORT_CATEGORIES,
    zielort_category_factors,
)


class ZielortCategoryFactorsTest(unittest.TestCase):
    def test_equal_split_applies_fully_everywhere(self):
        factors = zielort_category_factors(DEFAULT_ZIELORT_CATEGORY_SHARES)
        self.assertEqual(factors, {c: 1.0 for c in ZIELORT_CATEGORIES})

    def test_normalizes_to_the_largest_share(self):
        factors = zielort_category_factors(
            {"Grundversorgung": 25, "Bildung": 40, "Einkauf": 25, "Freizeit": 10}
        )
        self.assertEqual(factors["Bildung"], 1.0)
        self.assertAlmostEqual(factors["Freizeit"], 0.25)
        self.assertAlmostEqual(factors["Einkauf"], 0.625)

    def test_missing_and_invalid_values(self):
        # Old runs without the field behave as before category weighting.
        self.assertEqual(
            zielort_category_factors({}), {c: 1.0 for c in ZIELORT_CATEGORIES}
        )
        factors = zielort_category_factors({"Bildung": "invalid", "Einkauf": 50})
        self.assertEqual(factors["Einkauf"], 1.0)
        self.assertEqual(factors["Bildung"], 0.0)

    def test_single_category_at_100(self):
        factors = zielort_category_factors(
            {"Grundversorgung": 0, "Bildung": 0, "Einkauf": 100, "Freizeit": 0}
        )
        self.assertEqual(
            factors,
            {"Grundversorgung": 0.0, "Bildung": 0.0, "Einkauf": 1.0, "Freizeit": 0.0},
        )


if __name__ == "__main__":
    unittest.main()
