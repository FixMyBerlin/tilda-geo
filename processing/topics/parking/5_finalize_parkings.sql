INSERT INTO
  parkings (osm_type, osm_id, id, tags, meta, geom, minzoom)
SELECT
  'c',
  0,
  id,
  CASE
    WHEN pm.tags ? 'capacity' THEN pm.tags
    ELSE pm.tags || jsonb_build_object(
      'capacity',
      estimated_capacity,
      'capacity_source',
      'estimated',
      'capacity_confidence',
      'low'
    )
  END,
  '{}'::jsonb,
  geom,
  0
FROM
  _parking_parkings3_merged pm;

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
  _parking_parkings1_road p
WHERE
  p.tags ->> 'parking' = 'no';

-- MISC
DROP INDEX IF EXISTS parkings_geom_idx;

CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);

DROP INDEX IF EXISTS parkings_no_geom_idx;

CREATE INDEX parkings_no_geom_idx ON parkings_no USING GIST (geom);
