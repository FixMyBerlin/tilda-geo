-- WHAT IT DOES:
-- QA comparison: count parkings in voronoi polygons vs reference data.
-- Splits by priority (data.euvm_qa_voronoi_2026.priority boolean): false -> qa_parkings_euvm, true -> qa_parkings_euvm_priority.
-- 1. Preserve values in *_previous tables
-- 2. Load reference voronoi from data.euvm_qa_voronoi_2026 (filtered by priority)
-- 3. Clip geometries to Berlin boundary
-- 4. Count current parkings on full-precision geometry, then difference, relative, previous_relative
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
      geom geometry(Geometry, 3857)
    );
  END IF;
END $$;

-- Transform parkings to SRID 5243 for accurate spatial operations
-- (5243 optimized for Germany, uses meters; needed for ST_Contains on line 105)
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
  geom geometry (Geometry, 3857), -- Polygon or MultiPolygon (3857 for Martin vector tiles)
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

-- Create previous table if it doesn't exist (same structure as main table)
CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_previous (
  id TEXT PRIMARY KEY,
  geom geometry (Geometry, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_priority (
  id TEXT PRIMARY KEY,
  geom geometry (Geometry, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm_priority_previous (
  id TEXT PRIMARY KEY,
  geom geometry (Geometry, 3857),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

-- 1. Preserve previous and clear main (priority false)
TRUNCATE TABLE public.qa_parkings_euvm_previous;
INSERT INTO public.qa_parkings_euvm_previous (id, geom, count_reference, count_current, difference, previous_relative, relative)
SELECT id, geom, count_reference, count_current, difference, previous_relative, relative FROM public.qa_parkings_euvm;

TRUNCATE TABLE public.qa_parkings_euvm;
INSERT INTO public.qa_parkings_euvm (id, count_reference, geom)
SELECT id::TEXT, count_reference, ST_Transform(geom::geometry, 3857)
FROM data.euvm_qa_voronoi_2026
WHERE priority IS NOT TRUE;

-- 1b. Preserve previous and clear main (priority true)
TRUNCATE TABLE public.qa_parkings_euvm_priority_previous;
INSERT INTO public.qa_parkings_euvm_priority_previous (id, geom, count_reference, count_current, difference, previous_relative, relative)
SELECT id, geom, count_reference, count_current, difference, previous_relative, relative FROM public.qa_parkings_euvm_priority;

TRUNCATE TABLE public.qa_parkings_euvm_priority;
INSERT INTO public.qa_parkings_euvm_priority (id, count_reference, geom)
SELECT id::TEXT, count_reference, ST_Transform(geom::geometry, 3857)
FROM data.euvm_qa_voronoi_2026
WHERE priority IS TRUE;

-- 2. Clip to Berlin boundary (priority false)
UPDATE public.qa_parkings_euvm
SET geom = ST_Intersection(public.qa_parkings_euvm.geom, ST_Transform(berlin.geom, 3857))
FROM public.boundaries berlin
WHERE berlin.osm_id = 62422
  AND NOT ST_Within(public.qa_parkings_euvm.geom, ST_Transform(berlin.geom, 3857));

-- 2b. Clip to Berlin boundary (priority true)
UPDATE public.qa_parkings_euvm_priority
SET geom = ST_Intersection(public.qa_parkings_euvm_priority.geom, ST_Transform(berlin.geom, 3857))
FROM public.boundaries berlin
WHERE berlin.osm_id = 62422
  AND NOT ST_Within(public.qa_parkings_euvm_priority.geom, ST_Transform(berlin.geom, 3857));

-- 3. Count current parkings on full-precision geometry (priority false)
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

-- 3b. Count current parkings on full-precision geometry (priority true)
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

-- 4. Difference and relative (priority false)
UPDATE public.qa_parkings_euvm SET difference = count_reference - count_current;
UPDATE public.qa_parkings_euvm SET relative = CASE
  WHEN count_reference <> 0 THEN ROUND((count_current::NUMERIC / count_reference::NUMERIC), 3)
  WHEN count_reference = 0 AND count_current = 0 THEN 1.0
  WHEN count_reference = 0 AND count_current > 0 THEN 99.0
  ELSE NULL
END;

-- 4b. Difference and relative (priority true)
UPDATE public.qa_parkings_euvm_priority SET difference = count_reference - count_current;
UPDATE public.qa_parkings_euvm_priority SET relative = CASE
  WHEN count_reference <> 0 THEN ROUND((count_current::NUMERIC / count_reference::NUMERIC), 3)
  WHEN count_reference = 0 AND count_current = 0 THEN 1.0
  WHEN count_reference = 0 AND count_current > 0 THEN 99.0
  ELSE NULL
END;

-- 5. Previous relative (priority false)
UPDATE public.qa_parkings_euvm q
SET previous_relative = prev.relative
FROM public.qa_parkings_euvm_previous prev
WHERE q.id = prev.id;

-- 5b. Previous relative (priority true)
UPDATE public.qa_parkings_euvm_priority q
SET previous_relative = prev.relative
FROM public.qa_parkings_euvm_priority_previous prev
WHERE q.id = prev.id;

-- 6. Simplify for presentation (snap to 2 m grid; preserves shared edges)
UPDATE public.qa_parkings_euvm SET geom = ST_MakeValid(ST_SnapToGrid(geom, 2));
UPDATE public.qa_parkings_euvm_priority SET geom = ST_MakeValid(ST_SnapToGrid(geom, 2));

CREATE INDEX IF NOT EXISTS qa_parkings_euvm_geom_idx ON public.qa_parkings_euvm USING GIST (geom);
CREATE INDEX IF NOT EXISTS qa_parkings_euvm_priority_geom_idx ON public.qa_parkings_euvm_priority USING GIST (geom);

DO $$ BEGIN RAISE NOTICE 'END qa parking euvm voronoi at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
