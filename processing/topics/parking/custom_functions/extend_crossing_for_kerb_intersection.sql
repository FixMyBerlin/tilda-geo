-- WHAT IT DOES:
-- Extend a crossing linestring geometry in both directions to ensure intersection with kerb lines.
-- * Extends crossing by `extension_length` (default 2m) in both directions along the line's azimuth
-- * Handles cases where crossings are cut near centerlines and don't intersect with moved kerbs
-- * Returns extended linestring with original points plus extended start/end points
-- USED IN: `crossings/1_lines_project_crossings.sql` (extend crossing lines before projection)
DROP FUNCTION IF EXISTS tilda_extend_crossing_for_kerb_intersection;

CREATE FUNCTION tilda_extend_crossing_for_kerb_intersection (
  crossing_geom geometry,
  extension_length double precision DEFAULT 2.0
) RETURNS geometry AS $$
DECLARE
  start_point geometry;
  end_point geometry;
  start_azimuth double precision;
  end_azimuth double precision;
  extended_start geometry;
  extended_end geometry;
  extended_geom geometry;
BEGIN
  -- Get start and end points of the line
  start_point := ST_StartPoint(crossing_geom);
  end_point := ST_EndPoint(crossing_geom);

  -- Calculate azimuths at start and end points
  -- For start: reverse arguments to get backward direction (instead of adding PI())
  start_azimuth := ST_Azimuth(ST_PointN(crossing_geom, 2), start_point);
  end_azimuth := ST_Azimuth(ST_PointN(crossing_geom, ST_NPoints(crossing_geom) - 1), end_point);

  -- Extend in both directions
  extended_start := ST_Project(start_point, extension_length, start_azimuth);
  extended_end := ST_Project(end_point, extension_length, end_azimuth);

  -- Create the extended line by combining all points in order
  extended_geom := ST_MakeLine(ARRAY[extended_start, start_point, end_point, extended_end]);

  RETURN extended_geom;
END;
$$ LANGUAGE plpgsql STABLE;
