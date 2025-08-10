DO $$ BEGIN RAISE NOTICE 'START qa parking euvm voronoi at %', clock_timestamp(); END $$;

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm (
  id SERIAL PRIMARY KEY,
  geom geometry (POINT, 4326),
  count_reference INTEGER,
  count_current INTEGER,
  difference INTEGER,
  previous_relative NUMERIC,
  relative NUMERIC
);

-- Backup the old values by renaming the table
DROP TABLE IF EXISTS qa_parkings_euvm_old;

ALTER TABLE public.qa_parkings_euvm
RENAME TO qa_parkings_euvm_old;

-- Recreate the table by copying the euvm voronoi data
SELECT
  * INTO public.qa_parkings_euvm
FROM
  data.euvm_qa_voronoi;

-- Transform geometry to Web Mercator and set SRID
ALTER TABLE public.qa_parkings_euvm
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_Transform (geom, 3857);

ALTER TABLE public.qa_parkings_euvm
ADD COLUMN count_current INTEGER,
ADD COLUMN difference INTEGER,
ADD COLUMN relative NUMERIC,
ADD COLUMN previous_relative NUMERIC;

-- Count our parkings for each voronoi polygon
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

-- Calculate the difference and relative columns
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

-- Update the previous_relative column with the old values
UPDATE public.qa_parkings_euvm
SET
  previous_relative = old.relative
FROM
  public.qa_parkings_euvm_old old
WHERE
  public.qa_parkings_euvm.id = old.id;

DROP TABLE IF EXISTS public.qa_parkings_euvm_old;
