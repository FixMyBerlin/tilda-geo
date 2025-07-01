INSERT INTO
  parkings (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  CASE
    WHEN pm.tags ->> 'capacity' IS NOT NULL THEN pm.tags || '{"capacity_source": "tag", "capacity_confidence": "high"}'::JSONB
    ELSE pm.tags || jsonb_build_object(
      'capacity',
      estimated_capacity,
      'capacity_source',
      'estimated',
      'capacity_confidence',
      'medium'
    )
  END,
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

DROP TABLE IF EXISTS parkings_dumped;

SELECT
  ROW_NUMBER() OVER () AS id,
  tags,
  dump_parkings (geom, (tags ->> 'capacity')::INTEGER) as geom INTO parkings_dumped
FROM
  parkings;

-- MISC
DROP INDEX IF EXISTS parkings_geom_idx;

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);

ALTER TABLE parkings_dumped
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DROP INDEX IF EXISTS parkings_dumped_geom_idx;

CREATE INDEX parkings_dumped_geom_idx ON parkings_dumped USING GIST (geom);
