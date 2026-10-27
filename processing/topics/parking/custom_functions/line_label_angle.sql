-- WHAT IT DOES:
-- Text angle for a label point on a line, in degrees for MapLibre `text-rotate` (clockwise, 0 = east).
-- * Measures the line direction around `fraction` (±10 map units, or the whole line when it is shorter)
-- * `tilda_line_label_angle` returns the direction of the line in [-180, 180)
-- * `tilda_upright_label_angle` turns that into [-90, 90] so the text never stands on its head
-- * A label is "flipped" when abs(direction) > 90; then its left side is below the text, not above
-- USED IN: `10_create_labels.sql`, `11_create_edges.sql`
DROP FUNCTION IF EXISTS tilda_line_label_angle;

CREATE FUNCTION tilda_line_label_angle (geom geometry, fraction double precision) RETURNS double precision AS $$
DECLARE
  len double precision := ST_Length(geom);
  half_window double precision;
  azimuth double precision;
  angle double precision;
BEGIN
  IF len = 0 THEN
    RETURN 0;
  END IF;

  half_window := LEAST(0.5, 10 / len);
  azimuth := ST_Azimuth(
    ST_LineInterpolatePoint(geom, GREATEST(0, fraction - half_window)),
    ST_LineInterpolatePoint(geom, LEAST(1, fraction + half_window))
  );
  IF azimuth IS NULL THEN
    RETURN 0;
  END IF;

  -- Azimuth is clockwise from north; `text-rotate` is clockwise from east.
  angle := degrees(azimuth) - 90;
  IF angle >= 180 THEN
    angle := angle - 360;
  END IF;
  RETURN angle;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DROP FUNCTION IF EXISTS tilda_upright_label_angle;

CREATE FUNCTION tilda_upright_label_angle (angle double precision) RETURNS double precision AS $$
BEGIN
  IF angle > 90 THEN
    RETURN angle - 180;
  ELSIF angle < -90 THEN
    RETURN angle + 180;
  END IF;
  RETURN angle;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
