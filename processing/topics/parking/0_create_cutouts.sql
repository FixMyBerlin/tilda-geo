DO $$ BEGIN RAISE NOTICE 'START creating cutout areas at %', clock_timestamp(); END $$;

DROP TABLE IF EXISTS _parking_cutouts;

DROP TABLE IF EXISTS _parking_discarded_cutouts;

-- INSERT "intersection_corner" buffers (circle)
-- @var: "5" is the buffer in meter where no parking is allowed legally
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
  '{}'::jsonb AS meta INTO _parking_cutouts
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
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'crossing',
    'width', (tags ->> 'buffer_radius')::float
    /* sql-formatter-enable */
  ) || tags,
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
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_points',
    'radius', (tags ->> 'buffer_radius')::float
    /* sql-formatter-enable */
  ) || tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_points_projected;

-- INSERT "obstacle_area" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_areas'
    /* sql-formatter-enable */
  ) || tags,
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
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'obstacle_lines'
    /* sql-formatter-enable */
  ) || tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_obstacle_lines_projected;

-- INSERT "obstacle" buffers (buffered lines)
INSERT INTO
  _parking_cutouts (id, osm_id, geom, tags, meta)
SELECT
  id::TEXT,
  osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat'),
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'separate_parking_areas'
    /* sql-formatter-enable */
  ) || tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_separate_parking_areas_projected;

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
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', tags ->> 'category',
    'source', 'parking_roads'
    /* sql-formatter-enable */
  ) || tags,
  jsonb_build_object('updated_at', meta ->> 'updated_at')
FROM
  _parking_roads;

CREATE INDEX parking_cutout_areas_geom_idx ON _parking_cutouts USING GIST (geom);

-- NOTE TODO: Test those new indexes for performance improvements
-- CREATE INDEX parking_cutouts_geom_highway_busstop_idx ON _parking_cutouts USING GIST (geom) INCLUDE ((tags ->> 'highway'), (tags ->> 'bus_stop'));
CREATE INDEX parking_cutouts_street_name_idx ON _parking_cutouts ((tags ->> 'street:name'));

CREATE INDEX parking_cutouts_source_idx ON _parking_cutouts ((tags ->> 'source'));

-- get all ids for cutouts that need to be discarded
SELECT
  c.* INTO _parking_discarded_cutouts
FROM
  _parking_cutouts c
  JOIN _parking_road_parkings p ON c.geom && p.geom
WHERE
  ST_Intersects (c.geom, p.geom)
  AND (
    c.tags ->> 'highway' = 'turning_circle'
    OR c.tags ->> 'highway' = 'bus_stop'
  )
  AND p.tags ->> 'parking' = 'no';

CREATE INDEX parking_discared_cutouts_idx ON _parking_discarded_cutouts USING BTREE (id);

DELETE FROM _parking_cutouts
WHERE
  id IN (
    SELECT
      id
    FROM
      _parking_discarded_cutouts
  );

-- MISC
ALTER TABLE _parking_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

ALTER TABLE _parking_discarded_cutouts
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);
