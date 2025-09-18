CREATE OR REPLACE FUNCTION osm_ref (osm_type text, osm_id bigint) RETURNS text AS $$
BEGIN
  IF osm_type = 'N' THEN
    RETURN 'node/' || osm_id;
  ELSIF osm_type = 'W' THEN
    RETURN 'way/' || osm_id;
  ELSIF osm_type = 'R' THEN
    RETURN 'relation/' || osm_id;
  ELSE
    RAISE EXCEPTION 'Unsupported osm_type: %', osm_type;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
