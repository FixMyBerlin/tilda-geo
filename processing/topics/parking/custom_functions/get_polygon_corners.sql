CREATE OR REPLACE FUNCTION get_polygon_corners (poly geometry, max_angle_degrees float) RETURNS TABLE (
  corner_idx integer,
  geom geometry,
  angle double precision
) AS $$
DECLARE
  ring geometry := ST_ExteriorRing(ST_ForceRHR(poly));
  n INT := ST_NumPoints(ring);
  i INT;
  a geometry;
  b geometry;
  c geometry;
BEGIN
  corner_idx := 1;
  FOR i IN 1..n LOOP
    -- 1 and n are the same point so we have to skip them at the boundary cases
    a := ST_PointN(ring, CASE WHEN i > 1 THEN i - 1 ELSE n - 1 END);
    b := ST_PointN(ring, i);
    c := ST_PointN(ring, CASE WHEN i < n THEN i + 1 ELSE 2 END);

    angle := ST_Angle(a, b, c);

    IF angle > pi() THEN
      angle := 2 * pi() - angle;
    END IF;

    angle := degrees(angle);

    IF angle < max_angle_degrees THEN
      geom := b;
      RETURN NEXT;
      corner_idx := corner_idx + 1;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
