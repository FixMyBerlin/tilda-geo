local merge_table = require('topics.helper.merge_table')
local derive_surface = require('topics.helper.derive_surface')
local derive_smoothness = require('topics.helper.derive_smoothness')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')

---@param object_tags OsmTags
---@return table
local function surface_quality(object_tags)
  local result_tags = {}

  merge_table(result_tags, derive_surface(object_tags))
  merge_table(result_tags, derive_smoothness(object_tags))
  result_tags.surface_color = SANITIZE_ROAD_TAGS.surface_color(object_tags)

  return result_tags
end

return surface_quality
