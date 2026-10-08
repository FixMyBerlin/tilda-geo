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
-- * Generate 2m grid of candidate points within polygon
-- * Cluster into exactly `capacity` clusters using ST_ClusterKMeans
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
  -- STEP 2: Generate 2m grid of candidate points within polygon
  -- Only id and capacity travel through the grid steps; tags and meta are joined back in STEP 5
  -- (carrying the JSON on every grid point made the sorts spill to disk).
  dense_grid AS (
    SELECT
      a.id,
      a.capacity,
      ST_Centroid (gc.geom) as point_geom,
      gc.i,
      gc.j,
      -- Point count per area (needed for clustering)
      COUNT(*) OVER (
        PARTITION BY
          a.id
      ) as point_count
    FROM
      areas a
      CROSS JOIN LATERAL ST_SquareGrid (2.0, a.geom) gc
    WHERE
      ST_Centroid (gc.geom) && a.geom
      AND ST_Within (ST_Centroid (gc.geom), a.geom)
  ),
  -- STEP 3: Cluster candidate points into exactly `capacity` clusters
  -- Use LEAST to prevent error when capacity exceeds grid points
  clustered AS (
    SELECT
      id,
      capacity,
      point_geom,
      ST_ClusterKMeans (point_geom, LEAST(capacity, point_count)::INTEGER) OVER (
        PARTITION BY
          id
        ORDER BY
          i,
          j
      ) as cluster_id
    FROM
      dense_grid
  ),
  -- STEP 4: Get centroid of each cluster
  cluster_centroids AS (
    SELECT
      id,
      capacity,
      cluster_id,
      ST_Centroid (ST_Collect (point_geom)) as centroid_geom,
      COUNT(*) OVER (
        PARTITION BY
          id
      ) as cluster_count
    FROM
      clustered
    GROUP BY
      id,
      capacity,
      cluster_id
  ),
  -- STEP 5: Expand to exact capacity with unique geometries
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
