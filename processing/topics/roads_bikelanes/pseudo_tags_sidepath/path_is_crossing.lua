-- Crossing detector for the sidepath source table / CSV.
-- Must match `road_classification_road_value` crossing classes (all footway/cycleway/path
-- crossings), not `is_crossing_pattern` alone — that helper is bike-only (`bicycle=yes|designated`)
-- and would miss ~95 % of `roadsPathClasses` `footway_crossing` rows.
local road_classification_road_value = require('topics.roads_bikelanes.roads.road_classification_road_value')
local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local SET = require('topics.helper.sets')

local CROSSING_ROAD_VALUES = SET.set({
  'footway_crossing',
  'cycleway_crossing',
  'footway_cycleway_crossing',
})

---@param tags OsmTags
---@return boolean
local function path_is_crossing(tags)
  local road_value = road_classification_road_value(tags)
  return CROSSING_ROAD_VALUES[road_value] or bikelane_categories.is_crossing_pattern(tags)
end

return path_is_crossing
