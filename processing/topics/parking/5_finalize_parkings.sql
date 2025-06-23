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

-- MISC
CREATE INDEX parkings_geom_idx ON parkings USING GIST (geom);
