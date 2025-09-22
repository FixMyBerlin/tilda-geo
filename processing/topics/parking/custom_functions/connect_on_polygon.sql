DROP FUNCTION IF EXISTS connect_on_polygon;

-- this function returns the shortest line on the polygon boundary connecting the two input points
CREATE FUNCTION connect_on_polygon (
  start_point geometry,
  end_point geometry,
  project_onto geometry
) RETURNS geometry AS $$
DECLARE
  boundary_geom geometry := ST_ExteriorRing(ST_ForceRHR(project_onto));
  substring_start double precision;
  substring_end double precision;
BEGIN
  substring_start := ST_LineLocatePoint(boundary_geom, ST_ClosestPoint(boundary_geom, start_point));
  substring_end := ST_LineLocatePoint(boundary_geom, ST_ClosestPoint(boundary_geom, end_point));
  IF substring_start < substring_end THEN
    RETURN ST_LineSubstring(boundary_geom, substring_start, substring_end);
  ELSE
      RETURN ST_LineMerge(ST_Union(ARRAY[
        ST_LineSubstring(boundary_geom, substring_start, 1),
        ST_LineSubstring(boundary_geom, 0, substring_end)
      ]));
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
