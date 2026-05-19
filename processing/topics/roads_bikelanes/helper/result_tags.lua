local road_classification = require('topics.roads_bikelanes.roads.road_classification')
local lit = require('topics.roads_bikelanes.lit.lit')
local surface_quality = require('topics.roads_bikelanes.surfaceQuality.surface_quality')
local merge_table = require('topics.helper.merge_table')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

---@param object_tags OsmTags
---@return SharedResultTags
local function result_tags_roads_bikelanes(object_tags)
  local road_result_tags = {
    name = SANITIZE_TAGS.safe_string(object_tags.name or object_tags.ref or object_tags['is_sidepath:of:name'] or object_tags['street:name']),
    length = object_tags._length,
    lifecycle = object_tags.lifecycle or SANITIZE_ROAD_TAGS.temporary(object_tags),
    mapillary_coverage = object_tags.mapillary_coverage,
    mapillary = object_tags.mapillary,
    mapillary_forward = object_tags['mapillary:forward'],
    mapillary_backward = object_tags['mapillary:backward'],
    mapillary_traffic_sign = object_tags['source:traffic_sign:mapillary'],
    description = SANITIZE_TAGS.safe_string(object_tags.description or object_tags.note),
    operator_type = SANITIZE_TAGS.operator_type(object_tags),
    informal = SANITIZE_TAGS.informal(object_tags.informal),
    covered = SANITIZE_TAGS.covered_or_indoor(object_tags),
  }
  merge_table(road_result_tags, road_classification(object_tags))
  merge_table(road_result_tags, lit(object_tags))
  merge_table(road_result_tags, surface_quality(object_tags))

  return road_result_tags
end

return result_tags_roads_bikelanes
