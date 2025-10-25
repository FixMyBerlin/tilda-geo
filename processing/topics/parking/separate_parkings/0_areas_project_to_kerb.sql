DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_areas_projected CASCADE;

CREATE TABLE _parking_separate_parking_areas_projected AS
SELECT
  id || '-' || (
    CASE
      WHEN is_front_kerb THEN 'front'
      ELSE 'back'
    END
  ) AS id,
  osm_type,
  osm_id,
  id AS source_id,
  tags,
  side,
  meta,
  parking_kerb AS geom
FROM
  _parking_separate_parking_areas pa
  CROSS JOIN LATERAL parking_area_to_line (pa.geom, pa.tags, 15.);

-- now we need to redistribute the capacity of all parking areas that were split into multiple pieces e.g. the ones with `location=median`
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
      tags ->> 'location' = 'median'
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
