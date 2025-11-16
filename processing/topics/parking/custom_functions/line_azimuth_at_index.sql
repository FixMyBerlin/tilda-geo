-- WHAT IT DOES:
-- Calculate azimuth (direction angle) at a specific point index along a linestring.
-- * Returns angle in radians from point at idx to next/previous point (based on direction)
-- * Direction: 1 = forward (idx to idx+1), -1 = backward (idx-1 to idx)
-- * Handles edge cases (start/end of line)
-- USED IN: `crossings/2_points_create_crossings.sql` (calculate crossing direction perpendicular to road)
DROP FUNCTION IF EXISTS line_azimuth_at_index;

CREATE FUNCTION line_azimuth_at_index (geom geometry, idx integer, direction integer) RETURNS double precision AS $$
DECLARE
  npoints integer := ST_NPoints(geom);
  pt1 geometry;
  pt2 geometry;
BEGIN
  IF geom IS NULL OR GeometryType(geom) != 'LINESTRING' THEN
    RAISE EXCEPTION 'Input must be a LINESTRING';
  END IF;

  IF idx < 1 OR idx > npoints THEN
    RAISE EXCEPTION 'Index out of bounds: % (line has % points)', idx, npoints;
  END IF;

  IF direction = 1 THEN
    IF idx < npoints THEN
      pt1 := ST_PointN(geom, idx);
      pt2 := ST_PointN(geom, idx + 1);
    ELSE
      pt1 := ST_PointN(geom, idx - 1);
      pt2 := ST_PointN(geom, idx);
    END IF;
  ELSIF direction = -1 THEN
    IF idx > 1 THEN
      pt1 := ST_PointN(geom, idx - 1);
      pt2 := ST_PointN(geom, idx);
    ELSE
      pt1 := ST_PointN(geom, idx);
      pt2 := ST_PointN(geom, idx + 1);
    END IF;
  ELSE
    RAISE EXCEPTION 'Direction must be "1" or "-1", got: %', direction;
  END IF;

  RETURN ST_Azimuth(pt1, pt2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
