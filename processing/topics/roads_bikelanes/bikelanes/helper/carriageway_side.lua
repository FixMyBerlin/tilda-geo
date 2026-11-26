local DIRECTION_SIDE = require('topics.helper.direction_side')
local LINE_DIRECTION = require('topics.roads_bikelanes.helper.line_direction')

-- On which side of a bikelane the carriageway lies, in the left/right of its own tags.
-- For a lane or track tagged on the road (`cycleway:left|right|both`), the second left/right of
-- `cycleway:<side>:separation:<left|right>`, `…:traffic_mode:*`, `…:buffer:*` and `…:marking:*`
-- is relative to the riding direction of its published line:
-- https://wiki.openstreetmap.org/wiki/Key:separation ("Directions of left and right")
-- - Two-way road, `cycleway:left` or `cycleway:right`: carriageway `left`.
-- - `oneway=yes`, `cycleway:left` (rides with the way): carriageway `right`.
-- - `oneway=-1`, `cycleway:right` (rides against the way): carriageway `right`.
-- - Contraflow `cycleway:left:oneway=-1` on `oneway=yes`: carriageway `left`.
-- A separately mapped way (`_side=self`) has its left/right in the drawing direction. The road is
-- taken to lie left of the riding direction, which is the right of the way on `oneway=-1`.
---@param tags OsmTags transformed tags with `_side` (and `_parent` for left|right)
---@return 'left'|'right' road_side
---@return 'left'|'right' far_side the side away from the carriageway (kerb or sidewalk for lanes on the road)
local function carriageway_side(tags)
  local road_on_right
  if tags._side == 'left' or tags._side == 'right' then
    road_on_right = LINE_DIRECTION.lane_left_of_line(tags)
  else
    road_on_right = LINE_DIRECTION.way_reversed(tags)
  end
  local road_side = road_on_right and 'right' or 'left'
  return road_side, DIRECTION_SIDE.opposite_side(road_side)
end

return carriageway_side
