"""The `kind` values the loaders filter `bicycleParking_points` by must exist in processing
(`processing/topics/bicycleParking/helper/amenity_kinds.lua`). A renamed kind would otherwise
silently count bike sharing as parking and load no bike sharing at all.
"""

import re
import unittest
from pathlib import Path

from flaechenfinder.config import BIKESHARING_KIND, NON_PARKING_KINDS

AMENITY_KINDS_LUA = (
    Path(__file__).resolve().parent.parent
    / "processing/topics/bicycleParking/helper/amenity_kinds.lua"
)


def processing_kinds() -> set[str]:
    # `---@alias BicycleParkingKind 'bicycle_parking'|'cargo_bike_parking'|…`
    alias = re.search(r"---@alias BicycleParkingKind (.+)", AMENITY_KINDS_LUA.read_text())
    assert alias, f"No BicycleParkingKind alias in {AMENITY_KINDS_LUA}"
    return set(re.findall(r"'([^']+)'", alias.group(1)))


@unittest.skipUnless(
    AMENITY_KINDS_LUA.exists(), "needs the repo checkout (the worker image has no processing/)"
)
class BicycleParkingKindsTest(unittest.TestCase):
    def test_loader_kinds_exist_in_processing(self):
        kinds = processing_kinds()
        self.assertIn(BIKESHARING_KIND, kinds)
        for kind in NON_PARKING_KINDS:
            self.assertIn(kind, kinds)

    def test_bike_sharing_is_not_parking(self):
        self.assertIn(BIKESHARING_KIND, NON_PARKING_KINDS)


if __name__ == "__main__":
    unittest.main()
