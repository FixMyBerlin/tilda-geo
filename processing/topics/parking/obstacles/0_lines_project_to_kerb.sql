DO $$ BEGIN RAISE NOTICE 'START projecting obstacle lines at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_lines_projected CASCADE;

-- CREATE "lines projected"
SELECT
  pol.id || '-' || pk.kerb_id AS id,
  pol.osm_type,
  pol.osm_id,
  pol.id as source_id,
  pol.tags,
  pol.meta,
  pk.* INTO _parking_obstacle_lines_projected
FROM
  _parking_obstacle_lines pol
  CROSS JOIN LATERAL project_to_k_closest_kerbs (pol.geom, tolerance := 2, k := 6) AS pk;

DELETE FROM _parking_obstacle_lines_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- MISC
ALTER TABLE _parking_obstacle_lines_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_lines_projected_geom_idx ON _parking_obstacle_lines_projected USING gist (geom);
