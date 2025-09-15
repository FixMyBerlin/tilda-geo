-- this function projects back to separate_parkings
DROP FUNCTION IF EXISTS project_to_separate_parking_area;

CREATE FUNCTION project_to_separate_parking_area (parking_osm_id bigint) RETURNS geometry AS $$
DECLARE
  separate_parking_geom geometry;
  projected_geom geometry;
  centerline_geom geometry;
BEGIN
  SELECT ST_Union(r.geom) INTO centerline_geom from _parking_separate_parking_areas_projected sp JOIN _parking_roads r ON sp.kerb_osm_id = r.osm_id WHERE parking_osm_id=sp.osm_id;
  SELECT ST_ExteriorRing(geom) INTO separate_parking_geom FROM _parking_separate_parking_areas WHERE osm_id=parking_osm_id;
  projected_geom := project_to_line(project_from:=centerline_geom, project_onto:=separate_parking_geom);
  RETURN projected_geom;
END;
$$ LANGUAGE plpgsql STABLE;
