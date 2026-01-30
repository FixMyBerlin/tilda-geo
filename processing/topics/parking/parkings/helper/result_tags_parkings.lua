require('init')
require('DefaultId')
require('Metadata')
require('RoadClassificationRoadValue')
require('Log')
local road_width_tags = require('road_width_tags')
local capacity_tags = require('capacity_tags')
local THIS_OR_THAT = require('this_or_that')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')
local SURFACE_TAGS = require('surface_tags')

-- EXAMPLE
-- INPUT
-- ['parking:left'] = 'no',
-- ['parking:left:restriction'] = 'no_stopping',
-- ['parking:right'] = 'lane',
-- ['parking:right:fee'] = 'no',
-- ['parking:right:markings'] = 'yes',
-- ['parking:right:orientation'] = 'parallel',
-- ['parking:right:restriction:conditional'] = 'loading_only @ (Mo-Fr 08:00-18:00)',
--
-- LEFT
-- parent_highway = 'residential',
-- parking = 'no',
-- restriction = 'no_stopping',
-- side = 'left'
--
-- RIGHT
-- fee = 'no',
-- markings = 'yes',
-- orientation = 'parallel',
-- parent_highway = 'residential',
-- parking = 'lane',
-- ['restriction:conditional'] = 'loading_only @ (Mo-Fr 08:00-18:00)',
-- side = 'right'

local function result_tags_parkings(object)
  local id = DefaultId(object) .. '/' .. object.tags.side

  local road_width_tags_result = road_width_tags(object.tags)
  local capacity_tags_result = capacity_tags(object.tags)
  local surface_tags_result = SURFACE_TAGS.surface_tags_with_parent(object.tags, object._parent_tags)
  local conditional_categories_result = classify_parking_conditions.classify_parking_conditions(object.tags, 'assumed_free')

  -- CRITICAL: Keep these lists in sync:
  -- 1. `result_tags` in `processing/topics/parking/parkings/helper/result_tags_parkings.lua`
  -- 2. `result_tags` in `processing/topics/parking/separate_parkings/helper/result_tags_separate_parking.lua`
  -- 3. `result_tags` in `processing/topics/parking/off_street_parking/helper/result_tags_off_street_parking.lua`
  -- 4. `jsonb_build_object` in `processing/topics/parking/4_merge_parkings.sql`
  local result_tags = {
    side = object.tags.side, -- see transform_parkings()
    source = 'parent_highway',

    -- Road properties
    road = RoadClassificationRoadValue(object._parent_tags),
    road_name = THIS_OR_THAT.value(SANITIZE_TAGS.road_name(object.tags), SANITIZE_TAGS.road_name(object._parent_tags)),
    road_width = road_width_tags_result.value,
    road_width_confidence = road_width_tags_result.confidence,
    road_width_source = road_width_tags_result.source,
    road_oneway = SANITIZE_TAGS.oneway_road(object._parent_tags),
    operator_type = THIS_OR_THAT.value(SANITIZE_TAGS.operator_type(object.tags), SANITIZE_TAGS.operator_type(object._parent_tags)) or 'assumed_public',
    mapillary = SANITIZE_TAGS.safe_string(object.tags.mapillary) or SANITIZE_TAGS.safe_string(object._parent_tags.mapillary),

    -- Capacity & Area
    capacity = capacity_tags_result.value,
    capacity_source = capacity_tags_result.source,
    capacity_confidence = capacity_tags_result.confidence,
    area = nil,
    area_confidence = nil,
    area_source = nil,

    -- Parking properties
    condition_category = conditional_categories_result.condition_category,
    condition_vehicles = conditional_categories_result.condition_vehicles,
    covered = SANITIZE_TAGS.covered(object.tags.covered),
    direction = SANITIZE_PARKING_TAGS.direction(object.tags.direction),
    fee = SANITIZE_PARKING_TAGS.fee(object.tags.fee),
    informal = SANITIZE_TAGS.informal(object.tags.informal),
    location = SANITIZE_PARKING_TAGS.location(object.tags.location),
    markings = SANITIZE_PARKING_TAGS.markings(object.tags.markings),
    orientation = SANITIZE_PARKING_TAGS.orientation(object.tags.orientation),
    parking = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, object._parent_tags.dual_carriageway),
    restriction = SANITIZE_PARKING_TAGS.restriction(object.tags.restriction),
    reason = SANITIZE_PARKING_TAGS.reason(object.tags.reason),
    staggered = SANITIZE_PARKING_TAGS.staggered(object.tags.staggered),
    traffic_sign = SANITIZE_TAGS.traffic_sign(object.tags.traffic_sign),
    zone = SANITIZE_TAGS.safe_string(object.tags.zone),

    -- Access
    access = SANITIZE_TAGS.access(object.tags.access),

    -- Surface
    surface = surface_tags_result.value,
    surface_confidence = surface_tags_result.confidence,
    surface_source = surface_tags_result.source,
  }

  local cleaned_tags, replaced_tags = sanitize_cleaner.split_cleaned_and_replaced_tags(result_tags, object.tags)

  return {
    id = id,
    side = object.tags.side,
    tags = cleaned_tags,
    meta = Metadata(object),
  }, replaced_tags
end

return result_tags_parkings
