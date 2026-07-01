-- WHAT IT DOES:
-- Build `public._settlement_areas` from `_settlement_source_areas` via grid-partitioned dissolve.
-- INPUT: `_settlement_source_areas` (polygon, from settlement_source.lua)
-- OUTPUT: `public._settlement_areas` (polygon, 5243, standard topic-table shape)
--
-- public._settlement_areas uses the standard topic-table shape (id/tags/meta/geom/minzoom) so it
-- previews cleanly in Martin. The `_` prefix marks it internal/debug — exposed to Martin for
-- inspection, not a curated display layer (no `atlas_*` function). Its actual consumer is the
-- per-way innerorts/außerorts join in roads_bikelanes/pseudo_tags_settlement_area.
--
-- Method, CRS (EPSG:5243), the heuristic caveat and measured performance: see README.md +
-- BENCHMARK_DOCUMENTATION.md in this folder. Tune via the commented constants inline below.
--
DO $$ BEGIN RAISE NOTICE 'START dissolving settlement areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- grid_size: cell size (m) for the partitioned dissolve. We never union the whole country at
-- once — only within a grid cell, then stitch the few per-cell results. Used for both gx and gy,
-- so it stays a \set variable; every other constant is inlined where it is used.
\set grid_size 20000

-- Parallel-safe ST_Union benefits from parallel workers; encourage the planner to use them.
SET max_parallel_workers_per_gather = 4;
SET parallel_setup_cost = 0;
SET parallel_tuple_cost = 0;

DROP TABLE IF EXISTS public._settlement_areas;

CREATE TABLE public._settlement_areas AS
WITH
  -- 1. Make valid, lightly simplify, then outer-buffer (per row -> parallelizable).
  buffered AS (
    SELECT
      ST_Buffer(
        ST_SimplifyPreserveTopology(ST_MakeValid(geom), 5 /* simplify_source: pre-simplify input polygons, m */),
        100 /* buffer_outer: outer buffer, m */
      ) AS geom
    FROM _settlement_source_areas
    WHERE geom IS NOT NULL AND NOT ST_IsEmpty(geom)
  ),
  -- 2. Assign each polygon to a coarse grid cell (by centroid).
  gridded AS (
    SELECT
      geom,
      floor(ST_X(ST_Centroid(geom)) / :grid_size)::int AS gx,
      floor(ST_Y(ST_Centroid(geom)) / :grid_size)::int AS gy
    FROM buffered
  ),
  -- 3. Dissolve within each cell (parallel-safe aggregate; memory bounded by busiest cell).
  cell_union AS (
    SELECT ST_Union(geom) AS geom
    FROM gridded
    GROUP BY gx, gy
  ),
  -- 4. Stitch the (few) per-cell results and split into individual settlement blobs.
  --    Buffered polygons overlap across cell borders, so the final union re-merges them.
  dissolved AS (
    SELECT (ST_Dump(ST_Union(geom))).geom AS geom
    FROM cell_union
  ),
  -- 5. Inner-buffer (shrink) each blob, then clean. The shrink (< outer) keeps edge roads in.
  shrunk AS (
    SELECT
      (ST_Dump(ST_MakeValid(ST_Buffer(geom, -75 /* buffer_inner: inner buffer / shrink, m */)))).geom AS geom
    FROM dissolved
  ),
  simplified AS (
    SELECT ST_MakeValid(ST_SimplifyPreserveTopology(geom, 20 /* simplify: final tolerance, m */)) AS geom
    FROM shrunk
    WHERE geom IS NOT NULL
      AND NOT ST_IsEmpty(geom)
      AND ST_Dimension(geom) = 2
  ),
  -- 6. Keep polygon parts only (MakeValid can emit lines/collections), so the result is
  --    GEOS-robust for ST_Intersects (else a single bad ring aborts every per-way query).
  --    These are whole settlement polygons: drop tiny ones, then compute the per-settlement area
  --    + a size-based minzoom and carry both through ST_Subdivide so all fragments share them.
  settlements AS (
    SELECT geom, ST_Area(geom) AS area_m2
    FROM (
      SELECT (ST_Dump(ST_CollectionExtract(geom, 3))).geom AS geom
      FROM simplified
      WHERE geom IS NOT NULL AND NOT ST_IsEmpty(geom)
    ) parts
    WHERE ST_Area(geom) >= 0 /* min_area: drop settlements smaller than this, m² (0 = keep all) */
  ),
  -- 7. Subdivide for fast spatial joins. Everything is already in 5243.
  subdivided AS (
    SELECT area_m2, ST_Subdivide(geom, 512 /* subdivide: max vertices per stored polygon */) AS geom
    FROM settlements
  )
SELECT
  'settlement-area/' || row_number() OVER () AS id,
  jsonb_build_object('area', round(area_m2)) AS tags,
  '{}'::jsonb AS meta,
  geom::geometry (Geometry, 5243) AS geom,
  CASE
    WHEN area_m2 >= 50000000 THEN 6 -- >= 50 km² (large city / conurbation)
    WHEN area_m2 >= 5000000 THEN 8 -- >= 5 km² (town)
    WHEN area_m2 >= 500000 THEN 10 -- >= 0.5 km² (village / district)
    ELSE 12
  END AS minzoom
FROM subdivided
WHERE geom IS NOT NULL AND NOT ST_IsEmpty(geom) AND ST_IsValid(geom);

ALTER TABLE public._settlement_areas
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN minzoom SET NOT NULL;

-- Standard topic-table indexes (needs btree_gist for the (minzoom, geom) GIST — enabled in
-- steps/initialize.ts) + a plain GIST(geom) for the per-way ST_Intersects join (pure spatial, no
-- minzoom filter — clusters tighter than the multicolumn index for that ~15.9M-way probe).
CREATE INDEX ON public._settlement_areas USING GIST (minzoom, geom);
CREATE UNIQUE INDEX ON public._settlement_areas (id);
CREATE INDEX ON public._settlement_areas USING GIST (geom);

ANALYZE public._settlement_areas;

DO $$ BEGIN RAISE NOTICE 'END dissolving settlement areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
