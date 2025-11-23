-- WHAT IT DOES:
-- Project public transport stop points to kerb lines or platform lines (convert point to linestring).
-- Three branches based on stop type and side:
-- * `bus_stop_kerb`: project to kerbs using `tilda_project_to_k_closest_kerbs` (finds closest kerb within 5m)
-- * `bus_stop_centerline` (side IS NULL): project to platform lines using `tilda_project_to_closest_platform` (within 20m)
-- * `bus_stop_centerline` (side IS NOT NULL): project to kerbs using `tilda_project_to_k_closest_kerbs` (finds closest kerb on specified side within 20m)
-- * `tram_stop` (with embedded rails): project to kerbs using `tilda_project_to_k_closest_kerbs` (within 20m)
-- - Cleanup: remove invalid geometries
-- INPUT: `_parking_public_transport` (point), `_parking_kerbs` (linestring), platforms
-- OUTPUT: `_parking_public_transport_points_projected` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START projecting public transport stop points at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_public_transport_points_projected CASCADE;

-- Branch 1: bus_stop_kerb - project to kerbs
-- Those bus stop geometry already represents the right side, snap directly to kerb
CREATE TABLE _parking_public_transport_points_projected AS
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
FROM
  _parking_public_transport p
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (p.geom, tolerance := 5, k := 1) AS pk
WHERE
  ST_GeometryType (p.geom) = 'ST_Point'
  AND p.tags ->> 'category' = 'bus_stop_kerb';

-- Branch 2: bus_stop_centerline (side IS NULL) - project to platform lines
-- Bus stop on centerline without side info, snap to platform line
INSERT INTO
  _parking_public_transport_points_projected
SELECT
  pt.id || '-' || pp.platform_id AS id,
  pt.osm_type,
  pt.osm_id,
  pt.id as source_id,
  pt.tags,
  pt.meta,
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
  _parking_public_transport pt
  CROSS JOIN LATERAL tilda_project_to_closest_platform (pt.geom, tolerance := 20) AS pp
WHERE
  ST_GeometryType (pt.geom) = 'ST_Point'
  AND pt.tags ->> 'category' = 'bus_stop_centerline'
  AND pt.tags ->> 'side' IS NULL;

-- Branch 3: bus_stop_centerline (side IS NOT NULL) - project to kerbs
-- Bus stop on centerline with side info, snap to kerb on specified side
INSERT INTO
  _parking_public_transport_points_projected
SELECT
  pt.id || '-' || pk.kerb_id AS id,
  pt.osm_type,
  pt.osm_id,
  pt.id as source_id,
  pt.tags,
  pt.meta,
  jsonb_build_object(
    /* sql-formatter-disable */
    'source', 'kerb',
    'kerb_id', pk.kerb_id,
    'kerb_osm_type', pk.kerb_osm_type,
    'kerb_osm_id', pk.kerb_osm_id,
    'kerb_tags', pk.kerb_tags,
    'kerb_distance', pk.kerb_distance
    /* sql-formatter-enable */
  ) as source,
  pk.geom
FROM
  _parking_public_transport pt
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (
    pt.geom,
    tolerance := 20,
    k := 1,
    side := pt.tags ->> 'side'
  ) AS pk
WHERE
  ST_GeometryType (pt.geom) = 'ST_Point'
  AND pt.tags ->> 'category' = 'bus_stop_centerline'
  AND pt.tags ->> 'side' IS NOT NULL;

-- Branch 4: tram_stop (with embedded rails) - project to kerbs
-- Tram stop with embedded rails in road, snap to kerb
INSERT INTO
  _parking_public_transport_points_projected
SELECT
  pt.id || '-' || pk.kerb_id AS id,
  pt.osm_type,
  pt.osm_id,
  pt.id as source_id,
  pt.tags,
  pt.meta,
  jsonb_build_object(
    /* sql-formatter-disable */
    'source', 'kerb',
    'kerb_id', pk.kerb_id,
    'kerb_osm_type', pk.kerb_osm_type,
    'kerb_osm_id', pk.kerb_osm_id,
    'kerb_tags', pk.kerb_tags,
    'kerb_distance', pk.kerb_distance
    /* sql-formatter-enable */
  ) as source,
  pk.geom
FROM
  _parking_public_transport pt
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (pt.geom, tolerance := 20, k := 1) AS pk
WHERE
  ST_GeometryType (pt.geom) = 'ST_Point'
  AND pt.tags ->> 'category' = 'tram_stop'
  AND EXISTS (
    SELECT
      1
    FROM
      _parking_roads r
    WHERE
      ST_DWithin (pt.geom, r.geom, 10)
      AND r.tags ->> 'has_embedded_rails' = 'true'
  );

-- Cleanup: remove invalid geometries
-- Remove NULL geometries that are likely projection errors.
DELETE FROM _parking_public_transport_points_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_public_transport_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_public_transport_points_projected_geom_idx ON _parking_public_transport_points_projected USING gist (geom);
