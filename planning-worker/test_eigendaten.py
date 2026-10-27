"""Multiple "Eigene Daten" datasets: bonuses/penalties add up, exclusions are an OR."""

import json
import unittest

import numpy as np
import pandas as pd

from flaechenfinder.eigendaten import combine_eigendaten

INDEX = pd.RangeIndex(4)


def dist(*values):
    return pd.Series(values, index=INDEX, dtype=float)


class TestCombineEigendaten(unittest.TestCase):
    def test_without_datasets_nothing_applies(self):
        score, delta, exclude, details = combine_eigendaten([], {}, None, INDEX)
        self.assertTrue(score.isna().all())
        self.assertTrue((delta == 0).all())
        self.assertFalse(exclude.any())
        self.assertTrue(details.isna().all())

    def test_bonus_and_penalty_add_up(self):
        datasets = [
            {"id": "a", "mode": "bonus"},
            {"id": "b", "mode": "penalty"},
        ]
        # a: hexagons 0,1 inside; b: hexagons 1,2 inside
        distances = {"a": dist(0, 0, 50, np.nan), "b": dist(40, 0, 0, np.nan)}
        score, delta, exclude, details = combine_eigendaten(
            datasets, distances, {"a": 0.3, "b": 0.1}, INDEX
        )
        self.assertEqual(list(score.iloc[:3]), [30.0, 20.0, -10.0])
        self.assertEqual(score.iloc[3], 0.0)  # soft dataset active, hexagon outside: 0
        self.assertFalse(exclude.any())
        self.assertEqual(
            json.loads(details.iloc[1]), [{"id": "a", "p": 30.0}, {"id": "b", "p": -10.0}]
        )
        self.assertIsNone(details.iloc[3])

    def test_zero_weight_makes_dataset_ineffective(self):
        score, delta, _, details = combine_eigendaten(
            [{"id": "a", "mode": "bonus"}], {"a": dist(0, 0, 0, 0)}, {"a": 0}, INDEX
        )
        self.assertTrue(score.isna().all())
        self.assertTrue((delta == 0).all())
        self.assertTrue(details.isna().all())

    def test_exclusions_of_different_datasets_are_an_or(self):
        datasets = [
            {"id": "a", "mode": "exclude_inside"},
            {"id": "b", "mode": "exclude_outside"},
        ]
        # a excludes hexagon 0 (inside); b only allows hexagons 1 and 2 (inside)
        distances = {"a": dist(0, 20, 20, 20), "b": dist(30, 0, 0, 30)}
        score, _, exclude, details = combine_eigendaten(datasets, distances, {}, INDEX)
        self.assertEqual(list(exclude), [True, False, False, True])
        self.assertTrue(score.isna().all())  # no soft dataset
        self.assertEqual(json.loads(details.iloc[0]), [{"id": "a", "x": 1}, {"id": "b", "x": 1}])
        self.assertIsNone(details.iloc[1])

    def test_exclusion_and_bonus_together(self):
        datasets = [
            {"id": "tabu", "mode": "exclude_inside"},
            {"id": "gut", "mode": "bonus"},
        ]
        distances = {"tabu": dist(0, 10, 10, 10), "gut": dist(0, 0, 10, 10)}
        score, delta, exclude, _ = combine_eigendaten(datasets, distances, {"gut": 0.2}, INDEX)
        self.assertEqual(list(exclude), [True, False, False, False])
        self.assertEqual(list(score), [20.0, 20.0, 0.0, 0.0])
        self.assertEqual(list(delta), [20.0, 20.0, 0.0, 0.0])

    def test_dataset_without_features_is_skipped(self):
        score, _, exclude, _ = combine_eigendaten(
            [{"id": "leer", "mode": "exclude_outside"}], {}, {}, INDEX
        )
        self.assertFalse(exclude.any())
        self.assertTrue(score.isna().all())


if __name__ == "__main__":
    unittest.main()
