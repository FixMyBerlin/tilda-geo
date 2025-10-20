-- Mark any turnaround point (turning circles and turning loops)
-- where ALL connected roads have explicit parking=no
-- as discarded.
-- The actual discarding happens later in 0_create_cutouts.sql.
-- TOOD DOCU: Why discard them later?
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
