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
  pa.tags,
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
-- * Areas with `location=median` are split into front/back kerbs by `tilda_parking_area_to_line`
-- * Both segments initially get the same capacity value (duplicated from the original)
-- * We join back to the source table to get the original capacity and check capacity_source
-- * Distribution: round down smaller segment(s), add remainder to longest segment
-- * This preserves the exact total capacity and minimizes rounding errors
WITH
  -- STEP 1: Collect all `location=median` parking segments with their lengths and capacity information
  -- Why: When a `location=median` area is split, both front/back kerbs get the same capacity value (duplicated).
  -- We check the source table's capacity_source to determine if capacity is from an OSM tag or estimated.
  median_segments AS (
    SELECT
      pc.osm_id,
      pc.id,
      pc.source_id,
      ST_Length (pc.geom) AS segment_length,
      pc.tags,
      -- Get capacity from source table for explicitly tagged capacities (original, authoritative value, not duplicated)
      CASE
        WHEN pa.tags ->> 'capacity_source' = 'tag' THEN (pa.tags ->> 'capacity')::NUMERIC
        ELSE NULL
      END AS tag_capacity,
      -- For estimated capacities, get the estimated value from the projected segment (set by UPDATE step)
      CASE
        WHEN pa.tags ->> 'capacity_source' IS DISTINCT FROM 'tag' THEN (pc.tags ->> 'capacity')::NUMERIC
        ELSE NULL
      END AS estimated_capacity
    FROM
      _parking_separate_parking_areas_projected pc
      LEFT JOIN _parking_separate_parking_areas pa ON pc.source_id = pa.id
    WHERE
      pc.tags ->> 'location' = 'median'
  ),
  -- STEP 2: Calculate total length and determine the correct total capacity per OSM area
  -- Why: When a median area is split, we get 2 rows (front/back kerbs) with the same `osm_id`.
  -- We aggregate them to get combined total length and capacity. For tagged capacities, use the
  -- original from source table. For estimated capacities, both segments have the same value, so
  -- we sum and divide by 2.0 to get back to the original estimated capacity.
  total_lengths AS (
    SELECT
      osm_id,
      SUM(segment_length) AS total_length,
      -- For tagged capacities: use capacity from OSM tag (from source table)
      MAX(tag_capacity) AS tag_capacity,
      -- For estimated capacities: sum and divide by 2.0 (since both segments have same value)
      CASE
        WHEN MAX(tag_capacity) IS NULL THEN SUM(estimated_capacity) / 2.0
        ELSE NULL
      END AS estimated_capacity,
      COUNT(*) AS count
    FROM
      median_segments
    GROUP BY
      osm_id
  ),
  -- STEP 3: Calculate proportional capacity for each segment based on its length
  -- Why: Distribute the total capacity proportionally (longer segments get more). We use FLOOR()
  -- to round down all proportional capacities, then add the remainder to the longest segment.
  -- This ensures the sum of all segments exactly equals the original total capacity, minimizing
  -- rounding errors for both tagged (integer) and estimated (decimal) capacities.
  proportional_capacities AS (
    SELECT
      ms.id,
      ms.osm_id,
      ms.segment_length,
      tl.total_length,
      COALESCE(tl.tag_capacity, tl.estimated_capacity) AS total_capacity,
      FLOOR(
        COALESCE(tl.tag_capacity, tl.estimated_capacity) * ms.segment_length / tl.total_length
      ) AS proportional_capacity,
      -- Track which segment is longest for remainder distribution
      ROW_NUMBER() OVER (
        PARTITION BY
          ms.osm_id
        ORDER BY
          ms.segment_length DESC
      ) AS length_rank
    FROM
      median_segments ms
      JOIN total_lengths tl ON ms.osm_id = tl.osm_id
    WHERE
      tl.count > 1
  ),
  -- STEP 4: Sum all proportional capacities per OSM area
  -- Why: Calculate the sum of rounded-down proportional capacities to determine the remainder
  -- (difference from the original total capacity).
  total_proportional AS (
    SELECT
      osm_id,
      SUM(proportional_capacity) AS sum_proportional,
      MAX(total_capacity) AS total_capacity
    FROM
      proportional_capacities
    GROUP BY
      osm_id
  ),
  -- STEP 5: Calculate the remainder and prepare for final assignment
  -- Why: The remainder (total_capacity - sum_proportional) is added to the longest segment to
  -- ensure the sum of all segments exactly equals the original total capacity.
  capacities_with_remainder AS (
    SELECT
      pc.id,
      pc.osm_id,
      pc.proportional_capacity,
      pc.length_rank,
      pc.total_capacity,
      tp.total_capacity - tp.sum_proportional AS remainder
    FROM
      proportional_capacities pc
      JOIN total_proportional tp ON pc.osm_id = tp.osm_id
  )
UPDATE _parking_separate_parking_areas_projected pc
SET
  tags = tags || jsonb_build_object(
    'capacity',
    -- Add remainder to longest segment (length_rank = 1), round to 2 decimal places
    -- Tagged capacities will be X.00 (integers), estimated capacities preserve precision
    CASE
      WHEN cwr.length_rank = 1 THEN ROUND(
        (cwr.proportional_capacity + cwr.remainder)::NUMERIC,
        2
      )
      ELSE ROUND(cwr.proportional_capacity::NUMERIC, 2)
    END
  )
FROM
  capacities_with_remainder cwr
WHERE
  pc.id = cwr.id;

-- MISC
ALTER TABLE _parking_separate_parking_areas_projected
ALTER COLUMN geom TYPE geometry (Geometry, 5243) USING ST_SetSRID (geom, 5243);

CREATE INDEX parking_separate_parking_areas_projected_geom_idx ON _parking_separate_parking_areas_projected USING GIST (geom);
