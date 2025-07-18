-- insert remaining parkings into the final 'parkings' table
INSERT INTO
  parkings (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  tags || jsonb_build_object('length', length),
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
  parkings_cutouts (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  osm_id,
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
      explode_parkings (geom, (tags ->> 'capacity')::INTEGER) as geom
    FROM
      parkings
  )
SELECT
  ROW_NUMBER() OVER () AS id,
  tags,
  ST_Transform (geom, 3857) as geom INTO parkings_quantized
FROM
  sum_points;

INSERT INTO
  parkings_separate (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  osm_type,
  osm_id,
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

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);

DROP INDEX IF EXISTS parkings_separate_geom_idx;

CREATE INDEX parkings_separate_geom_idx ON parkings_separate USING GIST (geom);

ALTER TABLE parkings_quantized
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_SetSRID (geom, 3857);

DROP INDEX IF EXISTS parkings_quantized_geom_idx;

CREATE INDEX parkings_quantized_geom_idx ON parkings_quantized USING GIST (geom);
