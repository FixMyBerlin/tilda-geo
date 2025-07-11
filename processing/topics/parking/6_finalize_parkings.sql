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

INSERT INTO
  parkings_no (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  osm_type,
  osm_id,
  id,
  tags,
  meta,
  geom,
  0
FROM
  _parking_road_parkings p
WHERE
  p.tags ->> 'parking' IN (
    'no',
    'separate',
    'not_expected',
    'missing',
    'separate'
  );

DROP TABLE IF EXISTS parkings_sum_points;

SELECT
  ROW_NUMBER() OVER () AS id,
  tags,
  generate_parkings_sum_points (geom, (tags ->> 'capacity')::INTEGER) as geom INTO parkings_sum_points
FROM
  parkings;

-- MISC
DROP INDEX IF EXISTS parkings_geom_idx;

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);

ALTER TABLE parkings_sum_points
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DROP INDEX IF EXISTS parkings_sum_points_geom_idx;

CREATE INDEX parkings_sum_points_geom_idx ON parkings_sum_points USING GIST (geom);
