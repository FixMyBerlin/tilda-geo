DO $$ BEGIN RAISE NOTICE 'START locating obstacle points on kerb at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_crossing_points_located;

CREATE TABLE _parking_crossing_points_located AS
SELECT
  -- A way can pass the same node more than once (e.g. a driveway loop that starts and ends at the crossing node).
  -- Each pass gets its own crossing, so we append the node index to keep the id unique in that case.
  p.id || nrm.way_id || CASE
    WHEN COUNT(*) OVER (
      PARTITION BY
        p.id,
        nrm.way_id
    ) > 1 THEN '/' || nrm.idx
    ELSE ''
  END AS id,
  p.tags ->> 'side' AS side,
  nrm.idx,
  nrm.way_id,
  p.osm_id,
  p.osm_type,
  p.tags,
  p.meta,
  p.geom
FROM
  _parking_crossing_points p
  JOIN _parking_node_road_mapping nrm ON p.osm_id = nrm.node_id;

-- MISC
ALTER TABLE _parking_crossing_points_located
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DO $$ BEGIN RAISE NOTICE 'END locating obstacle points on kerb at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
