-- WHAT IT DOES:
-- Create quantized point tables for calculator feature.
--
DO $$ BEGIN RAISE NOTICE 'START creating quantized tables at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- WHAT IT DOES:
-- Explode parkings (linestring) into quantized points for calculator feature.
-- * Uses `tilda_explode_parkings` to create evenly spaced points along linestring (1 per capacity)
-- * Each point gets capacity: 1 and its share of the area (area / capacity) in tags;
--   the last point of a feature takes the rounding remainder so the sum equals the source area
-- INPUT: parkings (linestring)
-- OUTPUT: parkings_quantized (point)
--
INSERT INTO
  parkings_quantized (id, tags, meta, geom, minzoom)
WITH
  -- Area share per point, rounded like `area` on the source table
  source AS (
    SELECT
      tags,
      meta,
      geom,
      (tags ->> 'capacity')::INTEGER AS capacity,
      (tags ->> 'area')::NUMERIC AS area,
      ROUND((tags ->> 'area')::NUMERIC / (tags ->> 'capacity')::INTEGER, 2) AS area_share
    FROM
      parkings
    WHERE
      (tags ->> 'capacity')::INTEGER > 0
  ),
  sum_points AS (
    SELECT
      (
        tags - ARRAY[
          'road_width_confidence',
          'road_width_source',
          'capacity_confidence',
          'capacity_source',
          'area_confidence',
          'area_source',
          'surface_confidence',
          'surface_source'
        ]
      ) || jsonb_strip_nulls(
        jsonb_build_object(
          'capacity', 1,
          -- The last point takes the rounding remainder so the sum equals the source area
          'area', CASE
            WHEN point_nr < capacity THEN area_share
            ELSE area - area_share * (capacity - 1)
          END
        )
      ) as tags,
      meta,
      point_geom as geom
    FROM
      source
      CROSS JOIN LATERAL tilda_explode_parkings (geom, capacity := capacity)
      WITH ORDINALITY AS exploded (point_geom, point_nr)
  )
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      tags
  )::TEXT AS id,
  tags,
  meta,
  ST_Transform (geom, 3857) as geom,
  0 as minzoom
FROM
  sum_points;

DROP INDEX IF EXISTS parkings_quantized_geom_idx;

CREATE INDEX parkings_quantized_geom_idx ON parkings_quantized USING GIST (geom);

DROP INDEX IF EXISTS parkings_quantized_id_idx;

CREATE UNIQUE INDEX unique_parkings_quantized_id_idx ON parkings_quantized (id);

-- WHAT IT DOES:
-- Create quantized points for off_street_parking_areas (polygon) using clustering approach.
-- * Place one point per cluster of a 2m grid within the polygon (`tilda_quantize_polygon`)
-- * If grid generates fewer points than capacity, duplicate centroids with small offsets
-- * Each point gets capacity: 1 and its share of the area (area / capacity) in tags;
--   the last point of a feature takes the rounding remainder so the sum equals the source area
-- INPUT: off_street_parking_areas (polygon)
-- OUTPUT: off_street_parking_quantized (point)
--
INSERT INTO
  off_street_parking_quantized (id, tags, meta, geom, minzoom)
WITH
  -- STEP 1: Filter areas with valid capacity
  areas AS (
    SELECT
      id,
      geom,
      (tags ->> 'capacity')::INTEGER as capacity,
      tags,
      meta
    FROM
      off_street_parking_areas
    WHERE
      (tags ->> 'capacity')::INTEGER IS NOT NULL
      AND (tags ->> 'capacity')::INTEGER > 0
  ),
  -- STEP 2: Cluster a 2m grid of points within each polygon into `capacity` clusters
  -- and take the centroid of each cluster (see `tilda_quantize_polygon`).
  -- Only id and capacity are carried along; tags and meta are joined back in STEP 3.
  cluster_centroids AS (
    SELECT
      a.id,
      a.capacity,
      c.cluster_id,
      c.centroid_geom,
      c.cluster_count
    FROM
      areas a
      CROSS JOIN LATERAL tilda_quantize_polygon (a.geom, a.capacity) AS c
  ),
  -- STEP 3: Expand to exact capacity with unique geometries
  -- If cluster_count < capacity, duplicate centroids with small circular offsets
  expanded_points AS (
    SELECT
      cc.id,
      cc.capacity,
      a.tags,
      a.meta,
      -- Apply offset only to duplicates (not the first instance for this cluster)
      -- First instance: target_point = cluster_id + 1
      CASE
        WHEN target_point > (cc.cluster_id + 1) THEN
        -- Offset by 0.5m in circular pattern, using target_point for unique angle
        ST_Translate (
          cc.centroid_geom,
          0.5 * COS(
            2.0 * PI() * (target_point - 1) / cc.capacity::FLOAT
          ),
          0.5 * SIN(
            2.0 * PI() * (target_point - 1) / cc.capacity::FLOAT
          )
        )
        ELSE cc.centroid_geom
      END as centroid_geom,
      target_point AS point_nr,
      (a.tags ->> 'area')::NUMERIC AS area,
      -- Area share per point, rounded like `area` on the source table
      ROUND((a.tags ->> 'area')::NUMERIC / cc.capacity, 2) AS area_share
    FROM
      cluster_centroids cc
      JOIN areas a ON a.id = cc.id
      CROSS JOIN LATERAL generate_series(1, cc.capacity) AS target_point
    WHERE
      (target_point - 1) % cc.cluster_count = cc.cluster_id
  )
SELECT
  ROW_NUMBER() OVER (
    ORDER BY
      id,
      ST_Y (centroid_geom),
      ST_X (centroid_geom)
  )::TEXT AS id,
  (
    tags - ARRAY[
      'road_width_confidence',
      'road_width_source',
      'capacity_confidence',
      'capacity_source',
      'area_confidence',
      'area_source',
      'surface_confidence',
      'surface_source'
    ]
  ) || jsonb_strip_nulls(
    jsonb_build_object(
      'capacity', 1,
      -- The last point takes the rounding remainder so the sum equals the source area
      'area', CASE
        WHEN point_nr < capacity THEN area_share
        ELSE area - area_share * (capacity - 1)
      END
    )
  ) as tags,
  meta,
  ST_Transform (centroid_geom, 3857) as geom,
  0 as minzoom
FROM
  expanded_points;

DROP INDEX IF EXISTS off_street_parking_quantized_geom_idx;

CREATE INDEX off_street_parking_quantized_geom_idx ON off_street_parking_quantized USING GIST (geom);

DROP INDEX IF EXISTS off_street_parking_quantized_id_idx;

CREATE UNIQUE INDEX unique_off_street_parking_quantized_id_idx ON off_street_parking_quantized (id);

DO $$ BEGIN RAISE NOTICE 'END creating quantized tables at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
