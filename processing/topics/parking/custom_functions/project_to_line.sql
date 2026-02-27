-- WHAT IT DOES:
-- Project all points of input geometry to a line and return the substring spanned by projected points.
-- * Projects each point of `project_from` to closest point on `project_onto` line
-- * Returns linestring segment from min to max relative position along the line
-- * When project_onto is closed (ring): returns the shorter of the two arcs to avoid full-ring cutouts (e.g. circular streets, see private-issues/issues/3082)
-- USED IN: obstacles projection (points/lines/areas), crossings, `tilda_project_to_k_closest_kerbs`, `tilda_project_to_closest_platform`, `tilda_parking_area_to_line`
DROP FUNCTION IF EXISTS tilda_project_to_line;

CREATE FUNCTION tilda_project_to_line (project_from geometry, project_onto geometry) RETURNS geometry AS $$
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
  -- For closed or nearly closed lines (rings): use the shorter arc so we don't return a full-ring segment (e.g. circular street cutout bug, private-issues/issues/3082).
  -- Kerbs from circular ways can be stored as open (small start-end gap); treat as closed when gap < 5% of length.
  IF (ST_IsClosed(project_onto) OR (ST_Distance(ST_StartPoint(project_onto), ST_EndPoint(project_onto)) < 0.05 * ST_Length(project_onto)))
     AND (substring_end - substring_start) > 0.5 THEN
    RETURN ST_LineMerge(
      ST_Collect(
        ST_LineSubstring(project_onto, substring_end, 1),
        ST_LineSubstring(project_onto, 0, substring_start)
      )
    );
  END IF;
  RETURN ST_LineSubstring(project_onto, substring_start, substring_end);
END;
$$ LANGUAGE plpgsql STABLE;
