-- WHAT IT DOES:
-- Project separate parking areas to kerb lines.
-- * Convert polygon to linestring, split median areas into front/back kerbs
-- * Estimate capacity for areas without capacity tag (based on length and orientation)
-- * Redistribute capacity for median areas proportionally by length
-- INPUT: `_parking_separate_parking_areas` (polygon)
-- OUTPUT: `_parking_separate_parking_areas_projected` (linestring)
--
DO $$ BEGIN RAISE NOTICE 'START projecting obstacle areas at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

-- PREPARE
DROP TABLE IF EXISTS _parking_separate_parking_areas_projected CASCADE;

-- Project polygon areas to kerb lines using `tilda_parking_area_to_line`
-- * Converts polygon to linestring by finding edge closest to roads
-- * Splits areas with `location=median` into front/back kerbs (handled by `tilda_parking_area_to_line`)
CREATE TABLE _parking_separate_parking_areas_projected AS
SELECT
  pa.id || '-' || (
    CASE
      WHEN pal.is_front_kerb THEN 'front'
      ELSE 'back'
    END
  ) AS id,
  pa.osm_type,
  pa.osm_id,
  pa.id AS source_id,
  pa.tags || jsonb_build_object(
    /* sql-formatter-disable */
    'road_width', pal.road_width,
    'road_width_source', pal.road_width_source
    /* sql-formatter-enable */
  ) AS tags,
  pal.side,
  pa.meta,
  pal.parking_kerb AS geom
FROM
  _parking_separate_parking_areas pa
  CROSS JOIN LATERAL tilda_parking_area_to_line (pa.geom, pa.tags, 15.) AS pal;

-- Estimate capacity for areas without capacity tag
-- * Based on length and orientation using `tilda_estimate_capacity`
CREATE INDEX parking_separate_parking_areas_osm_id_idx ON _parking_separate_parking_areas_projected (osm_id);

UPDATE _parking_separate_parking_areas_projected
SET
  tags = tags || jsonb_build_object(
    'capacity',
    tilda_estimate_capacity (
      length := ST_Length (geom)::NUMERIC,
      orientation := tags ->> 'orientation'
    )
  ) || '{"capacity_source": "estimated", "capacity_confidence": "medium"}'::JSONB
WHERE
  tags ->> 'capacity' IS NULL;

-- Redistribute capacity for median areas proportionally by length
-- * Areas with `location=median` are split into front/back kerbs
-- * Assign capacity to each piece proportionally: capacity * (piece_length / total_length)
WITH
  total_lengths AS (
    SELECT
      osm_id,
      SUM(ST_Length (geom)) AS length,
      SUM((tags ->> 'capacity')::NUMERIC) / 2.0 AS capacity,
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
    tl.capacity * ST_Length (pc.geom) / tl.length
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
