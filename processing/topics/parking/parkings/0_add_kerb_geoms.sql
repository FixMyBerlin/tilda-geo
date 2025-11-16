-- WHAT IT DOES:
-- Add kerb geometries and street names to `_parking_road_parkings` table.
-- * `_parking_road_parkings` is created in LUA (metadata only, no geometry)
-- * `_parking_kerbs` is created later from road centerlines (offset, split by side, trimmed in `roads/0_create_kerbs.sql` and `roads/5_trim_kerbs.sql`)
-- * Join parking metadata with processed kerb geometries (match by osm_id and side)
-- INPUT: `_parking_road_parkings` (without geom/street_name), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_road_parkings` (updated with geom and street_name)
--
DO $$ BEGIN RAISE NOTICE 'START adding kerb geometries at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

ALTER TABLE _parking_road_parkings
ADD COLUMN geom geometry (Geometry, 5243);

ALTER TABLE _parking_road_parkings
ADD COLUMN street_name text;

UPDATE _parking_road_parkings as p
SET
  geom = k.geom,
  street_name = k.street_name
FROM
  _parking_kerbs as k
WHERE
  p.osm_id = k.osm_id
  AND p.side = k.side;

CREATE INDEX parking_parkings_road_geom_idx ON _parking_road_parkings USING GIST (geom);
