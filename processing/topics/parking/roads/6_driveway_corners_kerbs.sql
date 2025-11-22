-- WHAT IT DOES:
-- Find kerb segments at driveway corner intersections (for rectangle cutout creation).
-- * Problem: Even after 5_trim_kerbs.sql, driveways still need a intersection corner cutout.
--   Otherwise we would place parking spaces on the sidewalk and right at the corner of the driveway.
-- * Solution: Project intersection corners to nearby driveway kerbs to get kerb segments that will be buffered into rectangles
--   - Projects corner point (4m buffer) onto driveway kerb line using `tilda_project_to_k_closest_kerbs`
--   - Returns kerb segment (linestring) parallel to driveway (not road) - follows driveway kerb direction
--   - Used in `cutouts/1_insert_cutouts.sql`: buffered with 0.01m and 'endcap=flat' to create rectangle cutouts
-- * Filter: only corners with both driveway and road, only driveway kerbs with parking
-- EXAMPLE: https://viewer.tilda-geo.de/?map=21.4/52.4792856/13.443242&source=Staging&search=cut&layers=_parking_intersection_corners,_parking_kerbs,_parking_driveway_corner_kerbs,parkings_cutouts => Click right on the driveway kerb on the sidewalk; its a tiny cutout area `category=driveway_corner_kerb`
-- INPUT: `_parking_intersection_corners` (point), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_driveway_corner_kerbs` (linestring) - driveway kerb segments used for cutout rectangles
--
DO $$ BEGIN RAISE NOTICE 'START finding driveway corner kerbs at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_driveway_corner_kerbs;

CREATE TABLE _parking_driveway_corner_kerbs AS
SELECT
  c.id || '-' || pk.kerb_id AS id,
  c.id AS source_id,
  pk.*
FROM
  _parking_intersection_corners c
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (ST_Buffer (c.geom, 4), tolerance := 0, k := 4) AS pk
WHERE
  c.has_driveway
  AND c.has_road
  AND pk.kerb_is_driveway
  AND pk.kerb_has_parking;

DROP INDEX IF EXISTS _parking_driveway_corner_kerbs_id_idx;

CREATE UNIQUE INDEX ON _parking_driveway_corner_kerbs (id);

ALTER TABLE _parking_driveway_corner_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
