DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp(); END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_points_projected CASCADE;

-- INSERT
SELECT
  osm_type,
  osm_id,
  id,
  tags,
  meta,
  (project_to_k_closest_kerbs (geom, 5, 1)).*
  -- TODO: the tollerance here is too large, we need to decrease it once we have better offset values for the kerbs
  INTO _parking_separate_parking_points_projected
FROM
  _parking_separate_parking_points;

-- CLEANUP
DELETE FROM _parking_separate_parking_points_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_separate_parking_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_points_projected_geom_idx ON _parking_separate_parking_points_projected USING gist (geom);
