-- this function projects a given geometry to the k closest kerbs
-- the parameter tolerance define the maximum distance to the closest kerb
DROP FUNCTION IF EXISTS project_to_k_closest_kerbs;

CREATE FUNCTION project_to_k_closest_kerbs (
  input_geom geometry,
  tolerance double precision,
  k integer
) RETURNS TABLE (
  kerb_id text,
  kerb_osm_type text,
  kerb_osm_id bigint,
  kerb_side text,
  kerb_tags jsonb,
  kerb_has_parking boolean,
  kerb_is_driveway boolean,
  kerb_distance double precision,
  geom geometry
) AS $$
DECLARE
  kerb RECORD;
  projected_geom geometry;
  closest_kerb_side text := NULL;
BEGIN
  SELECT  pk.side INTO closest_kerb_side
    FROM _parking_kerbs pk
    WHERE has_parking AND ST_DWithin(input_geom, pk.geom, tolerance)
    ORDER BY ST_Distance(input_geom, pk.geom)
  LIMIT 1;

  FOR kerb IN
    SELECT  pk.id, pk.osm_type, pk.osm_id, pk.side, pk.has_parking, pk.is_driveway, pk.geom, pk.tags, ST_Distance(input_geom, pk.geom) AS projected_distance
    FROM _parking_kerbs pk
    WHERE has_parking AND ST_DWithin(input_geom, pk.geom, tolerance)
    AND pk.side = closest_kerb_side
    ORDER BY ST_Distance(input_geom, pk.geom)
    LIMIT k
  LOOP
    IF kerb.side = closest_kerb_side THEN
      kerb_id := kerb.id;
      kerb_osm_type := kerb.osm_type;
      kerb_osm_id := kerb.osm_id;
      kerb_side := kerb.side;
      kerb_tags := kerb.tags;
      kerb_has_parking := kerb.has_parking;
      kerb_is_driveway := kerb.is_driveway;
      geom := project_to_line(project_from:=input_geom, project_onto:=kerb.geom);
      kerb_distance := kerb.projected_distance;
      RETURN NEXT;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;
