DROP TABLE IF EXISTS _parking_separate_parking_normals;

SELECT
  a.geom AS start_point,
  b.geom AS end_point,
  a.osm_id,
  get_pair_normal (a.geom, b.geom, 0.5) AS geom INTO _parking_separate_parking_normals
FROM
  _parking_separate_parking_corners a
  JOIN _parking_separate_parking_corners b ON a.osm_id = b.osm_id
  AND b.corner_idx = a.corner_idx + 1;

-- MISC
ALTER TABLE _parking_separate_parking_normals
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX separate_parking_normals_idx ON _parking_separate_parking_normals USING BTREE (osm_id);

DO $$
BEGIN
  RAISE NOTICE 'Finished calculating parking normals at %', clock_timestamp();
END
$$;
