-- Discard cutouts of bus stops (Bushaltestelle) and turning circles (Kreisverkehr) where explicit no parking is tagged.
-- In those cases, the explicit rules overwrite our coutouts.
-- We store the removed cutouts separately for debugging but do not show them in the final parking_cutouts table.
-- get all ids for cutouts that need to be discarded
UPDATE _parking_obstacle_points_projected op
SET
  tags = op.tags || '{"discard": true, "reason": "explicit_parking_at_busstop"}'::JSONB
FROM
  _parking_road_parkings p
WHERE
  ST_Expand (op.geom, 5) && p.geom
  AND op.tags ->> 'category' IN ('bus_stop', 'bus_stop_conditional')
  AND p.tags ->> 'parking' IS DISTINCT FROM 'no';
