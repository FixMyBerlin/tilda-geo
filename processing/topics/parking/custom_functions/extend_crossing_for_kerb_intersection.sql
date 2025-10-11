-- this function extends a crossing geometry by `extension_length` or 2 meters in both directions
-- to ensure intersection with kerb lines when crossings are cut near centerlines
DROP FUNCTION IF EXISTS extend_crossing_for_kerb_intersection;

CREATE FUNCTION extend_crossing_for_kerb_intersection (
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
  start_azimuth := ST_Azimuth(start_point, ST_PointN(crossing_geom, 2));
  end_azimuth := ST_Azimuth(ST_PointN(crossing_geom, ST_NPoints(crossing_geom) - 1), end_point);

  -- Extend in both directions
  extended_start := ST_Project(start_point, extension_length, start_azimuth + PI());
  extended_end := ST_Project(end_point, extension_length, end_azimuth);

  -- Create the extended line by combining all points in order
  extended_geom := ST_MakeLine(ARRAY[extended_start, start_point, end_point, extended_end]);

  RETURN extended_geom;
END;
$$ LANGUAGE plpgsql STABLE;
