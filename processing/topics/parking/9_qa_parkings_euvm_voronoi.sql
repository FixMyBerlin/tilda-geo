-- WHAT IT DOES:
-- QA comparison: count parkings in voronoi polygons vs reference data.
-- Splits by priority (data.euvm_qa_voronoi_2026.priority boolean): false -> qa_parkings_euvm, true -> qa_parkings_euvm_priority.
-- Source data.euvm_qa_voronoi_2026 is expected to be pre-clipped to Berlin and
-- pre-normalized to valid MultiPolygon (docs/qa_create_new_voronoi_baseline.sql).
-- 1. Rebuild main + previous tables (previous run's values preserved) and load reference voronoi (filtered by priority)
-- 2. Count current parkings and collect last_editors per cell, on full-precision geometry
-- 3. Difference and relative
-- 4. Previous relative
-- 5. Snap to grid (2 m) for presentation only; preserves shared edges
-- INPUT: data.euvm_qa_voronoi_2026 (polygon, priority boolean), public.parkings_quantized, public.off_street_parking_quantized
-- OUTPUT: public.qa_parkings_euvm (priority false), public.qa_parkings_euvm_priority (priority true)
--         both carry `last_editors` JSONB: [{osmUser, spaceCount, updatedAt}, ...] per cell, ordered by updatedAt desc
--         (updatedAt is Unix epoch seconds from meta.updated_at; the app filters entries by a cutoff timestamp)
--
DO $$ BEGIN RAISE NOTICE 'START qa parking euvm voronoi at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- In some dev/test DB setups the reference dataset (`data.euvm_qa_voronoi_2026`) may be missing.
-- Instead of failing the whole processing run, create an empty placeholder so the QA step becomes a no-op.
DO $$
BEGIN
  IF to_regclass('data.euvm_qa_voronoi_2026') IS NULL THEN
    RAISE NOTICE 'Missing data.euvm_qa_voronoi_2026 - creating empty placeholder table for this run';
    CREATE SCHEMA IF NOT EXISTS data;
    CREATE TABLE data.euvm_qa_voronoi_2026 (
      id TEXT,
      priority BOOLEAN,
      count_reference INTEGER,
      geom geometry(MultiPolygon, 4326)
    );
  END IF;
END $$;

-- Transform parkings to SRID 5243 for accurate spatial operations
-- (5243 optimized for Germany, uses meters; needed for the ST_Contains counts in step 2)
-- Combine parkings_quantized (excl private) and off_street_parking_quantized (public only)
DROP TABLE IF EXISTS _parking_parkings_quantized;

CREATE TEMP TABLE _parking_parkings_quantized AS
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 5243) as geom
FROM
  parkings_quantized
WHERE
  (
    tags ->> 'operator_type' IS NULL
    OR tags ->> 'operator_type' <> 'private'
  )
UNION ALL
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 5243) as geom
FROM
  off_street_parking_quantized
WHERE
  tags ->> 'operator_type' = 'public';

CREATE INDEX _parking_parkings_quantized_geom_idx ON _parking_parkings_quantized USING GIST (geom);

-- 1. Keep the previous run's relative values for step 4, then rebuild the main tables.
-- On a fresh DB there is no previous run, so empty main tables are created to copy from.
CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm (id TEXT, relative NUMERIC);

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_priority (id TEXT, relative NUMERIC);

DROP TABLE IF EXISTS public.qa_parkings_euvm_previous;

CREATE TABLE public.qa_parkings_euvm_previous AS
SELECT id, relative FROM public.qa_parkings_euvm;

DROP TABLE IF EXISTS public.qa_parkings_euvm_priority_previous;

CREATE TABLE public.qa_parkings_euvm_priority_previous AS
SELECT id, relative FROM public.qa_parkings_euvm_priority;

DROP TABLE public.qa_parkings_euvm;

CREATE TABLE public.qa_parkings_euvm (
  id TEXT PRIMARY KEY,
  geom geometry (MultiPolygon, 3857), -- 3857 for Martin vector tiles
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC,
  last_editors JSONB NOT NULL DEFAULT '[]'::jsonb
);

DROP TABLE IF EXISTS public.qa_parkings_euvm_priority;

CREATE TABLE public.qa_parkings_euvm_priority (
  id TEXT PRIMARY KEY,
  geom geometry (MultiPolygon, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC,
  last_editors JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 1a. Load reference voronoi (priority false)
-- Cheap guard for stale sources that were not yet repaired/re-imported; not a re-implementation of the Berlin clip.
INSERT INTO public.qa_parkings_euvm (id, count_reference, geom)
SELECT id, count_reference, geom
FROM (
  SELECT
    id::TEXT AS id,
    count_reference,
    ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Transform(geom::geometry, 3857)), 3)) AS geom
  FROM data.euvm_qa_voronoi_2026
  WHERE priority IS NOT TRUE
) src
WHERE NOT ST_IsEmpty(src.geom);

-- 1b. Load reference voronoi (priority true)
INSERT INTO public.qa_parkings_euvm_priority (id, count_reference, geom)
SELECT id, count_reference, geom
FROM (
  SELECT
    id::TEXT AS id,
    count_reference,
    ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_Transform(geom::geometry, 3857)), 3)) AS geom
  FROM data.euvm_qa_voronoi_2026
  WHERE priority IS TRUE
) src
WHERE NOT ST_IsEmpty(src.geom);

-- Stale unrepaired sources can yield empty cells after MakeValid+extract; those
-- rows are skipped above so they do not land as empty map cells. NOTICE only —
-- do not fail the nightly run. Re-import the baseline on the affected
-- environment via /admin/data-schema → Import.
DO $$
DECLARE
  n_src_main bigint;
  n_ins_main bigint;
  n_src_pri bigint;
  n_ins_pri bigint;
  n_drop_main bigint;
  n_drop_pri bigint;
BEGIN
  SELECT count(*) INTO n_src_main FROM data.euvm_qa_voronoi_2026 WHERE priority IS NOT TRUE;
  SELECT count(*) INTO n_ins_main FROM public.qa_parkings_euvm;
  SELECT count(*) INTO n_src_pri FROM data.euvm_qa_voronoi_2026 WHERE priority IS TRUE;
  SELECT count(*) INTO n_ins_pri FROM public.qa_parkings_euvm_priority;
  n_drop_main := n_src_main - n_ins_main;
  n_drop_pri := n_src_pri - n_ins_pri;

  IF n_drop_main = 0 AND n_drop_pri = 0 THEN
    RAISE NOTICE 'Dropped 0 empty voronoi cells from qa_parkings_euvm / qa_parkings_euvm_priority';
  ELSE
    IF n_drop_main > 0 THEN
      RAISE NOTICE 'Dropped % empty voronoi cells from qa_parkings_euvm; re-import the baseline via /admin/data-schema → Import',
        n_drop_main;
    END IF;
    IF n_drop_pri > 0 THEN
      RAISE NOTICE 'Dropped % empty voronoi cells from qa_parkings_euvm_priority; re-import the baseline via /admin/data-schema → Import',
        n_drop_pri;
    END IF;
  END IF;
END $$;

-- 2. Count current parkings + last editors per cell (priority false), via a single spatial join.
-- Step A: per (cell, osm_user, updated_at) space_count.
-- COUNT(p.id), not COUNT(*): a LEFT JOIN miss (cell without points) must count as 0 spaces, not 1.
DROP TABLE IF EXISTS _qa_parkings_euvm_editors;

CREATE TEMP TABLE _qa_parkings_euvm_editors AS
SELECT
  v.id AS cell_id,
  p.meta ->> 'updated_by' AS osm_user,
  (p.meta ->> 'updated_at')::BIGINT AS updated_at,
  COUNT(p.id) AS space_count -- each quantized point = 1 space (tags capacity = 1)
FROM public.qa_parkings_euvm v
LEFT JOIN _parking_parkings_quantized p ON ST_Contains(ST_Transform(v.geom, 5243), p.geom)
GROUP BY
  v.id,
  p.meta ->> 'updated_by',
  (p.meta ->> 'updated_at')::BIGINT;

-- Step B: aggregate per cell. FILTER (WHERE space_count > 0) drops the LEFT-JOIN-miss placeholder
-- row (osm_user=NULL, space_count=0) from last_editors so it doesn't create a fake entry; it still
-- contributes 0 to count_current via SUM. One entry per (osmUser, updatedAt) pair — not collapsed
-- to one entry per user — because the app filters entries by a cutoff timestamp.
UPDATE public.qa_parkings_euvm pv
SET
  count_current = COALESCE(agg.count_current, 0),
  last_editors = COALESCE(agg.last_editors, '[]'::jsonb)
FROM (
  SELECT
    cell_id,
    SUM(space_count) AS count_current,
    jsonb_agg(
      jsonb_build_object('osmUser', osm_user, 'spaceCount', space_count, 'updatedAt', updated_at)
      ORDER BY updated_at DESC, osm_user
    ) FILTER (WHERE space_count > 0) AS last_editors
  FROM _qa_parkings_euvm_editors
  GROUP BY cell_id
) agg
WHERE pv.id = agg.cell_id;

-- 2b. Count current parkings + last editors per cell (priority true). Same logic as step 2.
DROP TABLE IF EXISTS _qa_parkings_euvm_editors;

CREATE TEMP TABLE _qa_parkings_euvm_editors AS
SELECT
  v.id AS cell_id,
  p.meta ->> 'updated_by' AS osm_user,
  (p.meta ->> 'updated_at')::BIGINT AS updated_at,
  COUNT(p.id) AS space_count
FROM public.qa_parkings_euvm_priority v
LEFT JOIN _parking_parkings_quantized p ON ST_Contains(ST_Transform(v.geom, 5243), p.geom)
GROUP BY
  v.id,
  p.meta ->> 'updated_by',
  (p.meta ->> 'updated_at')::BIGINT;

UPDATE public.qa_parkings_euvm_priority pv
SET
  count_current = COALESCE(agg.count_current, 0),
  last_editors = COALESCE(agg.last_editors, '[]'::jsonb)
FROM (
  SELECT
    cell_id,
    SUM(space_count) AS count_current,
    jsonb_agg(
      jsonb_build_object('osmUser', osm_user, 'spaceCount', space_count, 'updatedAt', updated_at)
      ORDER BY updated_at DESC, osm_user
    ) FILTER (WHERE space_count > 0) AS last_editors
  FROM _qa_parkings_euvm_editors
  GROUP BY cell_id
) agg
WHERE pv.id = agg.cell_id;

DROP TABLE IF EXISTS _qa_parkings_euvm_editors;

-- 3. Difference and relative (priority false)
UPDATE public.qa_parkings_euvm SET difference = count_reference - count_current;
UPDATE public.qa_parkings_euvm SET relative = CASE
  WHEN count_reference <> 0 THEN ROUND((count_current::NUMERIC / count_reference::NUMERIC), 3)
  WHEN count_reference = 0 AND count_current = 0 THEN 1.0
  WHEN count_reference = 0 AND count_current > 0 THEN 99.0
  ELSE NULL
END;

-- 3b. Difference and relative (priority true)
UPDATE public.qa_parkings_euvm_priority SET difference = count_reference - count_current;
UPDATE public.qa_parkings_euvm_priority SET relative = CASE
  WHEN count_reference <> 0 THEN ROUND((count_current::NUMERIC / count_reference::NUMERIC), 3)
  WHEN count_reference = 0 AND count_current = 0 THEN 1.0
  WHEN count_reference = 0 AND count_current > 0 THEN 99.0
  ELSE NULL
END;

-- 4. Previous relative (priority false)
UPDATE public.qa_parkings_euvm q
SET previous_relative = prev.relative
FROM public.qa_parkings_euvm_previous prev
WHERE q.id = prev.id;

-- 4b. Previous relative (priority true)
UPDATE public.qa_parkings_euvm_priority q
SET previous_relative = prev.relative
FROM public.qa_parkings_euvm_priority_previous prev
WHERE q.id = prev.id;

-- 5. Simplify for presentation (snap to 2 m grid; preserves shared edges).
-- Snap can collapse thin slivers into lines; extract the polygonal part.
-- A cell that collapses entirely keeps its pre-snap polygon (only rows with a
-- non-empty snapped polygon are updated). Measured: 156 cells produced
-- GeometryCollections; exactly one cell (id=23373) collapses to empty at 2 m.
UPDATE public.qa_parkings_euvm q
SET geom = s.geom
FROM (
  SELECT id, ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SnapToGrid(geom, 2)), 3)) AS geom
  FROM public.qa_parkings_euvm
) s
WHERE q.id = s.id
  AND NOT ST_IsEmpty(s.geom);
UPDATE public.qa_parkings_euvm_priority q
SET geom = s.geom
FROM (
  SELECT id, ST_Multi(ST_CollectionExtract(ST_MakeValid(ST_SnapToGrid(geom, 2)), 3)) AS geom
  FROM public.qa_parkings_euvm_priority
) s
WHERE q.id = s.id
  AND NOT ST_IsEmpty(s.geom);

CREATE INDEX IF NOT EXISTS qa_parkings_euvm_geom_idx ON public.qa_parkings_euvm USING GIST (geom);
CREATE INDEX IF NOT EXISTS qa_parkings_euvm_priority_geom_idx ON public.qa_parkings_euvm_priority USING GIST (geom);

DO $$ BEGIN RAISE NOTICE 'END qa parking euvm voronoi at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
