DO $$ BEGIN RAISE NOTICE 'START finalize parkings at %', clock_timestamp(); END $$;

-- insert remaining parkings into the final 'parkings' table
INSERT INTO
  parkings (id, tags, meta, geom, minzoom)
SELECT
  id,
  jsonb_strip_nulls(
    tags || jsonb_build_object(
      'area',
      ROUND(NULLIF(tags ->> 'area', '')::NUMERIC, 2),
      'length',
      ROUND(length::NUMERIC, 2),
      'capacity',
      round_capacity ((tags ->> 'capacity')::NUMERIC),
      'original_osm_ids',
      original_osm_ids
    )
  ),
  '{}'::jsonb,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_parkings_merged pm;

-- reverse direction of left hand side kerbs
UPDATE parkings
SET
  geom = ST_Reverse (geom)
WHERE
  tags ->> 'side' = 'left';

-- insert all cutouts except "roads" into the final 'parkings_cutouts' table
INSERT INTO
  parkings_cutouts (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_cutouts pc
WHERE
  tags ->> 'source' <> 'parking_roads';

-- explode parkings into quantized points
DROP TABLE IF EXISTS parkings_quantized;

WITH
  sum_points AS (
    SELECT
      tags || '{"capacity": 1}'::JSONB as tags,
      meta,
      explode_parkings (geom, capacity := (tags ->> 'capacity')::INTEGER) as geom
    FROM
      parkings
  )
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      tags
  ) AS id,
  tags,
  meta,
  ST_Transform (geom, 3857) as geom,
  0 as minzoom
  --
  INTO parkings_quantized
FROM
  sum_points;

INSERT INTO
  parkings_separate (id, tags, meta, geom, minzoom)
SELECT
  id,
  tags,
  meta,
  ST_Transform (geom, 3857),
  0
FROM
  _parking_separate_parking_areas;

-- MISC
DROP INDEX IF EXISTS parkings_geom_idx;

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

DROP INDEX IF EXISTS parkings_id_idx;

CREATE UNIQUE INDEX parkings_id_idx ON parkings (id);

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);

DROP INDEX IF EXISTS parkings_no_id_idx;

CREATE UNIQUE INDEX parkings_no_id_idx ON parkings_no (id);

DROP INDEX IF EXISTS parkings_separate_geom_idx;

CREATE INDEX parkings_separate_geom_idx ON parkings_separate USING GIST (geom);

DROP INDEX IF EXISTS parkings_separate_id_idx;

CREATE UNIQUE INDEX parkings_separate_id_idx ON parkings_separate (id);

ALTER TABLE parkings_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS parkings_cutouts_geom_idx;

CREATE INDEX parkings_cutouts_geom_idx ON parkings_cutouts USING GIST (geom);

DROP INDEX IF EXISTS parkings_cutouts_id_idx;

CREATE UNIQUE INDEX parkings_cutouts_id_idx ON parkings_cutouts (id);

ALTER TABLE parkings_quantized
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS parkings_quantized_geom_idx;

CREATE INDEX parkings_quantized_geom_idx ON parkings_quantized USING GIST (geom);

DROP INDEX IF EXISTS parkings_quantized_id_idx;

CREATE UNIQUE INDEX parkings_quantized_id_idx ON parkings_quantized (id);
