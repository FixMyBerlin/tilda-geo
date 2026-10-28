from dataclasses import dataclass, field
from typing import Dict, Optional


# ── Target location categories ────────────────────────────────────────────────
# The four categories assigned by processing/topics/poiClassification. Order and spelling
# must match the values in public."poiClassification".tags->>'category' exactly
# (see postgis_loader.load_target_locations) and the UI list in
# app/.../modes/spaceFinder/factors/zielortCategories.ts.
ZIELORT_CATEGORIES = ("Grundversorgung", "Bildung", "Einkauf", "Freizeit")

# Equal split: makes the target location bonus behave as it did before category
# weighting (every category triggers the full bonus).
DEFAULT_ZIELORT_CATEGORY_SHARES = {c: 25.0 for c in ZIELORT_CATEGORIES}


def zielort_category_factors(shares: Dict[str, float]) -> Dict[str, float]:
    """Shares (percent, sum 100) → factor 0–1 per category, normalized to the largest share.

    The factor is the fraction of the full target location bonus that a building of THIS
    category triggers on its own. Normalizing to the maximum (instead of the sum) keeps the
    equal-split default at 1.0 per category — otherwise the switch would cut every existing
    run to a quarter. Unknown categories are ignored, missing ones count as 0; without
    usable shares, an equal split applies.
    """
    values = {}
    for category in ZIELORT_CATEGORIES:
        raw = shares.get(category) if shares else None
        try:
            value = float(raw)
        except (TypeError, ValueError):
            value = 0.0
        values[category] = max(0.0, value)
    largest = max(values.values()) if values else 0.0
    if largest <= 0:
        return {c: 1.0 for c in ZIELORT_CATEGORIES}
    return {c: v / largest for c, v in values.items()}


# ── Public transport / bike sharing groups ──────────────────────────────────────
# The two groups score_oepnv splits into: "ÖPNV" still combines the five classic stop types
# (subway entrance, tram, bus, station, station building) via max(), "Bikesharing" stays a
# type of its own. Order/spelling must match the UI list in
# app/.../modes/spaceFinder/factors/oepnvCategories.ts.
OEPNV_CATEGORIES = ("ÖPNV", "Bikesharing")

# Equal split (50/50) — UNLIKE target locations, this is NOT the pre-weighting behavior:
# score_oepnv used to combine the six types via a plain max(); the new weighting instead sums
# the two group shares, capped at 1.0 (see `oepnv_category_factors` and scorer.py). This changes
# existing runs even with an equal split (user decision, accepted on purpose).
DEFAULT_OEPNV_CATEGORY_SHARES = {c: 50.0 for c in OEPNV_CATEGORIES}

# `kind` values of `bicycleParking_points` (processing/topics/bicycleParking/helper/amenity_kinds.lua).
# Bike sharing is read by `load_bikesharing`; both kinds are left out of the existing bicycle
# parking (`load_bicycle_parking`), a mobility hub only contains stands that are rows of their own.
BIKESHARING_KIND = "bicycle_rental"
NON_PARKING_KINDS = (BIKESHARING_KIND, "mobility_hub")


def oepnv_category_factors(shares: Dict[str, float]) -> Dict[str, float]:
    """Shares (percent, sum 100) → factor 0–1 per group, normalized to the largest share.

    Exact counterpart of `zielort_category_factors`, for the two public transport / bike sharing
    groups instead of the four target location categories. See there for the normalization.
    """
    values = {}
    for category in OEPNV_CATEGORIES:
        raw = shares.get(category) if shares else None
        try:
            value = float(raw)
        except (TypeError, ValueError):
            value = 0.0
        values[category] = max(0.0, value)
    largest = max(values.values()) if values else 0.0
    if largest <= 0:
        return {c: 1.0 for c in OEPNV_CATEGORIES}
    return {c: v / largest for c, v in values.items()}


@dataclass
class UseCaseConfig:
    name: str
    weights: Dict[str, float]
    dem_source: str = "srtm"                 # "dgm1" | "mapterhorn" | "srtm"
    dgm1_path: Optional[str] = None

    # Vegetation factor (NDVI). The direction sets the sign of the effect:
    #   "negative" → more green = point penalty (protect green space) [default]
    #   "positive" → more green = point bonus (building on green is desired)
    # The effect is no longer an additive sub-score but a continuous penalty/bonus
    # on the base score (see scorer.py); the total score is then clamped to [0, 100].
    vegetation_direction: str = "negative"

    # Tolerance threshold in % coverage: below it no vegetation effect (ignore small
    # green remnants/edge pixels), above it a linear rise up to 100 %.
    vegetation_penalty_threshold_pct: float = 20.0

    # Intersection bonus: bike parking fits well at street corners – ideally ~5–8 m
    # from the curb corner (not in the middle of the intersection). The bonus is a
    # continuous modifier on the base score (like vegetation, see scorer.py);
    # strength = weights["w_intersection"].
    #   d < ideal_min                → linear rise 0 → 1
    #   ideal_min ≤ d ≤ ideal_max    → full bonus (1.0)
    #   ideal_max < d ≤ radius       → linear decay 1 → 0
    #   d > radius                   → 0
    intersection_radius_m: float = 20.0       # outer reach (adjustable in the UI)
    intersection_ideal_min_m: float = 5.0
    intersection_ideal_max_m: float = 8.0

    # Parking bonus: existing car parking (public.parkings/parkings_separate) is easy
    # to convert into bike parking. The bonus is a continuous modifier on the base
    # score (like the intersection bonus, see scorer.py); strength =
    # weights["w_parken"]. Unlike the intersection, the ideal is to sit DIRECTLY on
    # the parking area:
    #   d = 0 (on the area)      → full bonus (1.0)
    #   0 < d ≤ radius           → linear decay 1 → 0
    #   d > radius               → 0
    parken_radius_m: float = 15.0             # reach of the bonus (adjustable in the UI)

    # Square bonus/penalty: squares (place=square, public._places_squares) are
    # attractive public space – depending on the goal an argument FOR building
    # nearby (activity, visibility) or AGAINST it (keep the square open).
    # Direction like vegetation:
    #   "positive" → on the square = point bonus [default]
    #   "negative" → on the square = point penalty (keep the square clear)
    # No distance decay: full effect only directly on the square (distance 0),
    # otherwise 0. Modifier on the base score (see scorer.py); strength = weights["w_platz"].
    platz_direction: str = "positive"

    # Pedestrian zone bonus: at intersections where one of the usual road categories
    # meets a pedestrian zone (highway=pedestrian), demand is especially high.
    # Uses the same curb corner mechanism as the intersection bonus (same
    # ideal_min/ideal_max ramp), but its own weight weights["w_fussgaengerzone"]
    # and its own outer reach. Modifier on the base score, part of the demand group
    # (see scorer.py).
    fussgaengerzone_radius_m: float = 20.0    # outer reach (adjustable in the UI)

    # Existing bike parking: existing bicycle parking (public."bicycleParking_points")
    # lowers demand around it. The factor is a negative modifier on the DEMAND group
    # (like the pedestrian zone bonus, just with the opposite sign, see scorer.py);
    # strength = weights["w_bestand"] (max. penalty in points × 100). The reach per
    # facility depends on its capacity: diameter = capacity/2 m (→ radius
    # capacity/4). Without a capacity tag, this default diameter applies.
    # Full penalty inside the catchment circle, 0 outside.
    bestand_default_diameter_m: float = 20.0  # diameter without capacity (adjustable in the UI)

    # Resident demand (census): the 2022 census population disaggregated to buildings
    # (data.census_population_point) creates demand around inhabited buildings –
    # independent of age, only `total` counts. Positive modifier on the DEMAND group
    # (like pedestrian zones); strength = weights["w_bewohnerbedarf"] (max. bonus in
    # points × 100). It is computed as a weighted neighborhood sum
    # (geometry.weighted_proximity_sum): each inhabited building contributes
    # `residents × (1 − distance/radius)`, measured from the BUILDING EDGE.
    # The sum is capped at 1.0 at the saturation value.
    #   d = 0 (right at the building) → full contribution of the building
    #   d ≥ radius                    → no contribution
    # On hexagons that intersect a building themselves the bonus is 0: demand arises
    # around the building, not on it (see scorer.py).
    # The radius is deliberately NOT adjustable in the UI (user decision): 20 m is the
    # domain setting for "right next to the building", and a second slider next to
    # saturation cost more explanation than it was worth. Change it here if it should vary —
    # but adjust saturation too, it depends directly on the reach (see below).
    bewohnerbedarf_radius_m: float = 20.0        # reach from the building edge (fixed)

    # The saturation default is calibrated on real Berlin data (weighted sum per buildable
    # hexagon, radius 20 m): dense perimeter blocks (Kreuzberg, 16,000 residents/km²)
    # p50 ≈ 25 / p75 ≈ 52 / p90 ≈ 98, mixed inner city p50 ≈ 9 / p90 ≈ 37,
    # single-family housing p50 ≈ 3 / p90 ≈ 13. At 30 (user setting) the median of dense
    # perimeter blocks is already at ~83 % of the full bonus and their upper half at the
    # cap; mixed and single-family areas differentiate across the full range.
    # CAUTION: the values scale strongly with the radius (at 50 m the same areas were
    # about 3× higher) — if the radius above changes, re-measure this default.
    bewohnerbedarf_saettigung_ew: float = 30.0   # weighted residents for the full bonus

    # Target location bonus: buildings with everyday destinations create demand around
    # them – like resident demand, just with target location instead of census sources (see
    # scorer.py `_target_demand_sources`/`weighted_proximity_sum`). Source is
    # public."poiClassification" (processing/topics/poiClassification), combined across all
    # four categories assigned there (Grundversorgung, Bildung, Einkauf, Freizeit) – no single
    # destination type is preferred. Positive modifier on the DEMAND group; strength =
    # weights["w_target"] (max. bonus in points × 100). A building counts only ONCE, regardless
    # of how many destinations it contains (pure presence weighting, user decision – a house
    # with a supermarket AND a bakery is not twice as strong as one with a single shop).
    # Saturation is HARD-WIRED to 1.0 (user decision, no config field, no UI slider):
    # a SINGLE destination building right at the hexagon edge triggers the full bonus – unlike
    # resident demand there is no accumulation saturation here (see scorer.py).
    # Radius deliberately NOT adjustable in the UI (like bewohnerbedarf_radius_m, same reason).
    zielort_radius_m: float = 20.0        # reach from the building edge (fixed, like resident demand)

    # Ratio of the four categories, in percent (sum 100; UI sliders, see
    # app/.../modes/spaceFinder/factors/ZielortCategorySliders.tsx). The computation uses the
    # share normalized to the MAXIMUM: the strongest category stands for the full bonus, one
    # weighted half as much for half of it (see `zielort_category_factors` and scorer.py).
    # So the equal split (default) means: every category triggers the full bonus as before —
    # the default is deliberately non-breaking.
    zielort_category_shares: Dict[str, float] = field(
        default_factory=lambda: dict(DEFAULT_ZIELORT_CATEGORY_SHARES)
    )

    # Ratio of public transport to bike sharing, in percent (sum 100; UI sliders, see
    # app/.../modes/spaceFinder/factors/OepnvCategorySliders.tsx). Unlike target locations,
    # the equal split is NOT non-breaking HERE (see the comment on
    # `DEFAULT_OEPNV_CATEGORY_SHARES` in this module) — score_oepnv used to combine the types
    # via max(), now via the capped sum of the two group shares.
    oepnv_category_shares: Dict[str, float] = field(
        default_factory=lambda: dict(DEFAULT_OEPNV_CATEGORY_SHARES)
    )

    # Hard exclusion limits
    max_cyclepath_dist_m: float = 50.0      # farther away → score 0

    # Exclude carriageways: hard-exclude road surfaces (public._parking_roads, buffered
    # by their recorded/estimated width) from placement.
    # Plain on/off switch (no weight) — off by default (non-breaking).
    exclude_carriageways: bool = False

    # Minimum score for a hexagon to belong to a contiguous candidate area
    # (area search). Cluster = neighboring hexagons with
    # mce_gesamtscore >= this threshold; their total area is stored in
    # scenario_hexagons.cluster_area_m2 (the client filters by target size).
    min_score_threshold: float = 60.0

    # CIR/RGBI tile source for the vegetation computation.
    # "auto" detects via the study area centroid: Hesse bounding box →
    #   Hesse (EPSG:25832), otherwise the 12°E boundary → Bavaria (EPSG:25832) or
    #   Brandenburg/Berlin (EPSG:25833) – all three via WMS.
    # Explicit values: "bayern" | "bb" | "hessen"
    cir_source: str = "auto"


# ── Census point → building assignment (fixed) ────────────────────────────────
# Resident demand assigns each census point to the nearest OSM building within this distance
# (scorer.py `_census_demand_sources`): the census places residents on ALKIS buildings, whose
# outlines often lie a few metres off the OSM ones. Must match the same constant in
# app/src/server/planning/censusSaettigung.server.ts.
CENSUS_BUILDING_TOLERANCE_M = 5.0


# ── Buffers for user data geometries (fixed) ──────────────────────────────────
# Points/lines have no area; they are buffered before intersecting.
USER_POINT_BUFFER_M = 1.5
USER_LINE_BUFFER_M = 2.5

# User data ("Eigene Daten", uploads): each dataset `{id, name, mode, geojson}` of the planning
# area (factorConfig.user_datasets) enters the score with its mode; the strength per dataset is
# in factorConfig.eigendaten_weights[id]. The worker reads datasets and strengths separately
# from the config dict, like study_area.
#   "bonus"           → soft bonus inside the buffer
#   "penalty"         → soft penalty inside the buffer
#   "exclude_inside"  → hard exclusion: hexagon inside the geometry → mce = 0
#   "exclude_outside" → hard exclusion: hexagon outside → mce = 0 (mask)
USER_DATASET_MODES = ("bonus", "penalty", "exclude_inside", "exclude_outside")


# ── Defaults / validation ─────────────────────────────────────────────────────

# Two kinds of weights (see scorer.py):
#   Criteria (w_cyclepath/w_slope/w_transit) enter the weighted average of the
#     0–100 sub-scores. Only their ratio matters – the sum doesn't need to be
#     anything in particular.
#   Modifiers (all others, incl. w_target) shift the final score by up to w × 100
#     points; here the absolute value is what counts.
DEFAULT_WEIGHTS = {
    "w_cyclepath": 0.20,
    "w_target":    0.15,   # target location bonus (max. bonus in points × 100)
    "w_slope":     0.20,
    "w_transit":   0.15,
    "w_vegetation": 0.0,   # neutral by default → existing scenarios keep their behavior
    "w_intersection": 0.1, # intersection bonus (max. bonus in points × 100)
    "w_parken": 0.1,       # parking bonus (car → bike conversion)
    "w_platz": 0.0,        # square bonus/penalty; neutral by default → non-breaking
    "w_fussgaengerzone": 0.0,  # pedestrian zone bonus (neutral by default → non-breaking)
    "w_bestand": 0.0,          # demand reduction by existing parking (neutral by default → non-breaking)
    "w_bewohnerbedarf": 0.0,   # resident demand from census data; neutral by default → non-breaking
}


def use_case_from_dict(cfg: dict) -> UseCaseConfig:
    """Build a UseCaseConfig from the `factorConfig` JSON of a PlanningScenario.

    Expected schema (all fields except `study_area` optional, with defaults):
      {
        "name": str,
        "weights": {w_cyclepath, w_target, w_slope, w_transit},
        "dem_source": "srtm" | "dgm1" | "mapterhorn",
        "max_cyclepath_dist_m",
      }
    The worker reads `study_area` and `h3_resolution` separately from the factorConfig.
    """
    weights = {**DEFAULT_WEIGHTS, **(cfg.get("weights") or {})}
    return UseCaseConfig(
        name=cfg.get("name", "Szenario"),
        weights=weights,
        dem_source=cfg.get("dem_source", "srtm"),
        dgm1_path=cfg.get("dgm1_path"),
        vegetation_direction=cfg.get("vegetation_direction", "negative"),
        vegetation_penalty_threshold_pct=float(
            cfg.get("vegetation_penalty_threshold_pct", 20.0)
        ),
        max_cyclepath_dist_m=float(cfg.get("max_cyclepath_dist_m", 50.0)),
        cir_source=cfg.get("cir_source", "auto"),
        intersection_radius_m=float(cfg.get("intersection_radius_m", 20.0)),
        intersection_ideal_min_m=float(cfg.get("intersection_ideal_min_m", 5.0)),
        intersection_ideal_max_m=float(cfg.get("intersection_ideal_max_m", 8.0)),
        parken_radius_m=float(cfg.get("parken_radius_m", 15.0)),
        platz_direction=cfg.get("platz_direction", "positive"),
        fussgaengerzone_radius_m=float(cfg.get("fussgaengerzone_radius_m", 20.0)),
        bestand_default_diameter_m=float(cfg.get("bestand_default_diameter_m", 20.0)),
        bewohnerbedarf_radius_m=float(cfg.get("bewohnerbedarf_radius_m", 20.0)),
        bewohnerbedarf_saettigung_ew=float(cfg.get("bewohnerbedarf_saettigung_ew", 30.0)),
        zielort_radius_m=float(cfg.get("zielort_radius_m", 20.0)),
        zielort_category_shares=dict(
            cfg.get("zielort_category_shares") or DEFAULT_ZIELORT_CATEGORY_SHARES
        ),
        oepnv_category_shares=dict(
            cfg.get("oepnv_category_shares") or DEFAULT_OEPNV_CATEGORY_SHARES
        ),
        min_score_threshold=float(cfg.get("min_score_threshold", 60.0)),
        exclude_carriageways=bool(cfg.get("exclude_carriageways", False)),
    )
