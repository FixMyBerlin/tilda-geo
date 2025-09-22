DROP FUNCTION IF EXISTS get_polygon_corners;

DROP FUNCTION IF EXISTS tangent_on_ring;

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

CREATE FUNCTION get_polygon_corners (poly geometry, n_corners integer) RETURNS TABLE (
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
  WITH corners AS (
    SELECT
      ST_PointN(ring, idx) AS geom,
      tangent_on_ring(ring, idx) AS angle,
      idx
    -- last and first point are the same, so we can ignore the last one
    FROM generate_series(1, n-1) AS idx
    ORDER BY tangent_on_ring(ring, idx) ASC
    LIMIT n_corners )
  SELECT ROW_NUMBER() OVER (ORDER BY c.idx) AS corner_idx, c.geom, c.angle
  FROM corners c;

  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
