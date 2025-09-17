DROP FUNCTION IF EXISTS get_parking_edges (geometry, float);

CREATE FUNCTION get_parking_edges (parking_geom geometry, max_angle_degrees float) RETURNS TABLE (
  geom geometry,
  length double precision,
  hull geometry
) LANGUAGE plpgsql AS $$
DECLARE
  hull_geom geometry := ST_ConvexHull(parking_geom);
BEGIN
  RETURN QUERY
  -- get all corners of the convex hull that are sharper than max_angle_degrees
  WITH corners AS (
    SELECT * FROM get_polygon_corners(hull_geom, max_angle_degrees)
  ),
  edges AS (
    -- create lines by connecting each corner to the next
    SELECT c1.corner_idx,
           ST_MakeLine(c1.geom, COALESCE(c2.geom, first.geom)) AS geom
    FROM corners c1
    LEFT JOIN corners c2 ON c2.corner_idx = c1.corner_idx + 1
    -- get first corner for wrap around
    CROSS JOIN LATERAL (
      SELECT corners.geom FROM corners ORDER BY corner_idx LIMIT 1
    ) first
  ),
  sorted_edges AS (
    -- sort edges by length
    SELECT edges.geom,
           ST_Length(edges.geom) AS length,
           ROW_NUMBER() OVER (ORDER BY ST_Length(edges.geom) DESC) AS rn
    FROM edges
  )
  -- return the two longest edges
  SELECT sorted_edges.geom, sorted_edges.length, hull_geom
  FROM sorted_edges
  WHERE rn <= 2;
END;
$$;
