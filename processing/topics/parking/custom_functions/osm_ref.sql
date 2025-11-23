-- WHAT IT DOES:
-- Generate OSM reference string from OSM type and ID.
-- * Converts (osm_type, osm_id) to standard OSM reference format: "node/123", "way/456", "relation/789"
-- USED IN: cutouts (create source references for cutout geometries)
CREATE OR REPLACE FUNCTION tilda_osm_ref (osm_type text, osm_id bigint) RETURNS text AS $$
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
