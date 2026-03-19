require('init')
local merge_table = require('merge_table')
local derive_surface = require('derive_surface')
local derive_smoothness = require('derive_smoothness')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')

---@param object_tags table
---@return table
local function surface_quality(object_tags)
  local result_tags = {}

  merge_table(result_tags, derive_surface(object_tags))
  merge_table(result_tags, derive_smoothness(object_tags))
  result_tags.surface_color = SANITIZE_ROAD_TAGS.surface_color(object_tags)

  return result_tags
end

return surface_quality
