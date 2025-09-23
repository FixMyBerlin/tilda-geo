DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp(); END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_areas_projected CASCADE;

-- CREATE "areas projected"
SELECT
  a.id || '-' || pk.kerb_id AS id,
  a.osm_type,
  a.osm_id,
  a.id AS source_id,
  a.tags,
  a.meta,
  pk.* INTO _parking_separate_parking_areas_projected
FROM
  _parking_separate_parking_areas a
  CROSS JOIN LATERAL project_to_k_closest_kerbs (a.geom, tolerance := 3, k := 6) AS pk;

DELETE FROM _parking_separate_parking_areas_projected
WHERE
  geom IS NULL
  OR ST_GeometryType (geom) <> 'ST_LineString'
  OR ST_Length (geom) < 0.3;

-- now we need to redistribute the capacity of our projected areas to avoid double counting
-- we do this by assigning the capacity to each piece proportionally to it's length / length of all projected pieces
CREATE INDEX parking_separate_parking_areas_osm_id_idx ON _parking_separate_parking_areas_projected (osm_id);

WITH
  total_lengths AS (
    SELECT
      osm_id,
      SUM(ST_Length (geom)) AS length,
      COUNT(*) AS count
    FROM
      _parking_separate_parking_areas_projected
    WHERE
      tags ? 'capacity'
    GROUP BY
      osm_id
  )
UPDATE _parking_separate_parking_areas_projected pc
SET
  tags = tags || jsonb_build_object(
    'capacity',
    (tags ->> 'capacity')::NUMERIC * ST_Length (pc.geom) / tl.length
  )
FROM
  total_lengths tl
WHERE
  tl.count > 1
  AND pc.osm_id = tl.osm_id;

-- MISC
ALTER TABLE _parking_separate_parking_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_areas_projected_geom_idx ON _parking_separate_parking_areas_projected USING GIST (geom);

DROP TABLE IF EXISTS _parking_separate_parking_kerbs;

SELECT
  osm_type,
  osm_id,
  id,
  tags,
  side,
  meta,
  parking_kerb AS geom INTO _parking_separate_parking_kerbs
FROM
  _parking_separate_parking_areas pa
  CROSS JOIN LATERAL parking_area_to_line (pa.geom, pa.tags, 15.);

ALTER TABLE _parking_separate_parking_kerbs
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX _parking_separate_parking_kerbs_geom_idx ON _parking_separate_parking_kerbs USING gist (geom);

-- ALTER TABLE "EXPERIMENT_parking_edges"
-- ALTER COLUMN rest TYPE geometry (Geometry, 5243) USING ST_SetSRID (rest, 5243);
-- CREATE INDEX experiment_parking_edges_geom_idx ON "EXPERIMENT_parking_edges_rest" USING gist (rest);
