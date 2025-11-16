-- WHAT IT DOES:
-- Mark bus stop obstacle points as discarded when explicit parking is allowed.
-- * Check if bus stop has explicit parking tag (parking != 'no')
-- * Set `discard: true` tag on obstacle points
-- * Discarded cutouts moved to `_parking_discarded_cutouts` in `cutouts/3_handle_discarded.sql` (stored for debugging, not shown in final cutouts)
-- * When explicit parking rules exist, they overwrite our cutouts
-- INPUT: `_parking_obstacle_points_projected` (linestring), `_parking_road_parkings` (linestring)
-- OUTPUT: `_parking_obstacle_points_projected` (updated with discard tag)
--
UPDATE _parking_obstacle_points_projected op
SET
  tags = op.tags || '{"discard": true, "reason": "explicit_parking_at_busstop"}'::JSONB
FROM
  _parking_road_parkings p
WHERE
  ST_Expand (op.geom, 5) && p.geom
  AND op.tags ->> 'category' IN ('bus_stop', 'bus_stop_conditional')
  AND p.tags ->> 'parking' IS DISTINCT FROM 'no';
