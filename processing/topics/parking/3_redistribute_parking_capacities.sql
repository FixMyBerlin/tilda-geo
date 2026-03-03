-- WHAT IT DOES:
-- Redistribute parking capacities proportionally after parkings are split (e.g., by cutouts).
-- * Snap geometries to grid using `ST_SnapToGrid` to reduce precision issues
-- * Delete zero-length geometries using `ST_Length` (invalid after cutouts)
-- * For tag-based capacity (capacity_source='tag'): integer distribution (FLOOR + remainder to longest segment) so sum equals original capacity
-- * For estimated/other capacity: proportional decimal (segment_length / total_length) so sum equals original capacity
-- * Remove area tags (no longer accurate after splitting)
-- INPUT: `_parking_parkings_cutted` (linestring) - parkings after cutouts
-- OUTPUT: `_parking_parkings_cutted` (updated in-place with redistributed capacities)
--
DO $$ BEGIN RAISE NOTICE 'START redistributing parking capacities at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

UPDATE _parking_parkings_cutted
SET
  geom = ST_SnapToGrid (geom, 0.1);

-- Delete all parking lots where the length of the geometry is zero
-- Zero-length geometries can occur when:
-- 1. A cutout (e.g., bus stop, driveway) completely removes a segment: `ST_Difference` in `1_cutout_road_parkings.sql` can result in empty geometries
-- 2. After `ST_SnapToGrid`: Very small segments (< 0.1 units) may snap to the same point, creating zero-length linestrings
-- 3. When `ST_Dump` splits a parking and one of the resulting segments has no length
-- These are invalid for capacity calculations and must be removed
DELETE FROM _parking_parkings_cutted
WHERE
  ST_Length (geom) = 0;

-- Redistribute only where > 1 segment per original_id. Two branches…
-- Branch 1: capacity_source = 'tag' — integer distribution (FLOOR + remainder to longest segment).
WITH
  -- Per original_id: total length, total capacity; only groups with > 1 segment and capacity_source = 'tag'.
  total_lengths AS (
    SELECT
      original_id,
      SUM(ST_Length (geom)) AS total_length,
      MAX((tags ->> 'capacity')::NUMERIC) AS total_capacity,
      MAX(tags ->> 'capacity_source') AS capacity_source,
      COUNT(*) AS count
    FROM
      _parking_parkings_cutted
    WHERE
      tags ? 'capacity'
    GROUP BY
      original_id
    HAVING
      COUNT(*) > 1
      AND MAX(tags ->> 'capacity_source') = 'tag'
  ),
  -- Per segment: frac, floor_capacity, length_rank (1 = longest).
  proportional AS (
    SELECT
      pc.id,
      pc.original_id,
      seg_len AS segment_length,
      tl.total_length,
      tl.total_capacity,
      seg_len / tl.total_length AS frac,
      FLOOR(tl.total_capacity * seg_len / tl.total_length) AS floor_capacity,
      ROW_NUMBER() OVER (
        PARTITION BY
          pc.original_id
        ORDER BY
          seg_len DESC
      ) AS length_rank
    FROM
      (
        SELECT
          id,
          original_id,
          ST_Length (geom) AS seg_len
        FROM
          _parking_parkings_cutted
        WHERE
          tags ? 'capacity'
          AND tags ->> 'capacity_source' = 'tag'
      ) pc
      JOIN total_lengths tl ON pc.original_id = tl.original_id
  ),
  -- Remainder per group: total_capacity - sum(floor_capacity); added to longest segment.
  remainder_per_orig AS (
    SELECT
      original_id,
      total_capacity - SUM(floor_capacity)::NUMERIC AS remainder
    FROM
      proportional
    GROUP BY
      original_id,
      total_capacity
  ),
  -- Final capacity: floor + remainder on longest segment (integer; sum = original).
  assigned AS (
    SELECT
      p.id,
      (
        p.floor_capacity + CASE
          WHEN p.length_rank = 1 THEN r.remainder
          ELSE 0
        END
      )::NUMERIC AS assigned_capacity
    FROM
      proportional p
      JOIN remainder_per_orig r ON p.original_id = r.original_id
  )
UPDATE _parking_parkings_cutted pc
SET
  -- Remove area tags since they're no longer accurate after splitting
  tags = (
    pc.tags - ARRAY['area', 'area_source', 'area_confidence']
  ) || jsonb_build_object(
    /* sql-formatter-disable */
    'capacity', a.assigned_capacity,
    'capacity_source', (pc.tags ->> 'capacity_source') || '_redistributed'
    /* sql-formatter-enable */
  )
FROM
  assigned a
WHERE
  pc.id = a.id
  AND pc.tags ->> 'capacity_source' = 'tag';

-- Branch 2: other capacity (estimated etc.) — proportional decimal only; no remainder.
WITH
  -- Per original_id: total length, total capacity; only groups with > 1 segment and capacity_source != 'tag'.
  total_lengths AS (
    SELECT
      original_id,
      SUM(ST_Length (geom)) AS total_length,
      MAX((tags ->> 'capacity')::NUMERIC) AS total_capacity,
      MAX(tags ->> 'capacity_source') AS capacity_source,
      COUNT(*) AS count
    FROM
      _parking_parkings_cutted
    WHERE
      tags ? 'capacity'
    GROUP BY
      original_id
    HAVING
      COUNT(*) > 1
      AND MAX(tags ->> 'capacity_source') IS DISTINCT FROM 'tag'
  ),
  -- Per segment: frac (segment_length / total_length), total_capacity.
  proportional AS (
    SELECT
      pc.id,
      pc.original_id,
      seg_len / tl.total_length AS frac,
      tl.total_capacity
    FROM
      (
        SELECT
          id,
          original_id,
          ST_Length (geom) AS seg_len
        FROM
          _parking_parkings_cutted
        WHERE
          tags ? 'capacity'
          AND (
            (tags ->> 'capacity_source') IS DISTINCT FROM 'tag'
            OR (tags ->> 'capacity_source') IS NULL
          )
      ) pc
      JOIN total_lengths tl ON pc.original_id = tl.original_id
  ),
  -- Final capacity: proportional decimal (total_capacity * frac); sum = original.
  assigned AS (
    SELECT
      p.id,
      (p.total_capacity * p.frac)::NUMERIC AS assigned_capacity
    FROM
      proportional p
  )
UPDATE _parking_parkings_cutted pc
SET
  -- Remove area tags since they're no longer accurate after splitting
  tags = (
    pc.tags - ARRAY['area', 'area_source', 'area_confidence']
  ) || jsonb_build_object(
    /* sql-formatter-disable */
    'capacity', a.assigned_capacity,
    'capacity_source', (pc.tags ->> 'capacity_source') || '_redistributed'
    /* sql-formatter-enable */
  )
FROM
  assigned a
WHERE
  pc.id = a.id
  AND pc.tags ->> 'capacity_source' IS DISTINCT FROM 'tag';

DO $$ BEGIN RAISE NOTICE 'END redistributing parking capacities at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;
