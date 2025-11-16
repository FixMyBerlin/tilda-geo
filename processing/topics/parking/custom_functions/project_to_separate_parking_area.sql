-- WHAT IT DOES:
-- Project kerb geometry back to original separate parking area polygon.
-- * Gets projected kerb line, offsets it, projects back to original polygon boundary
-- * Returns geometry projected onto separate parking area polygon
-- USED IN: (currently unused - may be legacy code)
DROP FUNCTION IF EXISTS project_to_separate_parking_area;

CREATE FUNCTION project_to_separate_parking_area (parking_osm_id bigint) RETURNS geometry AS $$
DECLARE
  projected_rec RECORD;
  kerb_geom geometry;
  separate_parking_geom geometry;
  projected_geom geometry;
  centerline_geom geometry;
BEGIN
  SELECT geom, kerb_offset INTO projected_rec FROM _parking_separate_parking_areas_projected WHERE osm_id=parking_osm_id;
  kerb_geom :=  st_offsetcurve(
      line     := projected_rec.geom,
      distance := -0.4 * projected_rec.kerb_offset
  );
  SELECT geom INTO separate_parking_geom FROM _parking_separate_parking_areas WHERE osm_id=parking_osm_id;
  projected_geom := project_to_polygon(project_from:=kerb_geom, project_onto:=separate_parking_geom);
  RETURN projected_geom;
END;
$$ LANGUAGE plpgsql STABLE;
