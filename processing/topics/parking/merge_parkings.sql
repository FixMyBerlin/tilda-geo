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

-- add length and delete short parkings
ALTER TABLE parkings_merged
ADD COLUMN length numeric;

UPDATE parkings_merged
SET
  length = ST_Length (geom);

DELETE FROM parkings_merged
WHERE
  length < 2.5;

-- estimate capacity
ALTER TABLE parkings_merged
ADD COLUMN capacity numeric;

UPDATE parkings_merged
SET
  capacity = estimate_capacity (length, orientation);

-- MISC
ALTER TABLE parkings_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

-- create an index on the merged table
CREATE INDEX parkings_merged_geom_idx ON parkings_merged USING GIST (geom);

CREATE INDEX parkings_merged_idx ON parkings_merged USING GIN (original_osm_ids);

DO $$
BEGIN
  RAISE NOTICE 'Finished merging parkings %', clock_timestamp();
END
$$;
