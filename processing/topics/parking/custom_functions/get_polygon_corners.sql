DROP FUNCTION IF EXISTS get_polygon_corners;

DROP FUNCTION IF EXISTS get_angle_on_line;

CREATE FUNCTION get_angle_on_line (geom geometry, idx integer) RETURNS double precision AS $$
DECLARE
  n INT := ST_NumPoints(geom);
  a geometry;
  b geometry;
  c geometry;
  angle double precision;
BEGIN
  a := ST_PointN(geom, CASE WHEN idx > 1 THEN idx - 1 ELSE n - 1 END);
  b := ST_PointN(geom, idx);
  c := ST_PointN(geom, idx % n + 1);

  angle := ST_Angle(a, b, c);
  IF angle > pi() THEN
    angle := 2 * pi() - angle;
  END IF;

  RETURN angle;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE FUNCTION get_polygon_corners (poly geometry, n_corners integer) RETURNS TABLE (
  corner_idx BIGINT,
  geom geometry,
  angle double precision
) AS $$
DECLARE
  ring geometry := ST_ExteriorRing(ST_ForceRHR(poly));
  n INT := ST_NumPoints(ring);
BEGIN
  IF n IS NULL THEN
    RETURN;
  END IF;
  -- Single query to get the sharpest corners using get_angle_on_line, no loop
  RETURN QUERY
  WITH corners AS (
    SELECT
      ST_PointN(ring, idx) AS geom,
      get_angle_on_line(ring, idx) AS angle,
      idx
    FROM generate_series(1, n) AS idx
    ORDER BY get_angle_on_line(ring, idx) ASC
    LIMIT n_corners )
  SELECT ROW_NUMBER() OVER (ORDER BY c.idx) AS corner_idx, c.geom, c.angle
  FROM corners c;

  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
