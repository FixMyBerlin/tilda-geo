DO $$ BEGIN RAISE NOTICE 'START building graph at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_edges;

CREATE TABLE _parking_edges AS
SELECT
  (segmentize_way_to_edges (osm_id)).*
FROM
  _parking_roads
WHERE
  NOT is_driveway;

ALTER TABLE _parking_edges
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
