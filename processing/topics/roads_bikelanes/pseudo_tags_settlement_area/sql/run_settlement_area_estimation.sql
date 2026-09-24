-- Per-way innerorts/außerorts estimation -> CSV (minority class only).
--
-- Classifies all roads + path-class roads + bikelanes by whether they lie MOSTLY inside a
-- public._settlement_areas polygon: a way is innerorts when more than half of its length is
-- covered by settlement areas. Touching a settlement area at all (the earlier ST_Intersects rule)
-- is not enough — a Landstraße that clips the edge of a village stays außerorts. Exports only
-- the MINORITY class — ways mostly OUTSIDE all settlement areas — and the Lua loader infers inside
-- (assumed_yes) as the default. Mirrors run_is_sidepath_estimation.sql.
--
-- Cost: the %-coverage benchmark (see ../../landcover/settlement_areas/BENCHMARK_DOCUMENTATION.md)
-- measured ST_Intersection over ALL 15.9M ways and blew up. We therefore stage it: the cheap
-- index-only tests (touches / fully covered) decide the vast majority, and the expensive
-- ST_Intersection runs only for the ways that actually cross a settlement boundary.
--
-- Invoke: psql -v outfile=/path/settlement_area_estimation.csv -f run_settlement_area_estimation.sql
--
-- public._settlement_areas is in EPSG:5243; roads/bikelanes are in 3857, so we transform the ways
-- into a 5243 temp table with a GIST index (same pattern as is_sidepath / parking).

-- Candidate ways in 5243 = ALL the ways the Lua attaches _in_settlement_area to: every row in
-- `roads` (all road classes, incl. service) + `roadsPathClasses` (path classes) + `bikelanes`.
-- We classify every way; the Lua's way_classes decides which ones actually keep the tag (so
-- classifying a class the Lua ignores is harmless). This is deliberately broader than the
-- sidepath road list — settlement applies to all roads, not just the "main roads a path can be a
-- sidepath of". KEEP IN SYNC (FYI) with in_settlement_area.lua's way_classes.
DROP TABLE IF EXISTS _settlement_estimation_ways;
CREATE TEMP TABLE _settlement_estimation_ways AS
-- UNION ALL: the three sources never collide on (osm_id, geom); the per-osm_id dedup that matters
-- is the SELECT DISTINCT on the output below.
SELECT osm_id, ST_Transform(geom, 5243) AS geom FROM roads
UNION ALL
SELECT osm_id, ST_Transform(geom, 5243) AS geom FROM "roadsPathClasses"
UNION ALL
SELECT osm_id, ST_Transform(geom, 5243) AS geom FROM bikelanes;
CREATE INDEX ON _settlement_estimation_ways USING GIST (geom);
ANALYZE _settlement_estimation_ways;

-- Stage 1 (cheap, index-only): does the way touch any settlement area, and is it fully covered by
-- one? Both are answered from the GIST index. `covered` can be false for a way that lies inside
-- two adjoining polygons — such a way falls through to stage 2 and is measured there.
DROP TABLE IF EXISTS _settlement_estimation_classified;
CREATE TEMP TABLE _settlement_estimation_classified AS
SELECT
  w.osm_id,
  w.geom,
  EXISTS (SELECT 1 FROM public._settlement_areas s WHERE ST_Intersects(w.geom, s.geom)) AS touches,
  EXISTS (SELECT 1 FROM public._settlement_areas s WHERE ST_CoveredBy(w.geom, s.geom)) AS covered
FROM _settlement_estimation_ways w;

-- Stage 2 (expensive, boundary crossers only): how much of the way's length is inside? Mostly
-- outside = at most half the length inside. Degenerate zero-length geometries have no majority to
-- speak of; since they touch a settlement area they keep the innerorts default.
DROP TABLE IF EXISTS _settlement_estimation_mostly_outside;
CREATE TEMP TABLE _settlement_estimation_mostly_outside AS
SELECT c.osm_id
FROM _settlement_estimation_classified c
CROSS JOIN LATERAL (
  SELECT COALESCE(SUM(ST_Length(ST_Intersection(c.geom, s.geom))), 0) AS inside_length
  FROM public._settlement_areas s
  WHERE ST_Intersects(c.geom, s.geom)
) cov
WHERE c.touches
  AND NOT c.covered
  AND ST_Length(c.geom) > 0
  AND cov.inside_length * 2 <= ST_Length(c.geom);

-- Export the minority class: ways that lie mostly outside settlement areas (außerorts).
\o :outfile
\pset format csv
\pset tuples_only off
SELECT DISTINCT
  osm_id,
  'assumed_no' AS in_settlement_area
FROM (
  SELECT osm_id FROM _settlement_estimation_classified WHERE NOT touches
  UNION ALL
  SELECT osm_id FROM _settlement_estimation_mostly_outside
) mostly_outside;
\o
