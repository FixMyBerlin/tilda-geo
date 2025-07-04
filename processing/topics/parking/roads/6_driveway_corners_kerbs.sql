DO $$ BEGIN RAISE NOTICE 'START finding driveway corner kerbs at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_driveway_corner_kerbs;

WITH
  intersection_kerbs AS (
    SELECT
      c.id,
      (
        project_to_k_closest_kerbs (ST_Buffer (c.geom, 4), 0, 4)
      ).*
    FROM
      _parking_intersection_corners c
    WHERE
      c.has_driveway
      AND c.has_road
  )
SELECT
  * INTO _parking_driveway_corner_kerbs
FROM
  intersection_kerbs ik
WHERE
  ik.kerb_is_driveway
  AND ik.kerb_has_parking;

DROP INDEX IF EXISTS _parking_driveway_corner_kerbs_id_idx;

CREATE INDEX ON _parking_driveway_corner_kerbs (id);

ALTER TABLE _parking_driveway_corner_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
