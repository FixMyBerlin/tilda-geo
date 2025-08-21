DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_obstacle_areas_projected CASCADE;

-- CREATE "areas projected"
SELECT
  a.id || '-' || pk.kerb_id AS id,
  a.osm_type,
  a.osm_id,
  a.id as source_id,
  a.tags,
  a.meta,
  pk.* INTO _parking_obstacle_areas_projected
FROM
  _parking_obstacle_areas a
  CROSS JOIN LATERAL project_to_k_closest_kerbs (a.geom, tolerance := 2, k := 6) AS pk;

DELETE FROM _parking_obstacle_areas_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- MISC
ALTER TABLE _parking_obstacle_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_areas_projected_geom_idx ON _parking_obstacle_areas_projected USING gist (geom);
