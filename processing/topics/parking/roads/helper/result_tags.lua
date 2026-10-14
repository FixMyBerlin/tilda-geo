local default_id = require('topics.helper.default_id')
local metadata = require('topics.helper.metadata')
local road_classification_road_value = require('topics.roads_bikelanes.roads.road_classification_road_value')
local is_driveway_check = require('topics.parking.roads.helper.is_driveway')
local has_parking_check = require('topics.parking.parkings.helper.has_parking')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local SANITIZE_PARKING_TAGS = require('topics.parking.helper.sanitize_parking_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local road_width_tags = require('topics.parking.roads.helper.road_width_tags')

local function result_tags_roads(object)
  local id = default_id(object)
  local road_width_tags_result = road_width_tags(object.tags)
  local is_driveway = is_driveway_check(object.tags)

  local result_tags = {
    highway = object.tags.highway,
    road = road_classification_road_value(object.tags),
    name = SANITIZE_TAGS.road_name(object.tags),
    category = is_driveway and 'driveway' or 'road',
    is_driveway = is_driveway,
    has_parking = has_parking_check(object.tags),
    has_embedded_rails = object.tags.embedded_rails == 'tram',
    bridge = SANITIZE_TAGS.boolean_yes(object.tags.bridge),
    tunnel = SANITIZE_TAGS.boolean_yes(object.tags.tunnel),
    width = road_width_tags_result.value,
    width_confidence = road_width_tags_result.confidence,
    width_source = road_width_tags_result.source,
    -- NOTE: In the future we might want to also check `placement`
    -- (More about `placement` in https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update)
    offset_left = road_width_tags_result.value / 2,
    offset_right = road_width_tags_result.value / 2,
  }

  result_tags.osm_mapillary = SANITIZE_TAGS.safe_string(object.tags.mapillary)
  result_tags.osm_service = SANITIZE_PARKING_TAGS.service(object.tags.service)

  local result_meta = metadata(object)

  local cleaned_tags, replaced_tags = CLEANER.separate_tags(result_tags, object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = result_meta,
  }, replaced_tags
end

return result_tags_roads
