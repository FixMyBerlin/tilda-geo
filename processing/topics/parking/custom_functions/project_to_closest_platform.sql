-- WHAT IT DOES:
-- Project input geometry to the closest public transport platform line within tolerance distance.
-- * Finds closest platform linestring within tolerance from `_parking_public_transport` table
-- * Projects geometry to platform line using `tilda_project_to_line`, returns platform metadata and projected geometry
-- USED IN: `public_transport/0_points_project_to_kerb_and_platform.sql` (project bus stop centerlines to platform lines)
DROP FUNCTION IF EXISTS tilda_project_to_closest_platform;

CREATE FUNCTION tilda_project_to_closest_platform (input_geom geometry, tolerance double precision) RETURNS TABLE (
  platform_id text,
  platform_osm_type text,
  platform_osm_id bigint,
  platform_tags jsonb,
  platform_distance double precision,
  geom geometry
) AS $$
DECLARE
  platform RECORD;
BEGIN
  SELECT  p.id, p.osm_type, p.osm_id, p.tags, ST_Distance(input_geom, p.geom) AS projected_distance, p.geom
  INTO platform
  FROM _parking_public_transport p
  WHERE ST_GeometryType(p.geom) = 'ST_LineString'
  AND ST_DWithin(input_geom, p.geom, tolerance)
  ORDER BY ST_Distance(input_geom, p.geom), p.id
  LIMIT 1;

  IF platform.id IS NOT NULL THEN
    platform_id := platform.id;
    platform_osm_type := platform.osm_type;
    platform_osm_id := platform.osm_id;
    platform_tags := platform.tags;
    geom := tilda_project_to_line(project_from:=input_geom, project_onto:=platform.geom);
    platform_distance := platform.projected_distance;
    RETURN NEXT;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;
