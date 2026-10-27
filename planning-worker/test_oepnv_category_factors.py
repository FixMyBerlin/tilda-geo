"""Mirror of the `oepnvCategoryEffect` cases in
`app/src/components/regionen/pageRegionSlug/modes/spaceFinder/factors/oepnvShares.test.ts` — both sides must
yield the same category factor, otherwise the UI shows something other than what the worker computes.
"""

import unittest

from flaechenfinder.config import (
    DEFAULT_OEPNV_CATEGORY_SHARES,
    OEPNV_CATEGORIES,
    oepnv_category_factors,
)


class OepnvCategoryFactorsTest(unittest.TestCase):
    def test_equal_split_applies_fully_everywhere(self):
        factors = oepnv_category_factors(DEFAULT_OEPNV_CATEGORY_SHARES)
        self.assertEqual(factors, {c: 1.0 for c in OEPNV_CATEGORIES})

    def test_normalizes_to_the_largest_share(self):
        factors = oepnv_category_factors({"ÖPNV": 80, "Bikesharing": 20})
        self.assertEqual(factors["ÖPNV"], 1.0)
        self.assertAlmostEqual(factors["Bikesharing"], 0.25)

    def test_missing_and_invalid_values(self):
        # Old runs without the field behave like an equal split.
        self.assertEqual(
            oepnv_category_factors({}), {c: 1.0 for c in OEPNV_CATEGORIES}
        )
        factors = oepnv_category_factors({"ÖPNV": "invalid", "Bikesharing": 50})
        self.assertEqual(factors["Bikesharing"], 1.0)
        self.assertEqual(factors["ÖPNV"], 0.0)

    def test_single_group_at_100(self):
        factors = oepnv_category_factors({"ÖPNV": 0, "Bikesharing": 100})
        self.assertEqual(factors, {"ÖPNV": 0.0, "Bikesharing": 1.0})


if __name__ == "__main__":
    unittest.main()
