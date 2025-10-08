DO $$ BEGIN RAISE NOTICE 'START projecting public transport stop points at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_public_transport_points_projected CASCADE;

-- Project bus_stop_kerb to kerbs
SELECT
  p.id || '-' || pk.kerb_id AS id,
  p.osm_type,
  p.osm_id,
  p.id as source_id,
  p.tags,
  p.meta,
  jsonb_build_object(
    /* sql-formatter-disable */
    'source','kerb',
    'kerb_id', pk.kerb_id,
    'kerb_osm_type', pk.kerb_osm_type,
    'kerb_osm_id', pk.kerb_osm_id,
    'kerb_side', pk.kerb_side,
    'kerb_tags', pk.kerb_tags,
    'kerb_has_parking', pk.kerb_has_parking,
    'kerb_is_driveway', pk.kerb_is_driveway,
    'kerb_distance', pk.kerb_distance
    /* sql-formatter-enable */
  ) as source,
  pk.geom
  --
  INTO _parking_public_transport_points_projected
FROM
  _parking_public_transport p
  CROSS JOIN LATERAL project_to_k_closest_kerbs (p.geom, tolerance := 5, k := 1) AS pk
WHERE
  ST_GeometryType (p.geom) = 'ST_Point'
  AND p.tags ->> 'category' = 'bus_stop_kerb';

-- Project bus_stop_centerline to platform lines
INSERT INTO
  _parking_public_transport_points_projected
SELECT
  p.id || '-' || pp.platform_id AS id,
  p.osm_type,
  p.osm_id,
  p.id as source_id,
  p.tags,
  p.meta,
  jsonb_build_object(
    /* sql-formatter-disable */
    'source', 'platform',
    'platform_id', pp.platform_id,
    'platform_osm_type', pp.platform_osm_type,
    'platform_osm_id', pp.platform_osm_id,
    'platform_tags', pp.platform_tags,
    'platform_distance', pp.platform_distance
    /* sql-formatter-enable */
  ) as source,
  pp.geom
FROM
  _parking_public_transport p
  CROSS JOIN LATERAL project_to_k_closest_kerbs (
    p.geom,
    tolerance := 20,
    k := 1,
    side := tags ->> 'side'
  ) AS pk
  CROSS JOIN LATERAL project_to_closest_platform (pk.geom, tolerance := 20) AS pp
WHERE
  ST_GeometryType (p.geom) = 'ST_Point'
  AND p.tags ->> 'category' = 'bus_stop_centerline';

-- CLEANUP
DELETE FROM _parking_public_transport_points_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_public_transport_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_public_transport_points_projected_geom_idx ON _parking_public_transport_points_projected USING gist (geom);
