DROP FUNCTION IF EXISTS project_to_line;

-- this function projects all points of project_from to the line
-- returns the substring that is spanned by the projected points
CREATE FUNCTION project_to_line (project_from geometry, project_onto geometry) RETURNS geometry AS $$
DECLARE
  rec RECORD;
  point_on_line geometry;
  rel_position double precision;
  substring_start double precision := 1.0;
  substring_end double precision := 0.0;
BEGIN
  -- project all points of the input geometry to the line
  -- for each projected point, get relative position on the line and keep track of the min and max
  FOR rec IN SELECT * FROM ST_DumpPoints(project_from)
  LOOP
    point_on_line := ST_ClosestPoint(project_onto, rec.geom);
    rel_position := ST_LineLocatePoint(project_onto, point_on_line);
    substring_start := LEAST(substring_start, rel_position);
    substring_end := GREATEST(substring_end, rel_position);
  END LOOP;

  -- extract the substring of the line between the min and max relative position
  RETURN ST_LineSubstring(project_onto, substring_start, substring_end);
END;
$$ LANGUAGE plpgsql STABLE;
