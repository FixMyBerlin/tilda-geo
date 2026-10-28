# MCE scoring

How the total score per hexagon is computed from the H3 hexagon grid.
Core code: [`flaechenfinder/scorer.py`](flaechenfinder/scorer.py)
(`run_flaechenfinder()`).

## Steps

1. **Generate the H3 grid** – the study area is covered with H3 hexagons at res. 13
   (`BASE_H3_RES`) (`h3.geo_to_cells`).
2. **Sub-scores per hexagon** (0–100, from distance to layers or attributes):
   - `score_radweg` – proximity to `public.bikelanes`
   - `score_zielorte` – proximity to the `targets` configured in the scenario
   - `score_hangneigung` – DEM slope (`slope_score`)
   - `score_oepnv` – proximity to public transport stops and bike sharing. Two groups: "ÖPNV" (max.
     over 5 types: subway entrance, tram, bus, station, station building) and "Bikesharing"
     (own type, same radius as bus stops). Their ratio is adjustable via
     `oepnv_category_shares` (sum 100 %, normalized to the maximum); they are combined as the
     sum weighted by these shares, capped at 100 (see
     `oepnv_category_factors`/`scorer.py`)
   - `score_bewohnerbedarf` – bonus near inhabited buildings: census residents are assigned to
     the nearest OSM building within 5 m and count with a 20 m ramp from its edge
3. **Base score** – weighted sum of the sub-scores (`weights` in the
   `factorConfig`, see [`flaechenfinder/config.py`](flaechenfinder/config.py)).
4. **Vegetation effect** – not an additive sub-score but a continuous
   penalty/bonus on the base score (details: [`VEGETATION.md`](VEGETATION.md)).
   `mce_gesamtscore = clamp(base ± effect, 0, 100)`.
5. **Hard exclusions** – regardless of the weighted score, `mce_gesamtscore`
   is set to 0 if any of these applies:
   - slope too steep (`score_hangneigung == 0`)
   - cycleway farther away than `max_cyclepath_dist_m` (default 50 m)
   - building overlap (`gebaeude`)
6. **Classification** – `eignungsklasse` is binned from `mce_gesamtscore`
   (`_KLASSE_BINS`/`_KLASSE_LABELS`):

   | Score  | Class          |
   | ------ | -------------- |
   | 0      | ausgeschlossen |
   | 0–40   | schlecht       |
   | 40–60  | mittel         |
   | 60–80  | gut            |
   | 80–100 | sehr gut       |

## Zoom aggregation (display)

For low zoom levels (z < 16) the fine res-13 hexagons are additionally
aggregated to H3 res. 11 (`AGG_H3_RES`) via `aggregate_hexagons()` – a plain
mean of the score columns per `h3.cell_to_parent`; `eignungsklasse` is derived
again from that. No re-scoring, no spatial joins. The zoom branch
(`z >= 16 → res 13, otherwise res 11`) must match the Martin function
`planning_hexagons` in [`sql/martin_functions.sql`](sql/martin_functions.sql).
