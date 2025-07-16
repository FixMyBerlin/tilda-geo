SELECT
  c.id,
  c.osm_id,
  project_to_line (c.geom, cl.geom) AS geom INTO TEMP crossings_projected
FROM
  _parking_crossings c
  JOIN _parking_node_crossing_mapping ncm ON c.osm_id = ncm.node_id
  JOIN _parking_crossing_lines cl ON cl.osm_id = crossing_id;

UPDATE _parking_crossings pc
SET
  geom = cp.geom,
  tags = tags || '{"geometry_source": "original"}'::JSONB
FROM
  crossings_projected cp
WHERE
  pc.id = cp.id;
