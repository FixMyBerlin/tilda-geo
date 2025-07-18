DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp(); END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_points_projected CASCADE;

-- INSERT
SELECT
  osm_type,
  osm_id,
  id,
  car_space_x,
  padding,
  tags,
  meta,
  (tags ->> 'capacity')::NUMERIC AS capacity,
  (project_to_k_closest_kerbs (geom, 5, 1)).*
  -- TODO: the tollerance here is too large, we need to decrease it once we have better offset values for the kerbs
  INTO TEMP _parking_separate_parking_points_snapped
FROM
  _parking_separate_parking_points pp
  JOIN _parking_orientation_constants oc ON oc.orientation = COALESCE(pp.tags ->> 'orientation', 'parallel');

-- CLEANUP
DELETE FROM _parking_separate_parking_points_snapped
WHERE
  geom IS NULL;

SELECT
  osm_type,
  osm_id,
  kerb_side as side,
  tags,
  meta,
  id,
  (
    project_to_k_closest_kerbs (
      ST_Buffer (
        geom,
        (car_space_x * capacity + padding * (capacity - 1)) / 2
      ),
      5,
      1
    )
  ).* AS geom INTO _parking_separate_parking_points_projected
FROM
  _parking_separate_parking_points_snapped;

DELETE FROM _parking_separate_parking_points_projected
WHERE
  kerb_side <> side;

-- MISC
ALTER TABLE _parking_separate_parking_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_points_projected_geom_idx ON _parking_separate_parking_points_projected USING gist (geom);
