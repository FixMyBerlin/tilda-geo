DO $$ BEGIN RAISE NOTICE 'START creating labels at %', clock_timestamp(); END $$;

-- Create labels for parkings
DROP TABLE IF EXISTS parkings_labels;

SELECT
  id,
  ST_LineInterpolatePoint (geom, 0.5) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'capacity', tags ->> 'capacity',
    'area', tags ->> 'area'
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  14 AS minzoom -- visible from z14+
  --
  INTO parkings_labels
FROM
  parkings;

ALTER TABLE parkings_labels
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS parkings_labels_geom_idx;

CREATE INDEX parkings_labels_geom_idx ON parkings_labels USING GIST (geom);

-- Create separate table for parkings_separate
DROP TABLE IF EXISTS parkings_separate_labels;

SELECT
  id,
  ST_PointOnSurface (geom) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'capacity', tags ->> 'capacity',
    'area', tags ->> 'area'
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  14 AS minzoom -- visible from z14+
  --
  INTO parkings_separate_labels
FROM
  parkings_separate;

ALTER TABLE parkings_separate_labels
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS parkings_separate_labels_geom_idx;

CREATE INDEX parkings_separate_labels_geom_idx ON parkings_separate_labels USING GIST (geom);
