-- WHAT IT DOES:
-- Project obstacle areas to kerb lines (convert polygon to linestring).
-- - Two branches based on whether the obstacle lies within a separate parking area:
--   * If obstacle does NOT lie within separate parking area:
--     project to regular kerbs using `tilda_project_to_k_closest_kerbs` (finds up to 6 closest kerbs)
--   * If obstacle DOES lie within separate parking area:
--     project to separate parking area kerbs using `tilda_project_to_line` (direct projection)
-- - Cleanup: remove furthest projection if multiple, remove invalid/short geometries
-- INPUT: `_parking_obstacle_areas` (polygon), `_parking_separate_parking_areas` (polygon), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_obstacle_areas_projected` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_areas_projected CASCADE;

ALTER TABLE _parking_obstacle_areas
ADD COLUMN separate_parking_area_id TEXT;

-- For the cutouts in `cutouts/1_insert_cutouts.sql` and `2_cutout_separate_parkings.sql` we need to treat
-- obstacles that lie within separate parking areas and those that don't differently.
UPDATE _parking_obstacle_areas AS a
SET
  separate_parking_area_id = spa.id
FROM
  _parking_separate_parking_areas AS spa
WHERE
  ST_Intersects (a.geom, spa.geom);

-- If obstacle does NOT lie within separate parking area:
-- Project to regular kerbs using `tilda_project_to_k_closest_kerbs` (finds up to 6 closest kerbs within 2m)
CREATE TABLE _parking_obstacle_areas_projected AS
SELECT
  a.id || '-' || pk.kerb_id AS id,
  a.osm_type,
  a.osm_id,
  a.id as source_id,
  a.tags || jsonb_build_object(
    /* sql-formatter-disable */
    'tag_sources', a.id,
    'geom_sources', pk.kerb_id,
    'separate_parking', FALSE
    /* sql-formatter-enable */
  ) as tags,
  a.meta,
  pk.*
FROM
  _parking_obstacle_areas a
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (a.geom, tolerance := 2, k := 6) AS pk
WHERE
  a.separate_parking_area_id IS NULL;

-- If obstacle DOES lie within separate parking area:
-- Project directly onto separate parking area kerb line using `tilda_project_to_line`.
-- The kerb line is created via `tilda_parking_area_to_line` in `_parking_separate_parking_areas_projected`.
INSERT INTO
  _parking_obstacle_areas_projected (
    id,
    osm_type,
    osm_id,
    source_id,
    tags,
    meta,
    geom,
    kerb_id,
    kerb_osm_type,
    kerb_osm_id,
    kerb_side,
    kerb_tags,
    kerb_has_parking,
    kerb_is_driveway,
    kerb_distance
  )
SELECT
  a.id || '-' || spap.id AS id,
  a.osm_type,
  a.osm_id,
  a.id,
  a.tags || jsonb_build_object(
    /* sql-formatter-disable */
    'tag_sources', a.id,
    'geom_sources', spap.id,
    'separate_parking', TRUE
    /* sql-formatter-enable */
  ) as tags,
  a.meta,
  tilda_project_to_line (project_from := a.geom, project_onto := spap.geom),
  spap.id as kerb_id,
  spap.osm_type,
  spap.osm_id,
  spap.side,
  spap.tags,
  TRUE,
  FALSE,
  ST_Distance (a.geom, spap.geom)
FROM
  _parking_obstacle_areas a
  JOIN _parking_separate_parking_areas_projected spap ON a.separate_parking_area_id = spap.source_id;

-- Filter: remove furthest projection if multiple
-- `tilda_project_to_k_closest_kerbs` can return up to 6 projections (k := 6) for each obstacle area.
-- When an obstacle area has multiple projections, keep only the closest ones (remove furthest).
DELETE FROM _parking_obstacle_areas_projected
WHERE
  (source_id, kerb_distance) IN (
    SELECT
      source_id,
      MAX(kerb_distance)
    FROM
      _parking_obstacle_areas_projected
    GROUP BY
      source_id
    HAVING
      count(*) > 1
  );

-- Cleanup: remove invalid geometries
-- Remove NULL geometries, non-LineString types, and very short lines (< 0.3m) that are likely projection errors.
DELETE FROM _parking_obstacle_areas_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- MISC
ALTER TABLE _parking_obstacle_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_areas_projected_geom_idx ON _parking_obstacle_areas_projected USING gist (geom);
