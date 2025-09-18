DROP FUNCTION IF EXISTS project_to_polygon;

-- this function projects all points of project_from to the polygon boundary
-- returns the substring that is spanned by the projected points
CREATE FUNCTION project_to_polygon (project_from geometry, project_onto geometry) RETURNS geometry AS $$
DECLARE
  rec RECORD;
  point_on_line geometry;
  rel_position double precision;
  boundary_geom geometry := ST_ExteriorRing(project_onto);
  substring_start double precision;
  substring_middle double precision;
  substring_end double precision;
BEGIN
  -- project all points of the input geometry to the line
  -- for each projected point, get relative position on the line and keep track of the min
  substring_start := ST_LineLocatePoint(boundary_geom, ST_ClosestPoint(ST_StartPoint(project_from), boundary_geom));
  substring_middle := ST_LineLocatePoint(boundary_geom, ST_ClosestPoint(ST_LineInterpolatePoint(project_from, 0.5), boundary_geom));
  substring_end := ST_LineLocatePoint(boundary_geom, ST_ClosestPoint(ST_EndPoint(project_from), boundary_geom));
  RETURN ST_UNION(ARRAY[ST_LineInterpolatePoint(boundary_geom, substring_start), ST_LineInterpolatePoint(boundary_geom, substring_middle), ST_LineInterpolatePoint(boundary_geom, substring_end)]);
  IF substring_start < substring_middle AND substring_middle < substring_end THEN
    RETURN ST_LineSubstring(boundary_geom, substring_start, substring_end);
  ELSE
      RETURN ST_LineMerge(ST_Union(ARRAY[
        ST_LineSubstring(boundary_geom, substring_end, 1),
        ST_LineSubstring(boundary_geom, 0, substring_start)
      ]));
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
