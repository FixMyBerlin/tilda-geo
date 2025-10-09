-- this function projects a given geometry to the k closest kerbs
-- the parameter tolerance define the maximum distance to the closest kerb
DROP FUNCTION IF EXISTS project_to_k_closest_kerbs;

CREATE FUNCTION project_to_k_closest_kerbs (
  input_geom geometry,
  tolerance double precision,
  k integer,
  side text DEFAULT NULL
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
BEGIN
  IF side IS NULL THEN
    SELECT  pk.side INTO project_to_k_closest_kerbs.side
      FROM _parking_kerbs pk
      WHERE has_parking AND ST_DWithin(input_geom, pk.geom, tolerance)
      ORDER BY ST_Distance(input_geom, pk.geom), pk.id
    LIMIT 1;
  END IF;

  FOR kerb IN
    SELECT  pk.id, pk.osm_type, pk.osm_id, pk.side, pk.has_parking, pk.is_driveway, pk.geom, pk.tags, ST_Distance(input_geom, pk.geom) AS projected_distance
    FROM _parking_kerbs pk
    WHERE has_parking AND ST_DWithin(input_geom, pk.geom, tolerance)
    AND pk.side = project_to_k_closest_kerbs.side
    ORDER BY ST_Distance(input_geom, pk.geom), pk.id
    LIMIT k
  LOOP
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
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql STABLE;
