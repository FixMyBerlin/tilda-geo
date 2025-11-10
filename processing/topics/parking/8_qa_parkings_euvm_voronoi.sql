-- WHAT IT DOES:
-- QA comparison: count parkings in voronoi polygons vs reference data.
-- * Copy reference voronoi from data.euvm_qa_voronoi
-- * Clip to Berlin boundary, filter to specific Ortsteile (temp)
-- * Count current parkings (excl private) per polygon
-- * Calculate difference and relative values
-- * Preserve previous relative from old run
-- INPUT: data.euvm_qa_voronoi (polygon), public.parkings_quantized (point)
-- OUTPUT: public.qa_parkings_euvm (polygon with counts)
--
DO $$ BEGIN RAISE NOTICE 'START qa parking euvm voronoi at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Transform parkings to SRID 5243 for accurate spatial operations
-- (5243 optimized for Germany, uses meters; needed for ST_Contains on line 105)
DROP TABLE IF EXISTS _parking_parkings_quantized;

CREATE TABLE _parking_parkings_quantized AS
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 5243) as geom
FROM
  parkings_quantized;

CREATE INDEX _parking_parkings_quantized_geom_idx ON _parking_parkings_quantized USING GIST (geom);

CREATE TABLE IF NOT EXISTS public.qa_parkings_euvm (
  id SERIAL PRIMARY KEY,
  geom geometry (Geometry, 4326), -- Polygon or MultiPolygon
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
CREATE TABLE public.qa_parkings_euvm AS
SELECT
  *
FROM
  data.euvm_qa_voronoi;

-- Clip geometries to Berlin boundary
UPDATE public.qa_parkings_euvm
SET
  geom = ST_Intersection (
    public.qa_parkings_euvm.geom,
    ST_Transform (berlin.geom, 4326)
  )
FROM
  public.boundaries berlin
WHERE
  berlin.osm_id = 62422
  AND NOT ST_Within (
    public.qa_parkings_euvm.geom,
    ST_Transform (berlin.geom, 4326)
  );

-- TEMPORARY: Filter to only include polygons that intersect with specific Ortsteile
DELETE FROM public.qa_parkings_euvm
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      public.boundaries ortsteil
    WHERE
      ortsteil.osm_id IN (
        55764, -- Friedrichshain-Kreuzberg https://www.openstreetmap.org/relation/55764
        3133648, -- Neukölln https://www.openstreetmap.org/relation/3133648
        55734, -- Steglitz-Zehlendorf https://www.openstreetmap.org/relation/55734
        158437, -- Tempelhof-Schöneberg https://www.openstreetmap.org/relation/158437
        164712 -- Marzahn-Hellersdorf https://www.openstreetmap.org/relation/164712
      )
      AND ST_Intersects (
        public.qa_parkings_euvm.geom,
        ST_Transform (ortsteil.geom, 4326)
      )
  );

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

CREATE INDEX qa_parkings_euvm_geom_idx ON public.qa_parkings_euvm USING GIST (geom);
