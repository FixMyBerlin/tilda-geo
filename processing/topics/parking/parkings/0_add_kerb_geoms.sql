DO $$ BEGIN RAISE NOTICE 'START adding kerb geometries at %', clock_timestamp(); END $$;

ALTER TABLE _parking_parkings1_road
ADD COLUMN geom geometry (Geometry, 5243);

ALTER TABLE _parking_parkings1_road
ADD COLUMN street_name text;

UPDATE _parking_parkings1_road as p
SET
  geom = k.geom,
  street_name = k.street_name
FROM
  _parking_kerbs as k
WHERE
  p.osm_id = k.osm_id
  AND p.side = k.side;

CREATE INDEX parking_parkings1_road_geom_idx ON _parking_parkings1_road USING GIST (geom);
