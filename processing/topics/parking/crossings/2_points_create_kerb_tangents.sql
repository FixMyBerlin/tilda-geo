DO $$ BEGIN RAISE NOTICE 'START creating kerb tangents %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_kerb_tangents;

--
SELECT DISTINCT
  osm_id,
  tags,
  kerb_tangent (way_id, idx, tags ->> 'side', 1, 1) as geom
  --
  INTO _parking_kerb_tangents
FROM
  _parking_crossing_points_located;

-- MISC
ALTER TABLE _parking_kerb_tangents
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
