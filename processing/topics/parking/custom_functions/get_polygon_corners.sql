-- WHAT IT DOES:
-- Helper function to calculate the angle at a specific point index on a polygon ring.
-- * Gets three consecutive points (previous, current, next) and calculates angle at middle point
-- * Handles wrapping: if idx=1, uses last point as previous; if idx=last, wraps to first point
-- * Returns angle in radians (0 to pi), adjusts if angle > pi
-- USED IN: Only used in this file.
DROP FUNCTION IF EXISTS tangent_on_ring (geometry, integer);

CREATE FUNCTION tangent_on_ring (ring geometry, idx integer) RETURNS double precision AS $$
DECLARE
  n INT := ST_NumPoints(ring);
  a geometry;
  b geometry;
  c geometry;
  angle double precision;
BEGIN
  a := ST_PointN(ring, CASE WHEN idx > 1 THEN idx - 1 ELSE n - 1 END);
  b := ST_PointN(ring, idx);
  c := ST_PointN(ring, idx % n + 1);

  angle := ST_Angle(a, b, c);
  IF angle > pi() THEN
    angle := 2 * pi() - angle;
  END IF;

  RETURN angle;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- WHAT IT DOES:
-- Find corner points of a polygon based on angle sharpness.
-- * Calculates angle at each point on polygon boundary using the `tangent_on_ring` helper from above
-- * Returns corners sorted by angle (sharpest first), optionally filtered by max_angle_degrees
-- * Can limit to n_corners (or NULL for all corners)
-- * Excludes last point (same as first point in closed polygon)
-- USED IN: `parking_area_to_line.sql` (find corners of parking area convex hull to create edges)
DROP FUNCTION IF EXISTS get_polygon_corners;

CREATE FUNCTION get_polygon_corners (
  poly geometry,
  n_corners integer,
  max_angle_degrees double precision
) RETURNS TABLE (
  corner_idx BIGINT,
  geom geometry,
  angle double precision
) AS $$
DECLARE
  ring geometry := ST_ExteriorRing(poly);
  n INT := ST_NumPoints(ring);
BEGIN
  IF n IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
  -- Calculate angle at each point and filter/sort corners.
  WITH corners AS (
    SELECT
      ST_PointN(ring, idx) AS geom,
      tangent_on_ring(ring, idx) AS angle,
      idx
    -- Last and first point are the same, so we can ignore the last one.
    FROM generate_series(1, n-1) AS idx
    WHERE max_angle_degrees IS NULL OR degrees(tangent_on_ring(ring, idx)) < max_angle_degrees
    ORDER BY tangent_on_ring(ring, idx) ASC
    LIMIT n_corners )
  -- Return corners with sequential index based on original polygon order.
  SELECT ROW_NUMBER() OVER (ORDER BY c.idx) AS corner_idx, c.geom, c.angle
  FROM corners c;

  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
