-- WHAT IT DOES:
-- QA comparison: count parkings in voronoi polygons vs reference data.
-- 1. Preserve values in *_previous table
-- 2. Load reference voronoi from data.euvm_qa_voronoi
-- 3. Clip geometries to Berlin boundary
-- 4. Count current parkings (excl private) per polygon
-- 5. Calculate difference and relative values
-- 6. Update previous_relative from previous run
-- INPUT: data.euvm_qa_voronoi (polygon), public.parkings_quantized (point)
-- OUTPUT: public.qa_parkings_euvm (polygon with counts)
--
DO $$ BEGIN RAISE NOTICE 'START qa parking euvm voronoi at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Transform parkings to SRID 5243 for accurate spatial operations
-- (5243 optimized for Germany, uses meters; needed for ST_Contains on line 105)
DROP TABLE IF EXISTS _parking_parkings_quantized;

CREATE TEMP TABLE _parking_parkings_quantized AS
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 5243) as geom
FROM
  parkings_quantized;

CREATE INDEX _parking_parkings_quantized_geom_idx ON _parking_parkings_quantized USING GIST (geom);

-- ============================================================================
-- MIGRATION BLOCK: Remove this entire section after deployment is complete
-- ============================================================================
-- This migration handles tables created with old schema (4326 SRID) before
-- commit 591ae3d057bb0734c55f0b05cfa975f975045c29
-- Diagnostics: All geometries are SRID 4326, need migration to 3857
-- Also migrates qa_parkings_euvm_old -> qa_parkings_euvm_previous
-- ============================================================================
DO $$
DECLARE
  row_count INTEGER;
  old_table_row_count INTEGER;
  old_table_has_wrong_srid BOOLEAN := FALSE;
  old_table_has_wrong_id_type BOOLEAN := FALSE;
BEGIN
  -- 1. Migrate qa_parkings_euvm table (SRID 4326 -> 3857, ensure all columns exist)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qa_parkings_euvm'
  ) THEN
    -- Ensure all required columns exist (add if missing)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'qa_parkings_euvm' AND column_name = 'count_current'
    ) THEN
      RAISE NOTICE 'Adding missing columns to qa_parkings_euvm...';
      ALTER TABLE public.qa_parkings_euvm
      ADD COLUMN IF NOT EXISTS count_current INTEGER,
      ADD COLUMN IF NOT EXISTS difference INTEGER,
      ADD COLUMN IF NOT EXISTS previous_relative NUMERIC,
      ADD COLUMN IF NOT EXISTS relative NUMERIC;
    END IF;

    -- Count rows that need migration (SRID != 3857)
    SELECT COUNT(*) INTO row_count
    FROM public.qa_parkings_euvm
    WHERE geom IS NOT NULL AND ST_SRID(geom) != 3857;

    IF row_count > 0 THEN
      RAISE NOTICE 'Migrating % rows from SRID 4326 to 3857 in qa_parkings_euvm...', row_count;

      ALTER TABLE public.qa_parkings_euvm
      ALTER COLUMN geom TYPE geometry(Geometry, 3857)
      USING CASE
        WHEN ST_SRID(geom) = 3857 THEN geom
        ELSE ST_Transform(geom, 3857)
      END;

      RAISE NOTICE 'Migration completed: % rows transformed to SRID 3857.', row_count;
    ELSE
      RAISE NOTICE 'No migration needed for qa_parkings_euvm (all geometries already SRID 3857).';
    END IF;
  END IF;

  -- 2. Migrate qa_parkings_euvm_old -> qa_parkings_euvm_previous
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qa_parkings_euvm_old'
  ) THEN
    RAISE NOTICE 'Found qa_parkings_euvm_old table, migrating to qa_parkings_euvm_previous...';

    -- Check if old table has data
    SELECT COUNT(*) INTO old_table_row_count
    FROM public.qa_parkings_euvm_old;

    -- Check if geometry needs migration
    IF old_table_row_count > 0 THEN
      SELECT EXISTS(
        SELECT 1 FROM public.qa_parkings_euvm_old
        WHERE geom IS NOT NULL AND ST_SRID(geom) != 3857
        LIMIT 1
      ) INTO old_table_has_wrong_srid;
    END IF;

    -- Check if id column type needs migration
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'qa_parkings_euvm_old'
      AND column_name = 'id'
      AND data_type IN ('integer', 'bigint')
    ) INTO old_table_has_wrong_id_type;

    -- Migrate schema if needed
    IF old_table_has_wrong_srid THEN
      RAISE NOTICE 'Migrating qa_parkings_euvm_old.geom from SRID 4326 to 3857...';
      ALTER TABLE public.qa_parkings_euvm_old
      ALTER COLUMN geom TYPE geometry(Geometry, 3857)
      USING CASE
        WHEN ST_SRID(geom) = 3857 THEN geom
        ELSE ST_Transform(geom, 3857)
      END;
    END IF;

    IF old_table_has_wrong_id_type THEN
      RAISE NOTICE 'Migrating qa_parkings_euvm_old.id from INTEGER to TEXT...';
      ALTER TABLE public.qa_parkings_euvm_old
      ALTER COLUMN id TYPE TEXT USING id::TEXT;
    END IF;

    -- Drop qa_parkings_euvm_previous if it exists (staging case)
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'qa_parkings_euvm_previous'
    ) THEN
      RAISE NOTICE 'Dropping existing qa_parkings_euvm_previous table...';
      DROP TABLE public.qa_parkings_euvm_previous;
    END IF;

    -- Rename old table to previous
    ALTER TABLE public.qa_parkings_euvm_old
    RENAME TO qa_parkings_euvm_previous;

    RAISE NOTICE 'Renamed qa_parkings_euvm_old to qa_parkings_euvm_previous (with % rows).', old_table_row_count;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Migration encountered an error: %', SQLERRM;
    -- Continue execution - the INSERT statement below will handle transformation
END $$;

-- ============================================================================
-- END MIGRATION BLOCK - Remove after deployment
-- ============================================================================
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
  geom geometry (Geometry, 3857), -- Polygon or MultiPolygon (3857 for Martin vector tiles)
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

-- 1. Preserve values in *_previous table
TRUNCATE TABLE public.qa_parkings_euvm_previous;

INSERT INTO
  public.qa_parkings_euvm_previous (
    id,
    geom,
    count_reference,
    count_current,
    difference,
    previous_relative,
    relative
  )
SELECT
  id::TEXT,
  geom,
  count_reference,
  count_current,
  difference,
  previous_relative,
  relative
FROM
  public.qa_parkings_euvm;

-- Clear the main table for new data
TRUNCATE TABLE public.qa_parkings_euvm;

-- 2. Load reference voronoi from data.euvm_qa_voronoi and transform to 3857
-- Cast geom to Geometry type to accept both Polygon and MultiPolygon
-- (ST_Intersection can produce MultiPolygon when clipping)
-- Transform from 4326 (source) to 3857 (Martin format) immediately
INSERT INTO
  public.qa_parkings_euvm (id, count_reference, geom)
SELECT
  id::TEXT,
  count_reference,
  ST_Transform (geom::geometry, 3857) as geom
FROM
  data.euvm_qa_voronoi;

-- 3. Clip geometries to Berlin boundary (transform boundary to 3857 for intersection)
UPDATE public.qa_parkings_euvm
SET
  geom = ST_Intersection (
    public.qa_parkings_euvm.geom,
    ST_Transform (berlin.geom, 3857)
  )
FROM
  public.boundaries berlin
WHERE
  berlin.osm_id = 62422
  AND NOT ST_Within (
    public.qa_parkings_euvm.geom,
    ST_Transform (berlin.geom, 3857)
  );

-- 4. Count current parkings (excl private) for each voronoi polygon
WITH
  counts AS (
    SELECT
      v.id as id,
      COUNT(p.*) AS count_current
    FROM
      public.qa_parkings_euvm v
      LEFT JOIN _parking_parkings_quantized p ON ST_Contains (ST_Transform (v.geom, 5243), p.geom)
      AND (
        p.tags ->> 'operator_type' IS NULL
        OR p.tags ->> 'operator_type' != 'private'
      )
    GROUP BY
      v.id
  )
UPDATE public.qa_parkings_euvm pv
SET
  count_current = COALESCE(c.count_current, 0)
FROM
  counts c
WHERE
  pv.id = c.id;

-- 5. Calculate the difference and relative columns
UPDATE public.qa_parkings_euvm
SET
  difference = count_reference - count_current;

UPDATE public.qa_parkings_euvm
SET
  relative = CASE
    WHEN count_reference <> 0 THEN ROUND(
      (count_current::NUMERIC / count_reference::NUMERIC),
      3
    )
    WHEN count_reference = 0
    AND count_current = 0 THEN 1.0
    WHEN count_reference = 0
    AND count_current > 0 THEN 99.0 -- will always trigger a "PROBLEMATIC" evaluation
    ELSE NULL
  END;

-- 6. Update previous_relative from previous run
UPDATE public.qa_parkings_euvm
SET
  previous_relative = previous.relative
FROM
  public.qa_parkings_euvm_previous previous
WHERE
  public.qa_parkings_euvm.id = previous.id;

CREATE INDEX IF NOT EXISTS qa_parkings_euvm_geom_idx ON public.qa_parkings_euvm USING GIST (geom);
