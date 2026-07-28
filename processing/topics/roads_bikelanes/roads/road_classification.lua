local derive_traffic_signs = require('topics.helper.derive_traffic_signs')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local parse_length = require('topics.helper.parse_length')
local merge_table = require('topics.helper.merge_table')
local road_classification_road_value = require('topics.roads_bikelanes.roads.road_classification_road_value')

---@param object_tags OsmTags
---@return table
local function road_classification(object_tags)
  local result_tags = {
    road = road_classification_road_value(object_tags),
    oneway = SANITIZE_TAGS.oneway_road(object_tags),
    oneway_bicycle = SANITIZE_TAGS.oneway_bicycle(object_tags['oneway:bicycle']),
    width = parse_length(object_tags.width),
    width_source = SANITIZE_TAGS.safe_string(object_tags['source:width']),
    width_effective = parse_length(object_tags['width:effective']),
    bridge = SANITIZE_TAGS.boolean_yes(object_tags.bridge),
    tunnel = SANITIZE_TAGS.boolean_yes(object_tags.tunnel),
  }

  merge_table(result_tags, derive_traffic_signs(object_tags))

  return result_tags
end

return road_classification
