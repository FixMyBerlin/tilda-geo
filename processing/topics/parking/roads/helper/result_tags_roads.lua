require('init')
require("CopyTags")
require("DefaultId")
require("Metadata")
require("RoadClassificationRoadValue")
local is_driveway_check = require('is_driveway')
local has_parking_check = require('has_parking')
local SANITIZE_TAGS = require('sanitize_tags')
require("road_width")

function result_tags_roads(object)
  local id = DefaultId(object)
  local width, width_confidence, width_source = road_width(object.tags)
  local is_driveway = is_driveway_check(object.tags)

  local result_tags = {
    highway = object.tags.highway,
    road = RoadClassificationRoadValue(object.tags),
    name = SANITIZE_TAGS.road_name(object.tags),
    category = is_driveway and "driveway" or "road",
    is_driveway = is_driveway,
    has_parking = has_parking_check(object.tags),
    width = width,
    width_confidence = width_confidence,
    width_source = width_source,
    -- NOTE: In the future we might want to also check `placement`
    -- (More about `placement` in https://strassenraumkarte.osm-berlin.org/posts/2021-12-31-micromap-update)
    offset_left = width / 2 ,
    offset_right = (width / 2),
  }

  local tags_cc = {
    "mapillary",
    "service",
  }
  CopyTags(result_tags, object.tags, tags_cc, "osm_")

  local result_meta = Metadata(object)

  return {
    id = id,
    tags = result_tags,
    meta = result_meta,
  }
end
