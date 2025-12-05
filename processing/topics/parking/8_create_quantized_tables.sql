-- WHAT IT DOES:
-- Create quantized point tables for calculator feature.
--
DO $$ BEGIN RAISE NOTICE 'START creating quantized tables at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- WHAT IT DOES:
-- Explode parkings (linestring) into quantized points for calculator feature.
-- * Uses `tilda_explode_parkings` to create evenly spaced points along linestring (1 per capacity)
-- * Each point gets capacity: 1 in tags
-- INPUT: parkings (linestring)
-- OUTPUT: parkings_quantized (point)
--
INSERT INTO
  parkings_quantized (id, tags, meta, geom, minzoom)
WITH
  sum_points AS (
    SELECT
      tags || '{"capacity": 1}'::JSONB as tags,
      meta,
      tilda_explode_parkings (geom, capacity := (tags ->> 'capacity')::INTEGER) as geom
    FROM
      parkings
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
-- * Generate dense grid of candidate points within polygon
-- * Cluster into exactly `capacity` clusters using ST_ClusterKMeans
-- * Get centroid of each cluster (ensures exactly `capacity` points)
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
  dense_grid AS (
    SELECT
      a.id,
      a.capacity,
      a.tags,
      a.meta,
      a.geom as polygon_geom,
      ST_Centroid (gc.geom) as point_geom,
      gc.i,
      gc.j
    FROM
      areas a
      CROSS JOIN LATERAL ST_SquareGrid (2.0, a.geom) gc
    WHERE
      ST_Centroid (gc.geom) && a.geom
      AND ST_Within (ST_Centroid (gc.geom), a.geom)
  ),
  -- STEP 3: Cluster candidate points into exactly `capacity` clusters
  -- ORDER BY grid indices (i, j) for deterministic processing order
  clustered AS (
    SELECT
      dg.id,
      dg.capacity,
      dg.tags,
      dg.meta,
      dg.point_geom,
      ST_ClusterKMeans (dg.point_geom, dg.capacity) OVER (
        PARTITION BY
          dg.id
        ORDER BY
          dg.i,
          dg.j
      ) as cluster_id
    FROM
      dense_grid dg
  ),
  -- STEP 4: Get centroid of each cluster
  -- Each cluster centroid represents one parking space
  cluster_centroids AS (
    SELECT
      id,
      capacity,
      tags,
      meta,
      cluster_id,
      ST_Centroid (ST_Collect (point_geom)) as centroid_geom
    FROM
      clustered
    GROUP BY
      id,
      capacity,
      tags,
      meta,
      cluster_id
  )
SELECT
  -- STEP 5: Assign IDs and set capacity to 1
  -- Order by coordinates (Y, then X) for deterministic point ordering
  ROW_NUMBER() OVER (
    ORDER BY
      id,
      ST_Y (centroid_geom),
      ST_X (centroid_geom)
  )::TEXT AS id,
  tags || '{"capacity": 1}'::JSONB as tags,
  meta,
  ST_Transform (centroid_geom, 3857) as geom,
  0 as minzoom
FROM
  cluster_centroids;

DROP INDEX IF EXISTS off_street_parking_quantized_geom_idx;

CREATE INDEX off_street_parking_quantized_geom_idx ON off_street_parking_quantized USING GIST (geom);

DROP INDEX IF EXISTS off_street_parking_quantized_id_idx;

CREATE UNIQUE INDEX unique_off_street_parking_quantized_id_idx ON off_street_parking_quantized (id);
