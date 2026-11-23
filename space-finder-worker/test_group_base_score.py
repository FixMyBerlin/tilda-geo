"""Sub-scores Bedarf/Bebauung: modifiers alone fill the group, only an unweighted group stays NaN."""

import unittest

import numpy as np
import pandas as pd

from scoring.scorer import (
    BEBAUUNG_MODIFIER_KEYS,
    BEDARF_MODIFIER_KEYS,
    group_base_score,
)

INDEX = pd.RangeIndex(3)


def series(*values):
    return pd.Series(values, index=INDEX, dtype=float)


class TestGroupBaseScore(unittest.TestCase):
    def test_nothing_weighted_stays_nan(self):
        base = group_base_score(series(np.nan, np.nan, np.nan), {}, BEBAUUNG_MODIFIER_KEYS)
        self.assertTrue(base.isna().all())

    def test_only_modifier_weighted_starts_at_zero(self):
        # Only "Parken" weighted, w_slope = 0 → criteria average is NaN everywhere.
        weights = {"w_slope": 0, "w_parken": 0.3}
        base = group_base_score(series(np.nan, np.nan, np.nan), weights, BEBAUUNG_MODIFIER_KEYS)
        self.assertEqual(base.tolist(), [0.0, 0.0, 0.0])

    def test_only_tempo30_weighted_starts_at_zero(self):
        weights = {"w_slope": 0, "w_tempo30": 0.2}
        base = group_base_score(series(np.nan, np.nan, np.nan), weights, BEBAUUNG_MODIFIER_KEYS)
        self.assertEqual(base.tolist(), [0.0, 0.0, 0.0])

    def test_modifier_of_other_group_does_not_count(self):
        weights = {"w_parken": 0.3}
        base = group_base_score(series(np.nan, np.nan, np.nan), weights, BEDARF_MODIFIER_KEYS)
        self.assertTrue(base.isna().all())

    def test_criteria_values_are_kept(self):
        weights = {"w_cyclepath": 1, "w_bestand": 0.2}
        base = group_base_score(series(80.0, np.nan, 20.0), weights, BEDARF_MODIFIER_KEYS)
        self.assertEqual(base.tolist(), [80.0, 0.0, 20.0])

    def test_criterion_only_keeps_missing_values_nan(self):
        weights = {"w_slope": 1}
        base = group_base_score(series(50.0, np.nan, 10.0), weights, BEBAUUNG_MODIFIER_KEYS)
        self.assertEqual(base.iloc[0], 50.0)
        self.assertTrue(np.isnan(base.iloc[1]))

    def test_none_weight_counts_as_zero(self):
        weights = {"w_vegetation": None}
        base = group_base_score(series(np.nan, np.nan, np.nan), weights, BEBAUUNG_MODIFIER_KEYS)
        self.assertTrue(base.isna().all())


if __name__ == "__main__":
    unittest.main()
