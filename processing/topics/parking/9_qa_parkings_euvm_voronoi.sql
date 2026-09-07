-- WHAT IT DOES:
-- QA comparison: count parkings in voronoi polygons vs reference data.
-- Splits by priority (data.euvm_qa_voronoi_2026.priority boolean): false -> qa_parkings_euvm, true -> qa_parkings_euvm_priority.
-- Source data.euvm_qa_voronoi_2026 is expected to be pre-clipped to Berlin and
-- pre-normalized to valid MultiPolygon (docs/qa_create_new_voronoi_baseline.sql).
-- 1. Preserve values in *_previous tables and load reference voronoi (filtered by priority)
-- 2. Count current parkings on full-precision geometry
-- 3. Difference and relative
-- 4. Previous relative
-- 5. Snap to grid (2 m) for presentation only; preserves shared edges
-- INPUT: data.euvm_qa_voronoi_2026 (polygon, priority boolean), public.parkings_quantized, public.off_street_parking_quantized
-- OUTPUT: public.qa_parkings_euvm (priority false), public.qa_parkings_euvm_priority (priority true)
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

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm (
  id TEXT PRIMARY KEY,
  geom geometry (MultiPolygon, 3857), -- 3857 for Martin vector tiles
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

-- Create previous table if it doesn't exist (same structure as main table)
CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_previous (
  id TEXT PRIMARY KEY,
  geom geometry (MultiPolygon, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_priority (
  id TEXT PRIMARY KEY,
  geom geometry (MultiPolygon, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_priority_previous (
  id TEXT PRIMARY KEY,
  geom geometry (MultiPolygon, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

-- RUN ONCE PER ENV, THEN DELETE.
-- CREATE TABLE IF NOT EXISTS ignores a changed column type on existing DBs
-- (Geometry/3857 → MultiPolygon/3857). After the next parking processing run
-- on each environment this is a no-op. Remove this block once all envs have
-- run it; delete by end of 2026 in any case.
DO $$
DECLARE
  t text;
  current_type text;
  current_srid integer;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'qa_parkings_euvm',
    'qa_parkings_euvm_previous',
    'qa_parkings_euvm_priority',
    'qa_parkings_euvm_priority_previous'
  ]
  LOOP
    SELECT type, srid
    INTO current_type, current_srid
    FROM public.geometry_columns
    WHERE f_table_schema = 'public'
      AND f_table_name = t
      AND f_geometry_column = 'geom';

    IF current_type IS DISTINCT FROM 'MULTIPOLYGON' OR current_srid IS DISTINCT FROM 3857 THEN
      EXECUTE format(
        'ALTER TABLE public.%I ALTER COLUMN geom TYPE geometry(MultiPolygon, 3857) USING ST_Multi(ST_CollectionExtract(ST_MakeValid(geom), 3))',
        t
      );
    END IF;
  END LOOP;
END $$;

-- 1. Preserve previous and clear main (priority false)
TRUNCATE TABLE public.qa_parkings_euvm_previous;
INSERT INTO public.qa_parkings_euvm_previous (id, geom, count_reference, count_current, difference, previous_relative, relative)
SELECT id, geom, count_reference, count_current, difference, previous_relative, relative FROM public.qa_parkings_euvm;

TRUNCATE TABLE public.qa_parkings_euvm;
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

-- 1b. Preserve previous and clear main (priority true)
TRUNCATE TABLE public.qa_parkings_euvm_priority_previous;
INSERT INTO public.qa_parkings_euvm_priority_previous (id, geom, count_reference, count_current, difference, previous_relative, relative)
SELECT id, geom, count_reference, count_current, difference, previous_relative, relative FROM public.qa_parkings_euvm_priority;

TRUNCATE TABLE public.qa_parkings_euvm_priority;
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

-- 2. Count current parkings on full-precision geometry (priority false)
WITH counts AS (
  SELECT v.id AS id, COUNT(p.*) AS count_current
  FROM public.qa_parkings_euvm v
  LEFT JOIN _parking_parkings_quantized p ON ST_Contains(ST_Transform(v.geom, 5243), p.geom)
  GROUP BY v.id
)
UPDATE public.qa_parkings_euvm pv
SET count_current = COALESCE(c.count_current, 0)
FROM counts c
WHERE pv.id = c.id;

-- 2b. Count current parkings on full-precision geometry (priority true)
WITH counts AS (
  SELECT v.id AS id, COUNT(p.*) AS count_current
  FROM public.qa_parkings_euvm_priority v
  LEFT JOIN _parking_parkings_quantized p ON ST_Contains(ST_Transform(v.geom, 5243), p.geom)
  GROUP BY v.id
)
UPDATE public.qa_parkings_euvm_priority pv
SET count_current = COALESCE(c.count_current, 0)
FROM counts c
WHERE pv.id = c.id;

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
