require('init')
require("CopyTags")
require("DefaultId")
require("Metadata")
require("RoadClassificationRoadValue")
local is_driveway_check = require('is_driveway')
local has_parking_check = require('has_parking')
local SANITIZE_TAGS = require('sanitize_tags')
local sanitize_cleaner = require('sanitize_cleaner')
local road_width_tags = require('road_width_tags')

function result_tags_roads(object)
  local id = DefaultId(object)
  local road_width_tags_result = road_width_tags(object.tags)
  local is_driveway = is_driveway_check(object.tags)

  local result_tags = {
    highway = object.tags.highway,
    road = RoadClassificationRoadValue(object.tags),
    name = SANITIZE_TAGS.road_name(object.tags),
    category = is_driveway and "driveway" or "road",
    is_driveway = is_driveway,
    has_parking = has_parking_check(object.tags),
    has_embedded_rails = object.tags.embedded_rails == 'tram',
    width = road_width_tags_result.value,
    width_confidence = road_width_tags_result.confidence,
    width_source = road_width_tags_result.source,
    -- NOTE: In the future we might want to also check `placement`
    -- (More about `placement` in https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update)
    offset_left = road_width_tags_result.value / 2,
    offset_right = road_width_tags_result.value / 2,
  }

  local tags_cc = {
    "mapillary",
    "service",
  }
  CopyTags(result_tags, object.tags, tags_cc, "osm_")

  local result_meta = Metadata(object)

  local cleaned_tags, replaced_tags = sanitize_cleaner.split_cleaned_and_replaced_tags(result_tags, object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = result_meta,
  }, replaced_tags
end
