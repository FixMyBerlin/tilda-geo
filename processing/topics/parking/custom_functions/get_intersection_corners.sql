CREATE OR REPLACE FUNCTION get_intersection_corners (intersection_id BIGINT, max_angle_degrees INT) RETURNS TABLE (
  intersection GEOMETRY,
  has_driveway BOOLEAN,
  has_road BOOLEAN,
  kerb1_id BIGINT,
  kerb2_id BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- get the ways that are connected to the intersection
  WITH intersection_roads AS (
    SELECT way_id
    FROM _parking_node_road_mapping
    WHERE node_id = intersection_id
  ),
  -- for each pair of roads, calculate the angle between them
  -- and filter out the pairs that have too shallow angles
  road_pairs AS (
    SELECT
      intersection_angle (intersection_id, r1.way_id, r2.way_id) as angle,
      r1.way_id AS road_id1,
      r2.way_id AS road_id2
    FROM intersection_roads r1
    JOIN intersection_roads r2
      ON r1.way_id < r2.way_id -- prevent duplicates and self-joins
  ),
  -- for each pair of roads get the moved kerbs and look for intersections
  kerb_pairs AS (
    SELECT
      ST_Intersection(kerb1.geom, kerb2.geom) AS geom,
      kerb1.is_driveway OR kerb2.is_driveway as has_driveway,
      NOT kerb1.is_driveway OR NOT kerb2.is_driveway as has_road,
      kerb1.id as kerb1_id,
      kerb2.id as kerb2_id
    FROM road_pairs rp
    JOIN _parking_kerbs kerb1 ON kerb1.osm_id = rp.road_id1
    JOIN _parking_kerbs kerb2 ON kerb2.osm_id = rp.road_id2
    WHERE degrees(rp.angle) < max_angle_degrees
    AND kerb1.geom && kerb2.geom
    AND ST_Intersects(kerb1.geom, kerb2.geom)
  )
  SELECT
    *
  FROM kerb_pairs
  WHERE NOT ST_IsEmpty(geom)
    AND GeometryType(geom) = 'POINT';
END;
$$ LANGUAGE plpgsql STABLE;
