DO $$ BEGIN RAISE NOTICE 'START calculating parking corners at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_separate_parking_corners;

SELECT
  (get_polygon_corners (geom, 140)).*,
  osm_id INTO _parking_separate_parking_corners
FROM
  _parking_separate_parking_areas;

-- MISC
ALTER TABLE _parking_separate_parking_corners
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX separate_parking_corners_idx ON _parking_separate_parking_corners USING BTREE (osm_id);
