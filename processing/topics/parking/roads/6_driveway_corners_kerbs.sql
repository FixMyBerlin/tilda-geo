DO $$ BEGIN RAISE NOTICE 'START finding driveway corner kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_driveway_corner_kerbs;

SELECT
  c.id || '-' || pk.kerb_id AS id,
  c.id AS source_id,
  pk.*
  --
  INTO _parking_driveway_corner_kerbs
FROM
  _parking_intersection_corners c
  CROSS JOIN LATERAL project_to_k_closest_kerbs (ST_Buffer (c.geom, 4), tolerance := 0, k := 4) AS pk
WHERE
  c.has_driveway
  AND c.has_road
  AND pk.kerb_is_driveway
  AND pk.kerb_has_parking;

DROP INDEX IF EXISTS _parking_driveway_corner_kerbs_id_idx;

CREATE UNIQUE INDEX ON _parking_driveway_corner_kerbs (id);

ALTER TABLE _parking_driveway_corner_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
