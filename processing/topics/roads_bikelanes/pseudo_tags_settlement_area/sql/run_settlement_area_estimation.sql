-- Per-way innerorts/außerorts estimation -> CSV (minority class only).
--
-- Classifies all roads + path-class roads + bikelanes by whether they intersect any
-- public._settlement_areas polygon (method picked by the benchmark — see
-- ../../landcover/settlement_areas/BENCHMARK_DOCUMENTATION.md: ST_Intersects is ~170s/15.9M ways and robust; the
-- %-coverage variant was far too expensive). Exports only
-- the MINORITY class — ways OUTSIDE all settlement areas (~32% by count on Germany; see
-- ../../landcover/settlement_areas/CLASSIFICATION_STATS.md) — and the
-- Lua loader infers inside (assumed_yes) as the default. Mirrors run_is_sidepath_estimation.sql.
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

-- Export the minority class: ways that intersect NO settlement area (außerorts).
\o :outfile
\pset format csv
\pset tuples_only off
SELECT DISTINCT
  osm_id,
  'assumed_no' AS in_settlement_area
FROM _settlement_estimation_ways w
WHERE NOT EXISTS (
  SELECT 1 FROM public._settlement_areas s WHERE ST_Intersects (w.geom, s.geom)
);
\o
