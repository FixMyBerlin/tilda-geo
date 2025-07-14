DO $$ BEGIN RAISE NOTICE 'START calculating parking corners and normals at %', clock_timestamp(); END $$;

SELECT
  (get_polygon_corners (geom, 140)).*,
  osm_id INTO TEMP separate_parking_corners
FROM
  _parking_separate_parking_areas;

CREATE INDEX separate_parking_corners_idx ON separate_parking_corners USING BTREE (osm_id);

DROP TABLE IF EXISTS _parking_separate_parking_normals;

SELECT
  a.geom AS start_point,
  b.geom AS end_point,
  a.corner_idx AS start_idx,
  b.corner_idx AS end_idx,
  a.osm_id,
  get_pair_normal (a.geom, b.geom, 6.0) AS geom INTO _parking_separate_parking_normals
FROM
  separate_parking_corners a
  JOIN separate_parking_corners b ON a.osm_id = b.osm_id
  AND b.corner_idx = a.corner_idx + 1;

-- MISC
ALTER TABLE _parking_separate_parking_normals
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX separate_parking_normals_idx ON _parking_separate_parking_normals USING BTREE (osm_id);
