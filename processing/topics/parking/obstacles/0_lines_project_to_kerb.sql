-- PREPARE
DROP TABLE IF EXISTS _parking_obstacle_lines_projected CASCADE;

-- CREATE "lines projected"
SELECT
  osm_type,
  osm_id,
  id,
  tags,
  meta,
  -- @var "2": Max distance (radius) (Meter) for snapping
  -- @var "6": Max number of kerbs that gets snapped to
  project_to_k_closest_kerbs (geom, 2, 6) as geom
  --
  INTO _parking_obstacle_lines_projected
FROM
  _parking_obstacle_lines;

DELETE FROM _parking_obstacle_lines_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_obstacle_lines_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX idx_parking_obstacle_lines_projected_geom ON _parking_obstacle_lines_projected USING gist (geom);

DO $$
BEGIN
  RAISE NOTICE 'Finished projecting obstacle lines at %', clock_timestamp();
END
$$;
