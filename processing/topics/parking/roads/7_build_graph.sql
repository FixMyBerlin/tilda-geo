DO $$ BEGIN RAISE NOTICE 'START building graph at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_edges;

SELECT
  (segmentize_way_to_edges (osm_id)).*
  --
  INTO _parking_edges
FROM
  _parking_roads
WHERE
  NOT is_driveway;

ALTER TABLE _parking_edges
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
