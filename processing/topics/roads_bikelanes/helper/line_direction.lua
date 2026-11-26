local is_oneway_road = require('topics.roads_bikelanes.bikelanes.helper.is_oneway_road')
local merge_table = require('topics.helper.merge_table')
local reverse_linestring = require('topics.roads_bikelanes.routing_infra.reverse_linestring')

-- Published lines point in the direction of travel. When that is against the drawing direction of
-- the OSM way, the line is reversed and the tags that follow the way are swapped to follow the line.
-- One-way values are read after `normalize_oneway_tags` (`yes`, `-1`, `no`).

--- The line of the way itself runs against the way on `oneway=-1` or `oneway:bicycle=-1`.
--- With `oneway=-1` and `oneway:bicycle=no` it follows the motor vehicle direction.
---@param tags OsmTags
---@return boolean
local function way_reversed(tags)
  return tags.oneway == '-1' or tags['oneway:bicycle'] == '-1'
end

--- The line of a bikelane row. The row of the way itself (`_side=self`) follows `way_reversed`.
--- A lane or track tagged on the road (`cycleway:left|right|both`) follows `cycleway:<side>:oneway`,
--- which is relative to the drawing direction of the road:
--- https://wiki.openstreetmap.org/wiki/Key:cycleway:right:oneway
--- - `yes`: with the way; `-1`: against it.
--- - Missing tag (wiki default, no need to tag it): on a oneway road both sides follow the road
---   (against the way on `oneway=-1`); on other roads the right side runs with the way, the left side against it.
--- - `no` or any other value (both directions): the same side rule as on other roads.
---@param tags OsmTags transformed tags: for `_side` left|right `oneway` is `cycleway:<side>:oneway`
---@return boolean
local function bikelane_reversed(tags)
  local side = tags._side
  if side ~= 'left' and side ~= 'right' then
    return way_reversed(tags)
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

--- Whether a lane tagged on the road (`_side` left|right) lies left of its published line.
--- A left lane lies left of a line that runs with the way, a right lane left of a line against it.
---@param tags OsmTags transformed tags with `_side` left|right
---@return boolean
local function lane_left_of_line(tags)
  local runs_with_way = not bikelane_reversed(tags)
  if tags._side == 'left' then
    return runs_with_way
  end
  return not runs_with_way
end

local FORWARD_BACKWARD_PAIRS = {
  { 'mapillary_forward', 'mapillary_backward' },
  { 'traffic_sign:forward', 'traffic_sign:backward' },
  { 'osm_maxspeed:forward', 'osm_maxspeed:backward' },
}

local LEFT_RIGHT_PAIRS = {
  { 'bikelane_left', 'bikelane_right' },
  { 'traffic_mode_left', 'traffic_mode_right' },
  { 'separation_left', 'separation_right' },
  { 'buffer_left', 'buffer_right' },
  { 'marking_left', 'marking_right' },
}

---@param tags table
---@param pairs string[][]
---@return table
local function swapped(tags, pairs)
  local result = merge_table({}, tags)
  for _, pair in ipairs(pairs) do
    result[pair[1]], result[pair[2]] = tags[pair[2]], tags[pair[1]]
  end
  return result
end

--- Tags of a reversed lane tagged on the road: only forward and backward follow the way.
---@param tags table
---@return table new table
local function swap_lane_tags(tags)
  return swapped(tags, FORWARD_BACKWARD_PAIRS)
end

--- Tags of the reversed line of the way itself: forward and backward, and left and right.
---@param tags table
---@return table new table
local function swap_way_tags(tags)
  return swapped(swapped(tags, FORWARD_BACKWARD_PAIRS), LEFT_RIGHT_PAIRS)
end

--- Geometry and tags of the line of the way itself (`roads`, `roadsPathClasses`, `bikeSuitability`,
--- `bikelanes_presence`), reversed when `way_reversed`.
---@param object_tags OsmTags
---@param object_geom table
---@param tags table
---@return table geom
---@return table tags
local function way_line(object_tags, object_geom, tags)
  if way_reversed(object_tags) then
    return reverse_linestring(object_geom), swap_way_tags(tags)
  end
  return object_geom, tags
end

return {
  way_reversed = way_reversed,
  bikelane_reversed = bikelane_reversed,
  lane_left_of_line = lane_left_of_line,
  swap_lane_tags = swap_lane_tags,
  swap_way_tags = swap_way_tags,
  way_line = way_line,
}
