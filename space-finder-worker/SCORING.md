# MCE scoring

How the total score per hexagon is computed from the H3 hexagon grid.
Core code: [`scoring/scorer.py`](scoring/scorer.py)
(`run_flaechenfinder()`).

## Steps

1. **Generate the H3 grid** – the study area is covered with H3 hexagons at res. 13
   (`BASE_H3_RES`) (`h3.geo_to_cells`).
2. **Sub-scores per hexagon** (0–100, from distance to layers or attributes):
   - `score_radweg` – proximity to `public.bikelanes`
   - `score_zielorte` – proximity to the `targets` configured in the scenario
   - `score_hangneigung` – DEM slope (`slope_score`); NULL where no elevation data is
     available (tile not loadable, DGM1 nodata)
   - `score_oepnv` – proximity to public transport stops and bike sharing. Two groups: "ÖPNV" (max.
     over 5 types: subway entrance, tram, bus, station, station building) and "Bikesharing"
     (own type, same radius as bus stops). Their ratio is adjustable via
     `oepnv_category_shares` (sum 100 %, normalized to the maximum); they are combined as the
     sum weighted by these shares, capped at 100 (see
     `oepnv_category_factors`/`scorer.py`)
   - `score_bewohnerbedarf` – bonus near inhabited buildings: census residents are assigned to
     the nearest OSM building within 5 m and count with a 20 m ramp from its edge
3. **Base score** – weighted average of the sub-scores (`weights` in the
   `factorConfig`, see [`scoring/config.py`](scoring/config.py)). Per hexagon only
   sub-scores with a value count: a weighted criterion without data there (e.g. slope
   without elevation data) drops out of the sum and of the weight sum.
4. **Vegetation effect** – not an additive sub-score but a continuous
   penalty/bonus on the base score (details: [`VEGETATION.md`](VEGETATION.md)).
   `mce_gesamtscore = clamp(base ± effect, 0, 100)`.
   **Sealed ground bonus** (`w_versiegelung`, default 0) – a buildability modifier:
   `score_versiegelung = w_versiegelung × 100 × min(1, share / versiegelung_saettigung_pct)`,
   where `versiegelung_anteil_pct` is the sealed share of the hexagon area. The full bonus
   comes at 50 % sealed by default (a bike parking needs only part of a hexagon). Code: [`scoring/sealing.py`](scoring/sealing.py),
   input `public._sealing_surfaces` (processing topic `sealing`).
   - Counts: sealed `surface` (fully), `grass_paver` (half), and area types that are
     almost always paved (square, pedestrian area, ground-level parking incl. street-side,
     footway/cycleway lines, sidewalks tagged on roads (`sidewalk=both|left|right`, shifted
     next to the carriageway)
     without `surface`; lines buffered by `width` or a default per type).
   - Deducted: unsealed `surface`, open ground and green area tags (incl. cemeteries
     and allotments), and tree pits
     (1.5 m around a mapped tree). The aerial image is not used: over paving its
     green is almost always a tree crown, and the image quality differs by state.
   - An object's own `surface` wins; otherwise the smaller area wins.
     A footway without `surface` only counts as unpaved when it lies mostly (> 50 %) inside a
     green or unsealed area; a sidewalk tagged on a road is dropped when the same sidewalk is
     also mapped as its own way.
   - Not at ground level (bridge, tunnel, indoor, `location=underground|rooftop`, negative
     `layer`/`level`) does not count.
   - Carriageways count as sealed when "Fahrbahn ausschließen" is off and are
     deducted when it is on.
   - Stacks with Platz, Vegetation and Tempo 30. Only knows what is mapped in OSM.
   - If the table cannot be read: NULL plus a run data note, not 0 (see below).
5. **Hard exclusions** – regardless of the weighted score, `mce_gesamtscore`
   is set to 0 if any of these applies:
   - slope too steep (`score_hangneigung == 0`)
   - cycleway farther away than `max_cyclepath_dist_m` (default 50 m)
   - building overlap (`gebaeude`)
   - courtyard fully enclosed by buildings (`hinterhof`), only with "Hinterhöfe ausschließen" (see `scoring/courtyards.py`)
6. **Classification** – `eignungsklasse` is binned from `mce_gesamtscore`
   (`_KLASSE_BINS`/`_KLASSE_LABELS`):

   | Score  | Class          |
   | ------ | -------------- |
   | 0      | ausgeschlossen |
   | 0–40   | schlecht       |
   | 40–60  | mittel         |
   | 60–80  | gut            |
   | 80–100 | sehr gut       |

## Missing data

A run never aborts because input data is missing. If a PostGIS table cannot be read (the
query fails or the table is missing on this server), the loader returns an empty result
and adds a run data note (`SpaceFinderRun.dataNotes`, reason `abfrage_fehlgeschlagen` or
`tabelle_fehlt`); the factor then scores as if nothing were there. The same goes for the
ÖPNV/bikesharing distance step and the carriageway buffering (`berechnung_fehlgeschlagen`).
A query that runs and finds nothing adds no note. The app shows these notes as a warning
above the result. Rule and source keys: `PostgisLoader` in `scoring/postgis_loader.py`.

## Zoom aggregation (display)

For low zoom levels (z < 16) the fine res-13 hexagons are additionally
aggregated to H3 res. 11 (`AGG_H3_RES`) via `aggregate_hexagons()` – the mean
of the best 7 values (`AGG_TOP_CELLS`, ≈ 300 m²) of each score column per
`h3.cell_to_parent`; `eignungsklasse` is derived again from that. A coarse cell
thus shows its best ~300 m²: a mean of all 49 cells would let excluded cells
hide good areas, the maximum would let one good fine cell color the whole coarse
cell. Each column picks its own best cells. `cluster_area_m2` is the largest contiguous area
among the fine cells, so the minimum area filter also applies to coarse cells.
No re-scoring, no spatial joins. Runs computed before this change keep the mean
until they are recalculated. The zoom branch
(`z >= 16 → res 13, otherwise res 11`) must match the tile function
`space_finder.space_finder_hexagons` in [`sql/martin_functions.sql`](sql/martin_functions.sql).
The map loads both grids around the switch at z16: below it the fine cells
only draw outlines, so the tile function sends them as bare geometry.
