-- WHAT IT DOES:
-- Place `capacity` points inside a polygon, spread out evenly (one point per parking space).
-- * Generate 2m grid of candidate points within polygon
-- * Cluster them into `capacity` clusters using ST_ClusterKMeans and return the centroid of each cluster
-- * Returns fewer rows than `capacity` when the grid has fewer points; `cluster_count` is the number of rows returned
-- * Works on one polygon per call, so every sort is small and stays in memory
-- USED IN: `8_create_quantized_tables.sql` (points for off_street_parking_areas)
DROP FUNCTION IF EXISTS tilda_quantize_polygon;

CREATE FUNCTION tilda_quantize_polygon (polygon geometry, capacity integer) RETURNS TABLE (
  cluster_id integer,
  centroid_geom geometry,
  cluster_count bigint
) AS $$
  WITH
    -- STEP 1: Generate 2m grid of candidate points within polygon
    dense_grid AS (
      SELECT
        ST_Centroid (gc.geom) as point_geom,
        gc.i,
        gc.j,
        -- Point count (needed for clustering)
        COUNT(*) OVER () as point_count
      FROM
        ST_SquareGrid (2.0, polygon) gc
      WHERE
        ST_Within (ST_Centroid (gc.geom), polygon)
    ),
    -- STEP 2: Cluster candidate points into exactly `capacity` clusters
    -- Use LEAST to prevent error when capacity exceeds grid points
    clustered AS (
      SELECT
        point_geom,
        i,
        j,
        ST_ClusterKMeans (point_geom, LEAST(capacity, point_count)::INTEGER) OVER (
          ORDER BY
            i,
            j
        ) as cluster_id
      FROM
        dense_grid
    )
  -- STEP 3: Get centroid of each cluster
  -- (points are collected in grid order so the result is the same on every run)
  SELECT
    cluster_id,
    ST_Centroid (
      ST_Collect (
        point_geom
        ORDER BY
          i,
          j
      )
    ) as centroid_geom,
    COUNT(*) OVER () as cluster_count
  FROM
    clustered
  GROUP BY
    cluster_id;
$$ LANGUAGE sql STABLE;
