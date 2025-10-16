DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_points_projected CASCADE;

-- INSERT
SELECT
  p.id || '-' || pk.kerb_id AS id,
  p.osm_type,
  p.osm_id,
  p.id as source_id,
  p.tags || jsonb_build_object('tag_sources', p.id, 'geom_sources', pk.kerb_id) as tags,
  p.meta,
  pk.* INTO _parking_obstacle_points_projected
FROM
  _parking_obstacle_points p
  CROSS JOIN LATERAL project_to_k_closest_kerbs (p.geom, tolerance := 5, k := 1) AS pk;

-- CLEANUP
DELETE FROM _parking_obstacle_points_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_obstacle_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_points_projected_geom_idx ON _parking_obstacle_points_projected USING gist (geom);
