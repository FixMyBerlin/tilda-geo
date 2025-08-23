require('init')
require('DefaultId')
require('Metadata')
require('RoadClassificationRoadValue')
require('road_width')
require('Log')
local parse_length = require('parse_length')
local THIS_OR_THAT = require('this_or_that')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')

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

  local width, width_confidence, width_source = road_width(object.tags)
  local capacity = parse_length(object.tags.capacity)
  local capacity_source = nil
  local capacity_confidence = nil
  if capacity ~= nil then
    capacity_source = 'tag'
    capacity_confidence = 'high'
  end

  local result_tags_surface = THIS_OR_THAT.value_confidence_source('surface',
    {
      surface = SANITIZE_TAGS.surface(object.tags),
      surface_confidence = 'high',
      surface_source = object.tags.surface == SANITIZE_TAGS.surface(object.tags) and 'tag' or 'tag_transformed',
    },
    {
      surface = SANITIZE_TAGS.surface(object._parent_tags),
      surface_confidence = 'medium',
      surface_source = object._parent_tags.surface == SANITIZE_TAGS.surface(object._parent_tags) and 'parent_highway_tag' or 'parent_highway_tag_transformed',
    }
  )

  -- Classify parking conditions into merged categories
  local conditional_categories = classify_parking_conditions.classify_parking_conditions(object.tags)

  -- CRITICAL: Keep these lists in sync:
  -- 1. `result_tags` in `processing/topics/parking/parkings/helper/result_tags_parkings.lua`
  -- 2. `merge_tags` in `processing/topics/parking/separate_parkings/helper/result_tags_separate_parking.lua`
  -- 3. `jsonb_build_object` in `processing/topics/parking/4_merge_parkings.sql`
  local result_tags = {
    side = object.tags.side, -- see transform_parkings()
    source = 'parent_highway',

    -- Road properties
    road = RoadClassificationRoadValue(object._parent_tags),
    road_name = THIS_OR_THAT.value(SANITIZE_TAGS.road_name(object.tags), SANITIZE_TAGS.road_name(object._parent_tags)),
    road_width = width,
    road_width_confidence = width_confidence,
    road_width_source = width_source,
    road_oneway = SANITIZE_TAGS.oneway_road(object._parent_tags),
    operator_type = THIS_OR_THAT.value(SANITIZE_PARKING_TAGS.operator_type(object.tags['operator:type']), SANITIZE_PARKING_TAGS.operator_type(object._parent_tags['operator:type'])),
    mapillary = object.tags.mapillary or object._parent_tags.mapillary,

    -- Capacity & Area
    capacity = capacity,
    capacity_source = capacity_source,
    capacity_confidence = capacity_confidence,
    area = nil,
    area_confidence = nil,
    area_source = nil,

    -- Parking properties
    condition_category = conditional_categories.condition_category,
    condition_vehicles = conditional_categories.condition_vehicles,
    covered = SANITIZE_PARKING_TAGS.covered(object.tags.covered),
    direction = SANITIZE_PARKING_TAGS.direction(object.tags.direction),
    fee = SANITIZE_PARKING_TAGS.fee(object.tags.fee),
    informal = SANITIZE_PARKING_TAGS.informal(object.tags.informal),
    location = SANITIZE_PARKING_TAGS.location(object.tags.location),
    markings = SANITIZE_PARKING_TAGS.markings(object.tags.markings),
    orientation = SANITIZE_PARKING_TAGS.orientation(object.tags.orientation),
    parking = SANITIZE_PARKING_TAGS.parking_extended(object.tags.parking, object._parent_tags.dual_carriageway),
    reason = SANITIZE_PARKING_TAGS.reason(object.tags.reason),
    staggered = SANITIZE_PARKING_TAGS.staggered(object.tags.staggered),
    traffic_sign = SANITIZE_TAGS.traffic_sign(object.tags.traffic_sign),
    zone = SANITIZE_TAGS.safe_string(object.tags.zone),

    -- Surface
    surface = result_tags_surface.value,
    surface_confidence = result_tags_surface.confidence,
    surface_source = result_tags_surface.source,
  }

  local cleaned_tags, replaced_tags = sanitize_cleaner(result_tags, object.tags)

  return {
    id = id,
    side = object.tags.side,
    tags = cleaned_tags,
    meta = Metadata(object),
  }, replaced_tags
end

return result_tags_parkings
