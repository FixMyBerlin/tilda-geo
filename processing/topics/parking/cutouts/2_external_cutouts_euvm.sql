DO $$ BEGIN RAISE NOTICE 'START external cutouts eUVM at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- STATS:
-- driveway	46077
-- bollard	18083
-- tree	14922
-- street_lamp	6272
-- traffic_sign	3926
-- street_cabinet	1117
-- water_well	42
--
-- Create data tables if they don't exist to graceful handling of missing external data
CREATE TABLE IF NOT EXISTS data.euvm_cutouts_point (id INTEGER, geom GEOMETRY, type VARCHAR);

CREATE TABLE IF NOT EXISTS data.euvm_cutouts_polygon (id INTEGER, geom GEOMETRY, type VARCHAR);

-- Create temporary transformed tables for better performance
DROP TABLE IF EXISTS _euvm_cutouts_point_transformed;

CREATE TEMP TABLE _euvm_cutouts_point_transformed AS
SELECT
  id,
  ST_Transform (geom, 5243) AS geom,
  type
FROM
  data.euvm_cutouts_point;

DROP TABLE IF EXISTS _euvm_cutouts_polygon_transformed;

CREATE TEMP TABLE _euvm_cutouts_polygon_transformed AS
SELECT
  id,
  ST_Transform (geom, 5243) AS geom,
  type
FROM
  data.euvm_cutouts_polygon;

-- INSERT external point cutouts with type-specific buffering
-- Process each geometry in MULTIPOINT collections using generate_series
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  'external-point-' || id || '-' || n AS id,
  id::BIGINT AS osm_id,
  ST_Buffer (
    ST_GeometryN (geom, n),
    CASE type
      -- KEEP IN SYNC - Buffer in meters (geometry already transformed)
      WHEN 'bollard' THEN 0.3
      WHEN 'street_lamp' THEN 0.4
      WHEN 'tree' THEN 1.5
      WHEN 'street_cabinet' THEN 1.5
      WHEN 'traffic_sign' THEN 0.3
      WHEN 'water_well' THEN 1.5
      ELSE 0.01 -- This case is never reached due to WHERE clause filtering
    END
  ) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', type,
    'source', 'external_cutouts_euvm',
    'radius',
    CASE type
    -- KEEP IN SYNC
    WHEN 'bollard' THEN 0.3
    WHEN 'street_lamp' THEN 0.4
    WHEN 'tree' THEN 1.5
    WHEN 'street_cabinet' THEN 1.5
    WHEN 'traffic_sign' THEN 0.3
    WHEN 'water_well' THEN 1.5
    ELSE 0.01 -- This case is never reached due to WHERE clause filtering
    END
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  NULL AS street_name,
  type AS category,
  NULL AS side
FROM
  _euvm_cutouts_point_transformed,
  generate_series(1, ST_NumGeometries (geom)) AS n
WHERE
  type IN (
    -- Keep in sync with the CASE above
    -- 'bollard', -- skipped for performance reasons
    'street_lamp',
    'tree',
    'street_cabinet',
    'traffic_sign',
    'water_well'
  );

-- INSERT external polygon cutouts directly
-- Process each geometry in MULTIPOLYGON collections using generate_series
INSERT INTO
  _parking_cutouts (
    id,
    osm_id,
    geom,
    tags,
    meta,
    street_name,
    category,
    side
  )
SELECT
  'external-polygon-' || id || '-' || n AS id,
  id::BIGINT AS osm_id,
  ST_GeometryN (geom, n) AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category',type,
    'source', 'external_cutouts_euvm'
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  NULL AS street_name,
  type AS category,
  NULL AS side
FROM
  _euvm_cutouts_polygon_transformed,
  generate_series(1, ST_NumGeometries (geom)) AS n;

-- Log counts per type for points (what is available but not processed)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT type, COUNT(*) as count
    FROM data.euvm_cutouts_point
    -- KEEP IN SYNC
    WHERE type NOT IN (
      'bollard',
      'street_lamp',
      'tree',
      'street_cabinet',
      'traffic_sign',
      'water_well'
    )
    GROUP BY type
    ORDER BY count DESC
  LOOP
    RAISE NOTICE 'NOTICE: External cutouts eUVM that are NOT added - type: %, count: %', rec.type, rec.count;
  END LOOP;
END $$;
