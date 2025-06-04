-- properties that are in tags and need to be clustered should be separate columns so we can index them properly
SELECT
  p.*,
  tags ->> 'orientation' as orientation INTO TEMP clustered_parkings
FROM
  parkings p;

CREATE INDEX clustered_parkings_idx ON clustered_parkings USING BTREE (osm_id, side, orientation);

-- create one table where connected linestrings are merged which is later used to snap to
DROP TABLE IF EXISTS parkings_merged;

-- We merge after grouping by street name and side, so that the merged kerbs should correspond to the street kerbs
WITH
  clustered AS (
    SELECT
      street_name,
      osm_id,
      geom,
      side,
      orientation,
      ST_ClusterDBSCAN (geom, eps := 0.005, minpoints := 1) OVER (
        PARTITION BY
          street_name,
          side,
          orientation
      ) AS cluster_id
    FROM
      clustered_parkings
  )
SELECT
  ROW_NUMBER() OVER () AS id,
  street_name,
  cluster_id,
  side,
  orientation,
  array_agg(osm_id) AS original_osm_ids,
  (ST_Dump (ST_LineMerge (ST_Union (geom, 0.005)))).geom AS geom INTO parkings_merged
FROM
  clustered
GROUP BY
  orientation,
  street_name,
  side,
  cluster_id;

DO $$
BEGIN
  RAISE NOTICE 'Finished merging parkings %', clock_timestamp();
END
$$;
