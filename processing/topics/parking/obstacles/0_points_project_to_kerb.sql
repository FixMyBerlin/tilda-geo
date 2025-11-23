-- WHAT IT DOES:
-- Project obstacle points to kerb lines (convert point to linestring).
-- - Two branches based on whether the obstacle lies within a separate parking area:
--   * If obstacle does NOT lie within separate parking area:
--     project to regular kerbs using `tilda_project_to_k_closest_kerbs` (finds closest kerb)
--   * If obstacle DOES lie within separate parking area:
--     project to separate parking area kerbs using `tilda_project_to_line` (direct projection)
-- - Cleanup: remove furthest projection if multiple, remove invalid geometries
-- INPUT: `_parking_obstacle_points` (point), `_parking_separate_parking_areas` (polygon), `_parking_kerbs` (linestring)
-- OUTPUT: `_parking_obstacle_points_projected` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START projecting obstacle points at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

DROP TABLE IF EXISTS _parking_obstacle_points_projected CASCADE;

ALTER TABLE _parking_obstacle_points
ADD COLUMN separate_parking_area_id TEXT;

-- For the cutouts in `cutouts/1_insert_cutouts.sql` and `2_cutout_separate_parkings.sql` we need to treat
-- obstacles that lie within separate parking areas and those that don't differently.
UPDATE _parking_obstacle_points AS p
SET
  separate_parking_area_id = spa.id
FROM
  _parking_separate_parking_areas AS spa
WHERE
  ST_Intersects (p.geom, spa.geom);

-- If obstacle does NOT lie within separate parking area:
-- Project to regular kerbs using `tilda_project_to_k_closest_kerbs` (finds closest kerb within 5m)
CREATE TABLE _parking_obstacle_points_projected AS
SELECT
  p.id || '-' || pk.kerb_id AS id,
  p.osm_type,
  p.osm_id,
  p.id as source_id,
  p.tags || jsonb_build_object(
    /* sql-formatter-disable */
    'tag_sources', p.id,
    'geom_sources', pk.kerb_id,
    'separate_parking', FALSE
    /* sql-formatter-enable */
  ) as tags,
  p.meta,
  pk.*
FROM
  _parking_obstacle_points p
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (p.geom, tolerance := 5, k := 1) AS pk
WHERE
  p.separate_parking_area_id IS NULL;

-- If obstacle DOES lie within separate parking area:
-- Project directly onto separate parking area kerb line using `tilda_project_to_line`.
-- The kerb line is created via `tilda_parking_area_to_line` in `_parking_separate_parking_areas_projected`.
INSERT INTO
  _parking_obstacle_points_projected (
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
  p.id || '-' || spap.id AS id,
  p.osm_type,
  p.osm_id,
  p.id,
  p.tags || jsonb_build_object(
    /* sql-formatter-disable */
    'tag_sources', p.id,
    'geom_sources', spap.id,
    'separate_parking', TRUE
    /* sql-formatter-enable */
  ) as tags,
  p.meta,
  tilda_project_to_line (project_from := p.geom, project_onto := spap.geom),
  spap.id as kerb_id,
  spap.osm_type,
  spap.osm_id,
  spap.side,
  spap.tags,
  TRUE,
  FALSE,
  ST_Distance (p.geom, spap.geom)
FROM
  _parking_obstacle_points p
  JOIN _parking_separate_parking_areas_projected spap ON p.separate_parking_area_id = spap.source_id;

-- Filter: remove furthest projection if multiple
-- `tilda_project_to_k_closest_kerbs` can return multiple projections (k := 1, but may still have duplicates).
-- When an obstacle point has multiple projections, keep only the closest ones (remove furthest).
DELETE FROM _parking_obstacle_points_projected
WHERE
  (source_id, kerb_distance) IN (
    SELECT
      source_id,
      MAX(kerb_distance)
    FROM
      _parking_obstacle_points_projected
    GROUP BY
      source_id
    HAVING
      count(*) > 1
  );

-- Cleanup: remove invalid geometries
-- Remove NULL geometries that are likely projection errors.
DELETE FROM _parking_obstacle_points_projected
WHERE
  geom IS NULL;

-- MISC
ALTER TABLE _parking_obstacle_points_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_obstacle_points_projected_geom_idx ON _parking_obstacle_points_projected USING gist (geom);
