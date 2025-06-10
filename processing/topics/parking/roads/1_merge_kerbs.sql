DO $$ BEGIN RAISE NOTICE 'START merging kerbs %', clock_timestamp(); END $$;

-- create one table where connected linestrings are merged which is later used to snap to
DROP TABLE IF EXISTS _parking_kerbs_merged;

-- We merge after grouping by street name and side, so that the merged kerbs should correspond to the street kerbs
WITH
  clustered AS (
    SELECT
      street_name,
      osm_id,
      geom,
      side,
      has_parking,
      ST_ClusterDBSCAN (geom, eps := 0.005, minpoints := 1) OVER (
        PARTITION BY
          street_name,
          side,
          has_parking
      ) AS cluster_id
    FROM
      _parking_kerbs
  )
SELECT
  street_name,
  cluster_id,
  side,
  has_parking,
  array_agg(osm_id) AS original_osm_ids,
  (ST_Dump (ST_LineMerge (ST_Union (geom, 0.005)))).geom AS geom
  --
  INTO _parking_kerbs_merged
FROM
  clustered
GROUP BY
  street_name,
  side,
  has_parking,
  cluster_id;

ALTER TABLE _parking_kerbs_merged
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

-- create an index on the merged table
CREATE INDEX parking_kerbs_merged_geom_idx ON _parking_kerbs_merged USING GIST (geom);

CREATE INDEX parking_kerbs_merged_idx ON _parking_kerbs_merged USING GIN (original_osm_ids);
