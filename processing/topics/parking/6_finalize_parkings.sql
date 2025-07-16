SELECT
  id INTO TEMP TABLE _to_discard
FROM
  _parking_parkings_merged p
WHERE
  p.tags ->> 'parking' IN (
    'no',
    'separate',
    'not_expected',
    'missing',
    'separate'
  );

CREATE INDEX _to_discard_id_idx ON _to_discard USING btree (id);

INSERT INTO
  parkings_no (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  tags || '{"reason": "parking_tag"}'::JSONB,
  '{}'::JSONB,
  geom,
  0
FROM
  _parking_parkings_merged p
WHERE
  id IN (
    SELECT
      id
    FROM
      _to_discard
  );

DELETE FROM _parking_parkings_merged
WHERE
  id IN (
    SELECT
      id
    FROM
      _to_discard
  );

INSERT INTO
  parkings_no (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  tags || '{"reason": "capacity < 1"}'::JSONB,
  '{}'::JSONB,
  geom,
  0
FROM
  _parking_discarded;

INSERT INTO
  parkings (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  tags || jsonb_build_object('length', length),
  '{}'::jsonb,
  geom,
  0
FROM
  _parking_parkings_merged pm;

UPDATE parkings
SET
  geom = ST_Reverse (geom)
WHERE
  tags ->> 'side' = 'left';

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
  ST_SetSRID (geom, 5243) as geom INTO parkings_quantized
FROM
  sum_points;

INSERT INTO
  parkings_separate (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  *,
  0
FROM
  _parking_separate_parking_areas;

-- MISC
ALTER TABLE parkings
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_Transform (geom, 3857);

DROP INDEX IF EXISTS parkings_geom_idx;

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

ALTER TABLE parkings_no
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_Transform (geom, 3857);

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);

ALTER TABLE parkings_separate
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_Transform (geom, 3857);

DROP INDEX IF EXISTS parkings_separate_geom_idx;

CREATE INDEX parkings_separate_geom_idx ON parkings_separate USING GIST (geom);

ALTER TABLE parkings_quantized
ALTER COLUMN geom TYPE geometry (Geometry, 3857) USING ST_Transform (geom, 3857);

DROP INDEX IF EXISTS parkings_quantized_geom_idx;

CREATE INDEX parkings_quantized_geom_idx ON parkings_quantized USING GIST (geom);
