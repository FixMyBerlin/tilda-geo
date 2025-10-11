-- Extend crossing lines by 2 meters to ensure intersection with kerbs
-- This handles cases where crossings are cut near centerlines and don't intersect with moved kerbs
UPDATE _parking_crossing_lines
SET
  geom = extend_crossing_for_kerb_intersection (geom, extension_length := 2.0)
WHERE
  ST_GeometryType (geom) = 'ST_LineString';

-- we project our generated crossing geometries on to the extended crossing lines
SELECT
  c.id,
  c.osm_id,
  ncm.way_id as way_id,
  tilda_project_to_line (c.geom, cl.geom) AS geom INTO TEMP crossings_projected
FROM
  _parking_crossings c
  JOIN _parking_node_crossing_mapping ncm ON c.osm_id = ncm.node_id
  JOIN _parking_crossing_lines cl ON cl.osm_id = ncm.way_id;

UPDATE _parking_crossings pc
SET
  way_id = cp.way_id,
  geom = cp.geom,
  tags = tags || '{"geometry_source": "original"}'::JSONB
FROM
  crossings_projected cp
WHERE
  pc.id = cp.id
  AND ST_GeometryType (cp.geom) = 'ST_LineString'
  AND length < ST_Length (cp.geom);

UPDATE _parking_crossings
SET
  geom = ST_LineSubstring (geom, 0, length / ST_Length (geom));
