DO $$ BEGIN RAISE NOTICE 'START creating kerb tangents %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_crossings;

-- INSERT "parking_crossings" from located crossing points
CREATE TABLE _parking_crossings AS
SELECT
  cpl.id,
  cpl.osm_id,
  cpl.side,
  Null as way_id,
  cpl.tags || '{"geometry_source": "generated"}'::jsonb AS tags,
  cpl.meta,
  -- we increase this length to be safe when we project on to the real crossing geometry
  ABS(k.offset) + 1 as length,
  tilda_estimate_road_crossing (cpl.way_id, cpl.idx, k.offset * 3) as geom
FROM
  _parking_crossing_points_located cpl
  JOIN _parking_kerbs k ON way_id = k.osm_id
  AND cpl.side = k.side;

-- MISC
ALTER TABLE _parking_crossings
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

DO $$ BEGIN RAISE NOTICE 'END creating kerb tangents at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
