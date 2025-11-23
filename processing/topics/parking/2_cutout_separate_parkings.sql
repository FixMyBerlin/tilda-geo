-- WHAT IT DOES:
-- Applies cutouts (some conditional) to parking lines derived from separate parking areas and points.
-- * Processes two types of parking lines (both are linestrings representing the kerb line where parking is allowed):
--   - Parking lines from separate areas: `_parking_separate_parking_areas_projected`
--     (polygon areas converted to kerb linestrings via `tilda_parking_area_to_line` in `separate_parkings/0_areas_project_to_kerb.sql`)
--   - Parking lines from separate points: `_parking_separate_parking_points_projected`
--     (points projected onto kerb linestrings via `tilda_project_to_k_closest_kerbs` in `separate_parkings/0_points_project_to_kerb.sql`)
-- * Filters cutouts by source:
--   - Crossings and driveways: Always apply
--     (inserted directly from `_parking_crossings` and `_parking_driveways` in `cutouts/1_insert_cutouts.sql`, no spatial check needed)
--   - Obstacles: Only apply if `separate_parking = TRUE`
--     (this tag is set in `processing/topics/parking/obstacles/0_*_project_to_kerb.sql` using `ST_Intersects` to check if obstacles lie within separate parking areas)
-- * Cuts out obstacles using `ST_Difference` and `ST_Dump` to split parking lines into segments
-- * Removes `area` tags from cut parkings (no longer accurate after splitting)
-- INPUT: `_parking_separate_parking_areas_projected` (polygon), `_parking_separate_parking_points_projected` (linestring), `_parking_cutouts` (polygon)
-- OUTPUT: `_parking_parkings_cutted` (updated with cut separate parkings)
--
DO $$ BEGIN RAISE NOTICE 'START cutting out separate parkings at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- Filter cutouts for separate parkings: crossings and driveways always apply, obstacles only if they're inside a separate parking area
-- The `separate_parking` tag is set in the obstacles processing files (0_*_project_to_kerb.sql) using `ST_Intersects` to check if obstacles lie within separate parking areas
CREATE TEMP TABLE separate_parking_cutouts AS
SELECT
  *
FROM
  _parking_cutouts
WHERE
  tags ->> 'source' IN ('crossing', 'driveways')
  OR (
    tags ->> 'source' IN (
      'obstacle_points',
      'obstacle_areas',
      'obstacle_lines'
    )
    AND (tags ->> 'separate_parking')::BOOLEAN
  )
  -- DISTINCT FROM is needed to handle "null DISTING FROM 'foo'" als FALSE instead of NULL
  AND tags ->> 'category' IS DISTINCT FROM 'kerb_lowered';

CREATE INDEX separate_parking_cutouts_geom_idx ON separate_parking_cutouts USING GIST (geom);

-- INFO: Drop table happens in cutout_parkings.sql
--
-- PROCESS
INSERT INTO
  _parking_parkings_cutted (
    id,
    original_id,
    osm_id,
    tag_source,
    geom_source,
    tags,
    side,
    meta,
    geom
  )
SELECT
  COALESCE(p.id || '/' || d.path[1], p.id),
  p.id,
  p.osm_id,
  tilda_osm_ref (p.osm_type, p.osm_id) AS tag_source,
  tilda_osm_ref (p.osm_type, p.osm_id) AS geom_source,
  p.tags || '{"source": "separate_parking_areas"}'::JSONB,
  p.side,
  p.meta,
  d.geom
FROM
  _parking_separate_parking_areas_projected p,
  LATERAL ST_Dump (
    COALESCE(
      ST_Difference (
        p.geom,
        (
          SELECT
            ST_Union (c.geom)
          FROM
            separate_parking_cutouts c
          WHERE
            c.geom && p.geom
        )
      ),
      p.geom
    )
  ) AS d;

-- INFO: Drop table happens in cutout_parkings.sql
--
-- PROCESS
INSERT INTO
  _parking_parkings_cutted (
    id,
    original_id,
    osm_id,
    tag_source,
    geom_source,
    tags,
    side,
    meta,
    geom
  )
SELECT
  COALESCE(p.id || '/' || d.path[1], p.id),
  p.id,
  osm_id,
  tilda_osm_ref (p.osm_type, p.osm_id) AS tag_source,
  tilda_osm_ref (p.kerb_osm_type, p.kerb_osm_id) AS geom_source,
  p.tags || '{"source": "separate_parking_points"}'::JSONB,
  p.kerb_side,
  p.meta,
  d.geom
FROM
  _parking_separate_parking_points_projected p,
  LATERAL ST_Dump (
    COALESCE(
      ST_Difference (
        p.geom,
        (
          SELECT
            ST_Union (c.geom)
          FROM
            separate_parking_cutouts c
          WHERE
            c.geom && p.geom
        )
      ),
      p.geom
    )
  ) AS d;

-- remove area related tags from all parkings that've been cutted
UPDATE _parking_parkings_cutted
SET
  tags = tags - ARRAY['area', 'area_source', 'area_confidence']
WHERE
  id <> original_id;

-- MISC
ALTER TABLE _parking_parkings_cutted
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_parkings_cut_geom_idx ON _parking_parkings_cutted USING GIST (geom);

CREATE INDEX parking_parkings_cut_original_id_idx ON _parking_parkings_cutted (original_id);

CREATE INDEX parking_parkings_cut_street_name_idx ON _parking_parkings_cutted (street_name);
