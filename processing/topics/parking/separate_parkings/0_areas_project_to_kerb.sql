DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp(); END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_areas_projected CASCADE;

-- CREATE "areas projected"
SELECT
  a.id || '-' || pk.kerb_id AS id,
  a.osm_type,
  a.osm_id,
  a.id AS source_id,
  a.tags,
  a.meta,
  pk.* INTO _parking_separate_parking_areas_projected
FROM
  _parking_separate_parking_areas a
  CROSS JOIN LATERAL project_to_k_closest_kerbs (a.geom, tolerance := 3, k := 6) AS pk;

DELETE FROM _parking_separate_parking_areas_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- MISC
ALTER TABLE _parking_separate_parking_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_areas_projected_geom_idx ON _parking_separate_parking_areas_projected USING GIST (geom);
