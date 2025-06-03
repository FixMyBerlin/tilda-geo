CREATE OR REPLACE FUNCTION trim_kerb_at_corner (
  intersection_id BIGINT,
  corner_geom GEOMETRY,
  kerb_id BIGINT
) RETURNS GEOMETRY AS $$
DECLARE
  kerb_geom GEOMETRY;
  osm_id BIGINT;
  rel_position DOUBLE PRECISION;
  idx INTEGER;
BEGIN
  -- get kerb geom and osm_id from _parking_kerbs
  SELECT k.geom, k.osm_id
  INTO kerb_geom, osm_id
  FROM _parking_kerbs k
  WHERE id = kerb_id;

  -- get relative position of the corner along kerb_geom
  rel_position := ST_LineLocatePoint(kerb_geom, corner_geom);

  -- get the idx from _parking_node_road_mapping to see whether we need to cut the kerb at the start or end
  SELECT nrm.idx
  INTO idx
  FROM _parking_node_road_mapping nrm
  WHERE way_id = osm_id AND node_id = intersection_id;

  -- return substring based on idx
  IF idx = 1 THEN
    RETURN ST_LineSubstring(kerb_geom, rel_position, 1);
  ELSE
    RETURN ST_LineSubstring(kerb_geom, 0, rel_position);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
