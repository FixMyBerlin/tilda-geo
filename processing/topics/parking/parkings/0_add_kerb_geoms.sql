ALTER TABLE _parking_parkings
ADD COLUMN geom geometry (Geometry, 5243);

ALTER TABLE _parking_parkings
ADD COLUMN street_name text;

UPDATE _parking_parkings as p
SET
  geom = k.geom,
  street_name = k.street_name
FROM
  _parking_kerbs as k
WHERE
  p.osm_id = k.osm_id
  AND p.side = k.side;

-- ALTER TABLE _parking_edges
-- ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
CREATE INDEX parking_parkings_geom_idx ON _parking_parkings USING GIST (geom);
