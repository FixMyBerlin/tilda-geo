DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp(); END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_areas_projected CASCADE;

-- CREATE "areas projected"
SELECT
  osm_type,
  osm_id,
  id,
  tags,
  meta,
  -- @var "2": Max distance (radius) (Meter) for snapping
  -- @var "6": Max number of kerbs that gets snapped to
  (project_to_k_closest_kerbs (geom, 2, 6)).*
  --
  INTO _parking_separate_parking_areas_projected
FROM
  _parking_separate_parking_areas;

DELETE FROM _parking_separate_parking_areas_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_separate_parking_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_areas_projected_geom_idx ON _parking_separate_parking_areas_projected USING GIST (geom);
