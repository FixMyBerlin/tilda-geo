"""Courtyards (Hinterhöfe) for the "Hinterhöfe ausschließen" exclusion.

A courtyard is open ground fully enclosed by buildings: the classic perimeter block.
The buildings are merged and gaps up to `COURTYARD_GAP_M` between them are closed
(buffer out, union, buffer back in). Every hole left in the merged blocks is a courtyard.

Open courtyards (U-shaped blocks, row housing) have no hole and stay untouched – this
is deliberately the narrow, low-false-positive variant.
"""

import numpy as np
import shapely
from shapely.geometry import Polygon

# Gaps between buildings up to this width are closed, so neighboring houses that do
# not touch exactly in OSM still form one ring. Wider gaps (driveways, streets) keep
# the block open.
COURTYARD_GAP_M = 3.0

# Holes below this area are slivers between adjacent buildings, not courtyards.
COURTYARD_MIN_AREA_M2 = 10.0

# A hexagon counts as courtyard when it touches a courtyard and courtyard plus building
# cover at least this share of it – the same 2/3 as the building exclusion. So cells along
# the courtyard edge (part yard, part building) are excluded too, cells along the street
# facade (part building, part sidewalk) are not.
COURTYARD_EXCLUSION_COVERAGE = 2 / 3


def courtyard_polygons(building_geoms, gap_m: float = COURTYARD_GAP_M) -> np.ndarray:
    """Returns the courtyard polygons enclosed by the given buildings (metric CRS)."""
    geoms = np.asarray(building_geoms, dtype=object)
    if not len(geoms):
        return np.array([], dtype=object)
    half = gap_m / 2
    merged = shapely.union_all(shapely.buffer(geoms, half, join_style="mitre"))
    closed = shapely.buffer(merged, -half, join_style="mitre")
    holes = [
        Polygon(ring)
        for part in shapely.get_parts(closed)
        if isinstance(part, Polygon)
        for ring in part.interiors
    ]
    return np.array(
        [h for h in holes if h.area >= COURTYARD_MIN_AREA_M2], dtype=object
    )


def courtyard_coverage(hex_geoms, courtyards) -> np.ndarray:
    """Share of each hexagon covered by a courtyard (0–1)."""
    hex_geoms = np.asarray(hex_geoms, dtype=object)
    cover = np.zeros(len(hex_geoms))
    if not len(courtyards) or not len(hex_geoms):
        return cover
    tree = shapely.STRtree(courtyards)
    hex_idx, yard_idx = tree.query(hex_geoms, predicate="intersects")
    if not len(hex_idx):
        return cover
    areas = shapely.area(shapely.intersection(hex_geoms[hex_idx], courtyards[yard_idx]))
    np.add.at(cover, hex_idx, areas)
    return np.minimum(cover / shapely.area(hex_geoms), 1.0)


def courtyard_flags(courtyard_share: np.ndarray, building_share: np.ndarray) -> np.ndarray:
    """True for hexagons inside a courtyard (see COURTYARD_EXCLUSION_COVERAGE)."""
    return (courtyard_share > 0) & (
        np.minimum(courtyard_share + building_share, 1.0) >= COURTYARD_EXCLUSION_COVERAGE
    )
