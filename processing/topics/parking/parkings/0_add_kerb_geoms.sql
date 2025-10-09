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
