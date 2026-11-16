local is_oneway_road = require('topics.roads_bikelanes.bikelanes.helper.is_oneway_road')

-- Whether the published line of a lane or track tagged on the road (`cycleway:left|right|both`)
-- runs against the drawing direction of the road. One-way lines point in the riding direction.
-- `cycleway:<side>:oneway` is relative to the drawing direction of the road:
-- https://wiki.openstreetmap.org/wiki/Key:cycleway:right:oneway
-- - `yes`: with the way; `-1`: against it (values after `normalize_oneway_tags`).
-- - Missing tag (wiki default, no need to tag it): on a oneway road both sides follow the road
--   (against the way on `oneway=-1`); on other roads the right side runs with the way, the left side against it.
-- - `no` or any other value (both directions): the same side rule as on other roads.
-- Lines of the road itself (`_side=self`) keep the drawing direction.
---@param tags OsmTags transformed tags: for `_side` left|right `oneway` is `cycleway:<side>:oneway`
---@return boolean
local function side_line_reversed(tags)
  local side = tags._side
  if side ~= 'left' and side ~= 'right' then
    return false
  end

  local direction = tags['oneway:bicycle'] or tags.oneway
  if direction == '-1' then
    return true
  end
  if direction == 'yes' then
    return false
  end

  local parent = tags._parent or {}
  if direction == nil and is_oneway_road(parent) then
    return parent.oneway == '-1'
  end
  return side == 'left'
end

return side_line_reversed
