require('init')
require('MergeTable')
require('DefaultId')
require('Metadata')
require('Log')
local parse_capacity = require('parse_capacity')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

local function result_tags_separate_parking(category, object, area)
  local id = DefaultId(object)

  local capacity, capacity_source, capacity_confidence = parse_capacity(object.tags)
  local surface_tags = {
    value = SANITIZE_TAGS.surface(object.tags),
    confidence = 'high',
    source = object.tags.surface == SANITIZE_TAGS.surface(object.tags) and 'tag' or 'tag_transformed',
  }
  local conditional_categories_tags = classify_parking_conditions.classify_parking_conditions(object.tags)

  -- CRITICAL: Keep these lists in sync:
  -- 1. `result_tags` in `processing/topics/parking/parkings/helper/result_tags_parkings.lua`
  -- 2. `result_tags` in `processing/topics/parking/separate_parkings/helper/result_tags_separate_parking.lua`
  -- 3. `jsonb_build_object` in `processing/topics/parking/4_merge_parkings.sql`
  local result_tags = {
    side = nil,
    source = object.type == 'node' and 'separate_parking_points' or 'separate_parking_areas',

    -- Road properties
    road = nil,
    road_name = SANITIZE_TAGS.road_name(object.tags),
    road_width = nil,
    road_width_confidence = nil,
    road_width_source = nil,
    road_oneway = nil,
    operator_type = SANITIZE_TAGS.operator_type(object.tags),
    mapillary = object.tags.mapillary,

    -- Area
    capacity = capacity,
    capacity_source = capacity_source,
    capacity_confidence = capacity_confidence,
    area = area,
    area_confidence = 'high',
    area_source = 'geometry',

    -- Parking properties
    condition_category = conditional_categories_tags.condition_category,
    condition_vehicles = conditional_categories_tags.condition_vehicles,
    covered = SANITIZE_TAGS.covered(object.tags.covered),
    direction = SANITIZE_PARKING_TAGS.direction(object.tags.direction),
    fee = SANITIZE_PARKING_TAGS.fee(object.tags.fee),
    informal = SANITIZE_TAGS.informal(object.tags.informal),
    location = SANITIZE_PARKING_TAGS.location(object.tags.location),
    markings = SANITIZE_PARKING_TAGS.markings(object.tags.markings),
    orientation = SANITIZE_PARKING_TAGS.orientation(object.tags.orientation),
    parking = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, nil),
    restriction = SANITIZE_PARKING_TAGS.restriction(object.tags.restriction),
    reason = SANITIZE_PARKING_TAGS.reason(object.tags.reason),
    staggered = nil,
    traffic_sign = SANITIZE_TAGS.traffic_sign(object.tags.traffic_sign),
    zone = SANITIZE_TAGS.safe_string(object.tags.zone),

    -- Surface
    surface = surface_tags.value,
    surface_confidence = surface_tags.confidence,
    surface_source = surface_tags.source,
  }

  MergeTable(result_tags, result_tags)

  local cleaned_tags, replaced_tags = sanitize_cleaner.split_cleaned_and_replaced_tags(result_tags, object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = Metadata(object),
  }, replaced_tags
end

return result_tags_separate_parking
