-- WHAT IT DOES:
-- Insert cutout areas from various sources into `_parking_cutouts` table.
-- * Intersection corners (5m buffer) - conditionally
-- * Driveway corner kerbs, driveways, crossings (buffered)
-- * Obstacle points/lines/areas (buffered)
-- * Public transport stops (buffered)
-- * Separate parking areas/points (buffered)
-- * Roads (buffered) - cleanup leftover parking pieces on roads
-- * Cutouts with `no_cutout_for_restrictions=true` are not applied to segments whose condition_category indicates a real prohibition (no_parking, no_stopping, no_standing).
-- INPUT: `_parking_intersection_corners`, `_parking_driveway_corner_kerbs`, `_parking_driveways`, `_parking_crossings`, `_parking_obstacle_points_projected`, `_parking_obstacle_areas_projected`, `_parking_obstacle_lines_projected`, `_parking_public_transport_points_projected`, `_parking_separate_parking_areas_projected`, `_parking_separate_parking_points_projected`, `_parking_roads`
-- OUTPUT: `_parking_cutouts` (polygon) - areas where parking is not allowed
--
DO $$ BEGIN RAISE NOTICE 'START inserting cutout areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- INSERT "intersection_corner" buffers (circle)
-- Conditions: only where NOT `has_driveway` AND `has_parking_road`.
-- Buffer: static value 5m (legal requirement where no parking is allowed)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  intersection_id AS osm_id,
  ST_Buffer (geom, 5) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'intersection_corner',
    'source', 'intersections',
    'radius', 5
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta
FROM
  _parking_intersection_corners
WHERE
  NOT has_driveway
  AND has_parking_road;

-- INSERT "driveway_corner_kerb" buffers (rectangles)
-- Buffer: static value 0.01m
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  kerb_osm_id,
  ST_Buffer (geom, 0.01, 'endcap=flat'),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'driveway_corner_kerb',
    'source', 'driveway_corner_kerbs',
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  '{}'::jsonb
FROM
  _parking_driveway_corner_kerbs;

-- INSERT "driveway" buffers (rectangles)
-- Buffer: tags->>'width' / 2
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    ((tags ->> 'width')::float / 2)::float,
    'endcap=flat'
  ),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'driveway',
    'source', 'driveways',
    'street:name', tags ->> 'street:name',
    'width', tags ->> 'width',
    -- 'highway', tags ->> 'highway',
    'road', tags ->> 'road',
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_driveways;

-- INSERT "crossing" buffers (rectangles)
-- Buffer: tags->>'buffer_radius'
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    (tags ->> 'buffer_radius')::float,
    'endcap=flat'
  ),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'crossing',
    'width', (tags ->> 'buffer_radius')::float,
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_crossings;

-- INSERT "obstacle_point" buffers (circle)
-- Buffer: tags->>'buffer_radius'
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'buffer_radius')::float),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_points',
    'radius', (tags ->> 'buffer_radius')::float,
    'side', kerb_side,
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_points_projected;

-- INSERT "public_transport_stops" buffers (circle) - both v2 and v3
-- Buffer: tags->>'buffer_radius'
-- Side: When the stop was projected to a kerb, the projection step sets source->>'kerb_side' (left/right).
--   All branches (bus_stop_kerb, bus_stop_centerline with/without side via platform→kerb, tram_stop) now
--   project to a kerb and set kerb_side. We use 'platform' only as fallback when source has no kerb_side.
--   This tag is used in 1_cutout_road_parkings.sql so that public transport cutouts only apply to the
--   matching street side; 'platform' does not match left/right so those cutouts are not applied to road parkings.
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'buffer_radius')::float),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'public_transport_stops',
    'radius', (tags ->> 'buffer_radius')::float,
    'side', COALESCE(source ->> 'kerb_side', 'platform'),
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_public_transport_points_projected;

-- INSERT "obstacle_area" buffers (buffered lines)
-- Buffer: static value 0.6m
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  -- `tags` passes on the `separate_parking=TRUE|FALSE` from `obstacles/0_areas_project_to_kerb.sql` to `2_cutout_separate_parkings.sql`
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_areas',
    'side', kerb_side,
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_areas_projected;

-- INSERT "obstacle_line" buffers (buffered lines)
-- Buffer: static value 0.6m
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_lines',
    'side', kerb_side,
    'no_cutout_for_restrictions', true
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_lines_projected;

-- INSERT "parking area" buffers (intersection of line buffer and area buffer)
-- Approach: Buffer the kerb line generously (6m) and the original area polygon with a buffer (3m),
-- then intersect them. This keeps only the part of the line buffer toward the curb (away from centerline).
-- This ensures cutouts only affect road parking toward the curb, not toward the centerline.
-- Increased buffers ensure cutouts are large enough to intersect with road parking lines.
-- The line buffer can be increased safely since the intersection constrains it to the curb side.
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  pap.id::TEXT,
  pap.osm_id,
  ST_Intersection (
    ST_Buffer (pap.geom, 6, 'endcap=flat'), -- Line buffer (generous, 6m)
    ST_Buffer (pa.geom, 3) -- Area buffer (3m outward)
  ) AS geom,
  pap.tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', pap.tags ->> 'category',
    'source', 'separate_parking_areas'
    /* sql-formatter-enable */
  ),
  pap.meta || jsonb_build_object('updated_at', pa.meta ->> 'updated_at')
FROM
  _parking_separate_parking_areas_projected pap
  JOIN _parking_separate_parking_areas pa ON pap.source_id = pa.id
WHERE
  -- Only create cutout if intersection is not empty and valid
  ST_Intersects (
    ST_Buffer (pap.geom, 6, 'endcap=flat'),
    ST_Buffer (pa.geom, 3)
  )
  AND NOT ST_IsEmpty (
    ST_Intersection (
      ST_Buffer (pap.geom, 6, 'endcap=flat'),
      ST_Buffer (pa.geom, 3)
    )
  );

-- INSERT "parking point" buffers (buffered lines)
-- Buffer: static value 0.6m
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'separate_parking_points'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_separate_parking_points_projected;

-- INSERT roads
-- Cleanup: removes leftover parking pieces on roads
-- Uses LEAST(offset_right, offset_left) * 0.9 for buffer, excludes driveways without parking
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (
    geom,
    LEAST(
      (tags ->> 'offset_right')::NUMERIC,
      (tags ->> 'offset_left')::NUMERIC
    ) * 0.9,
    'endcap=flat'
  ),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'parking_roads'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_roads
WHERE
  NOT (
    is_driveway = true
    AND has_parking = false
  );

DO $$ BEGIN RAISE NOTICE 'END inserting cutout areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
