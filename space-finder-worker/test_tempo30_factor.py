"""Tempo 30 bonus (scoring/scorer.py, scoring/carriageways.py) and its config."""

import math
import unittest

from scoring.carriageways import tempo30_fallback_width
from scoring.config import use_case_from_dict
from scoring.geometry import FAR
from scoring.scorer import tempo30_active, tempo30_factor


class Tempo30FactorTest(unittest.TestCase):
    def test_full_bonus_on_the_carriageway(self):
        self.assertEqual(tempo30_factor(0.0, 2.0), 1.0)

    def test_full_bonus_within_tolerance_of_the_edge(self):
        self.assertEqual(tempo30_factor(2.0, 2.0), 1.0)

    def test_no_bonus_on_the_pavement_beyond_tolerance(self):
        self.assertEqual(tempo30_factor(2.5, 2.0), 0.0)
        self.assertEqual(tempo30_factor(15.0, 2.0), 0.0)

    def test_no_bonus_without_calm_road(self):
        self.assertEqual(tempo30_factor(FAR, 2.0), 0.0)
        self.assertEqual(tempo30_factor(math.nan, 2.0), 0.0)


class Tempo30ActiveTest(unittest.TestCase):
    def test_off_without_weight(self):
        self.assertFalse(tempo30_active(use_case_from_dict({})))

    def test_on_with_weight(self):
        self.assertTrue(tempo30_active(use_case_from_dict({"weights": {"w_tempo30": 0.2}})))

    def test_off_when_carriageways_are_excluded(self):
        use_case = use_case_from_dict(
            {"weights": {"w_tempo30": 0.2}, "exclude_carriageways": True}
        )
        self.assertFalse(tempo30_active(use_case))


class Tempo30ConfigTest(unittest.TestCase):
    def test_defaults_keep_existing_runs_unchanged(self):
        use_case = use_case_from_dict({})
        self.assertEqual(use_case.weights["w_tempo30"], 0.0)
        self.assertEqual(use_case.tempo30_tolerance_m, 2.0)

    def test_reads_tolerance(self):
        self.assertEqual(use_case_from_dict({"tempo30_tolerance_m": 4}).tempo30_tolerance_m, 4.0)


class Tempo30FallbackWidthTest(unittest.TestCase):
    def test_matches_road_class_by_prefix(self):
        self.assertEqual(tempo30_fallback_width("residential"), 8.0)
        self.assertEqual(tempo30_fallback_width("residential_priority_road"), 8.0)
        self.assertEqual(tempo30_fallback_width("service_road"), 4.0)
        self.assertEqual(tempo30_fallback_width("living_street"), 5.0)
        self.assertEqual(tempo30_fallback_width("secondary"), 14.0)

    def test_links_and_unknown(self):
        self.assertEqual(tempo30_fallback_width("secondary_link"), 6.0)
        self.assertEqual(tempo30_fallback_width("something_else"), 8.0)
        self.assertEqual(tempo30_fallback_width(None), 8.0)


if __name__ == "__main__":
    unittest.main()
