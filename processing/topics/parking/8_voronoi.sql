DO $$ BEGIN RAISE NOTICE 'START qa parking euvm voronoi at %', clock_timestamp(); END $$;

-- Add our calculated columns
ALTER TABLE public.qa_parkings_euvm
ADD COLUMN IF NOT EXISTS previous_relative NUMERIC,
ADD COLUMN IF NOT EXISTS relative NUMERIC;

-- Preserve current relative values as previous_relative before recreating data
CREATE TEMP TABLE temp_previous_values AS
SELECT
  id,
  relative as previous_relative
FROM
  public.qa_parkings_euvm
WHERE
  relative IS NOT NULL;

-- Drop and recreate the main table
DROP TABLE IF EXISTS public.qa_parkings_euvm;

SELECT
  *
  --
  INTO public.qa_parkings_euvm
FROM
  data.euvm_qa_voronoi;

-- Transform geometry to Web Mercator and set SRID
ALTER TABLE public.qa_parkings_euvm
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_Transform (geom, 3857);

-- Add our calculated columns
ALTER TABLE public.qa_parkings_euvm
ADD COLUMN IF NOT EXISTS count_current INTEGER,
ADD COLUMN IF NOT EXISTS relative NUMERIC,
ADD COLUMN IF NOT EXISTS previous_relative NUMERIC,
ADD COLUMN IF NOT EXISTS difference INTEGER;

-- Restore previous values where we have them
UPDATE public.qa_parkings_euvm pv
SET
  previous_relative = tpv.previous_relative
FROM
  temp_previous_values tpv
WHERE
  pv.id = tpv.id;

-- Calculate current counts
WITH
  counts AS (
    SELECT
      v.id as id,
      COUNT(p.*) AS count_current
    FROM
      public.qa_parkings_euvm v
      LEFT JOIN parkings_quantized p ON ST_Contains (v.geom, p.geom)
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

-- Calculate difference and relative
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
