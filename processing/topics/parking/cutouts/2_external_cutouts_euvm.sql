-- WHAT IT DOES:
-- Insert external eUVM cutout data (obstacles from external source, not OSM) into `_parking_cutouts` table.
-- * Transform geometries to SRID 5243
-- * Project points/polygons to kerb lines using `tilda_project_to_k_closest_kerbs`
-- * Insert point cutouts with type-specific buffers (street_lamp, tree, traffic_sign, etc.)
--   (!) Those are managed manually in this file.
-- * Insert polygon cutouts with 0.6m buffer
-- INPUT: `data.euvm_cutouts_point`, `data.euvm_cutouts_polygon` (external data)
-- OUTPUT: `_parking_cutouts` (polygon) - areas where parking is not allowed
--
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

-- Project points to kerb
DROP TABLE IF EXISTS _euvm_cutouts_point_projected CASCADE;

CREATE TABLE _euvm_cutouts_point_projected AS
SELECT
  p.id || '-' || pk.kerb_id AS id,
  p.id as source_id,
  p.type,
  pk.*
FROM
  _euvm_cutouts_point_transformed p
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (p.geom, tolerance := 5, k := 1) AS pk;

-- Cleanup projected points
DELETE FROM _euvm_cutouts_point_projected
WHERE
  geom IS NULL;

-- Project polygons to kerb
DROP TABLE IF EXISTS _euvm_cutouts_polygon_projected CASCADE;

CREATE TABLE _euvm_cutouts_polygon_projected AS
SELECT
  p.id || '-' || pk.kerb_id AS id,
  p.id as source_id,
  p.type,
  pk.*
FROM
  _euvm_cutouts_polygon_transformed p
  CROSS JOIN LATERAL tilda_project_to_k_closest_kerbs (p.geom, tolerance := 2, k := 6) AS pk;

-- Cleanup projected polygons
DELETE FROM _euvm_cutouts_polygon_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- Add indexes for performance
CREATE INDEX euvm_cutouts_point_projected_geom_idx ON _euvm_cutouts_point_projected USING gist (geom);

CREATE INDEX euvm_cutouts_polygon_projected_geom_idx ON _euvm_cutouts_polygon_projected USING gist (geom);

-- INSERT external point cutouts with type-specific buffering
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
  'external-point-' || id AS id,
  source_id::BIGINT AS osm_id,
  ST_Buffer (
    geom,
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
    END,
    'side', kerb_side
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  NULL AS street_name,
  type AS category,
  kerb_side AS side
FROM
  _euvm_cutouts_point_projected
WHERE
  type IN (
    -- Keep in sync with the CASE above
    'bollard',
    'street_lamp',
    'tree',
    'street_cabinet',
    'traffic_sign',
    'water_well'
  );

-- INSERT external polygon cutouts directly
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
  'external-polygon-' || id AS id,
  source_id::BIGINT AS osm_id,
  ST_Buffer (geom, 0.6, 'endcap=flat') AS geom,
  jsonb_build_object(
    /* sql-formatter-disable */
    'category', type,
    'source', 'external_cutouts_euvm',
    'side', kerb_side
    /* sql-formatter-enable */
  ) AS tags,
  '{}'::jsonb AS meta,
  NULL AS street_name,
  type AS category,
  kerb_side AS side
FROM
  _euvm_cutouts_polygon_projected;

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
