DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp(); END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_points_projected CASCADE;

-- INSERT
SELECT
  pp.id || '-' || pk.kerb_id AS id,
  pp.osm_type,
  pp.osm_id,
  pp.id AS source_id,
  oc.car_space_x,
  oc.padding,
  pp.tags,
  pp.meta,
  pk.kerb_side AS side,
  pk.*,
  ST_Buffer (
    pk.geom,
    (
      (car_space_x + padding) * (pp.tags ->> 'capacity')::NUMERIC - padding
    ) / 2
  ) AS buffered_geom
  --
  INTO TEMP _parking_separate_parking_points_snapped
FROM
  _parking_separate_parking_points pp
  JOIN _parking_orientation_constants oc ON oc.orientation = COALESCE(pp.tags ->> 'orientation', 'parallel')
  CROSS JOIN LATERAL (
    SELECT
      *
    FROM
      project_to_k_closest_kerbs (pp.geom, 5, 1)
  ) pk;

-- CLEANUP
DELETE FROM _parking_separate_parking_points_snapped
WHERE
  geom IS NULL;

SELECT
  id || '-' || pk.kerb_id AS id,
  osm_type,
  osm_id,
  side,
  tags,
  meta,
  id AS source_id,
  pk.* INTO _parking_separate_parking_points_projected
FROM
  _parking_separate_parking_points_snapped
  CROSS JOIN LATERAL project_to_k_closest_kerbs (buffered_geom, 5, 1) pk;

DELETE FROM _parking_separate_parking_points_projected
WHERE
  kerb_side <> side;

-- MISC
ALTER TABLE _parking_separate_parking_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_points_projected_geom_idx ON _parking_separate_parking_points_projected USING gist (geom);
