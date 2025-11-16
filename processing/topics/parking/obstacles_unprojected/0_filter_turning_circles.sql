-- WHAT IT DOES:
-- Mark turnaround points (turning circles and turning loops) as discarded when ALL connected roads have explicit parking=no.
-- * Check if all connected roads have parking='no' tag
-- * Set `discard: true` tag on turnaround points
-- * Discarded cutouts moved to `_parking_discarded_cutouts` in `cutouts/3_handle_discarded.sql`
-- * When explicit parking rules exist, they overwrite our cutouts
-- INPUT: `_parking_turnaround_points` (point), `_parking_node_road_mapping`, `_parking_road_parkings` (linestring)
-- OUTPUT: `_parking_turnaround_points` (updated with discard tag)
--
DO $$ BEGIN RAISE NOTICE 'START filtering turning circles at %', clock_timestamp() AT TIME ZONE 'Europe/Berlin'; END $$;

WITH
  tp_w_explicit_parking AS (
    SELECT
      tp.osm_id
    FROM
      _parking_turnaround_points tp
      LEFT JOIN _parking_node_road_mapping nrm ON tp.osm_id = nrm.node_id
      LEFT JOIN _parking_road_parkings rp ON nrm.way_id = rp.osm_id
    GROUP BY
      tp.osm_id
    HAVING
      BOOL_AND(rp.tags ->> 'parking' = 'no')
  )
UPDATE _parking_turnaround_points
SET
  tags = tags || '{"discard": true}'::JSONB
WHERE
  _parking_turnaround_points.osm_id IN (
    SELECT
      osm_id
    FROM
      tp_w_explicit_parking
  );
