DO $$ BEGIN RAISE NOTICE 'START inserting cutout areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- INSERT "intersection_corner" buffers (circle)
-- @var: "5" is the buffer in meter where no parking is allowed legally
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
  AND has_road;

INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  kerb_osm_id,
  ST_Buffer (geom, 0.01, 'endcap=flat'),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', 'driveway_corner_kerb',
    'source', 'driveway_corner_kerbs'
    /* sql-formatter-enable */
  ),
  '{}'::jsonb
FROM
  _parking_driveway_corner_kerbs;

-- INSERT "driveway" buffers (rectangles)
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
    'width', tags ->> 'width',
    -- 'highway', tags ->> 'highway',
    'road', tags ->> 'road'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_driveways;

-- INSERT "crossing" buffers (rectangles)
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
    'width', (tags ->> 'buffer_radius')::float
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_crossings;

-- INSERT "obstacle_point" buffers (circle)
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
    'side', kerb_side
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_points_projected;

-- INSERT "public_transport_stops" buffers (circle) - both v2 and v3
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
    'side', COALESCE(source ->> 'kerb_side', 'platform')
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_public_transport_points_projected;

-- INSERT "turnaround_point" buffers (circle) - unprojected obstacles
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, (tags ->> 'buffer_radius')::float),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category', -- see processing/topics/parking/obstacles_unprojected/point/obstacle_point_categories.lua
    'source', 'turnaround_points',
    'radius', (tags ->> 'buffer_radius')::float
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_turnaround_points;

-- INSERT "obstacle_area" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_areas',
    'side', kerb_side
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_areas_projected;

-- INSERT "obstacle_line" buffers (buffered lines)
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
    'side', kerb_side
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_lines_projected;

-- INSERT "parking area" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  tags || jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'separate_parking_areas'
    /* sql-formatter-enable */
  ),
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_separate_parking_areas_projected;

-- INSERT "parking area" buffers (buffered lines)
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
