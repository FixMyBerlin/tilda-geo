require('init')
require('DefaultId')
require('Metadata')
require('RoadClassificationRoadValue')
require('road_name')
require('road_width')
require('Log')
local parse_length = require('parse_length')
require('result_tags_value_helpers')
local this_or_that = require('this_or_that')
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


function result_tags_parkings(object)
  local id = DefaultId(object) .. '/' .. object.tags.side

  local width, width_confidence, width_source = road_width(object.tags)
  local capacity = parse_length(object.tags.capacity)
  local capacity_source = nil
  local capacity_confidence = nil
  if capacity ~= nil then
    capacity_source = 'tag'
    capacity_confidence = 'high'
  end

  local result_tags_surface = this_or_that(
    'surface',
    {
      value = SANITIZE_TAGS.surface(object.tags),
      confidence = 'high',
      source = object.tags.surface == SANITIZE_TAGS.surface(object.tags) and 'tag' or 'tag_transformed'
    },
    {
      value = SANITIZE_TAGS.surface(object._parent_tags),
      confidence = 'medium',
      source = object._parent_tags.surface == SANITIZE_TAGS.surface(object._parent_tags) and 'parent_highway_tag' or 'parent_highway_tag_transformed'
    }
  )

  -- Classify parking conditions into merged categories
  local conditional_categories = classify_parking_conditions.classify_parking_conditions(object.tags)

  -- CRITICAL: This tags list must be kept in sync with processing/topics/parking/4_merge_parkings.sql (all tags used for clustering)
  -- 1. Add to this explicit list below
  -- 2. Add to the SQL clustering columns and jsonb_build_object
  local result_tags = {
    side = object.tags.side, -- see transform_parkings()

    -- Road properties
    road = RoadClassificationRoadValue(object._parent_tags),
    road_name = SANITIZE_TAGS.safe_string(road_name(object.tags)),
    road_width = width,
    road_width_confidence = width_confidence,
    road_width_source = width_source,
    road_oneway = SANITIZE_TAGS.oneway_road(object._parent_tags),
    operator_type = SANITIZE_PARKING_TAGS.operator_type(object.tags['operator:type']),

    -- Parking properties
    parking = parking_value(object),
    orientation = SANITIZE_PARKING_TAGS.orientation(object.tags.orientation),
    capacity = capacity,
    capacity_source = capacity_source,
    capacity_confidence = capacity_confidence,
    markings = SANITIZE_PARKING_TAGS.markings(object.tags.markings),
    direction = SANITIZE_PARKING_TAGS.direction(SANITIZE_TAGS.safe_string(object.tags.direction)),
    staggered = SANITIZE_PARKING_TAGS.staggered(object.tags.staggered),
    fee = SANITIZE_PARKING_TAGS.fee(object.tags.fee),
    -- maxstay = SANITIZE_PARKING_TAGS.maxstay(SANITIZE_TAGS.safe_string(object.tags.maxstay)),
    informal = SANITIZE_PARKING_TAGS.informal(object.tags.informal),
    location = SANITIZE_PARKING_TAGS.location(SANITIZE_TAGS.safe_string(object.tags.location)),

    -- Surface (from helper)
    surface = result_tags_surface and result_tags_surface.value,
    surface_confidence = result_tags_surface and result_tags_surface.confidence,
    surface_source = result_tags_surface and result_tags_surface.source,

    -- Conditional categories (from helper)
    condition_category = conditional_categories.condition_category,
    condition_vehicles = conditional_categories.condition_vehicles,
    mapillary = object.tags.mapillary or object._parent_tags.mapillary,
  }

  local cleaned_tags, replaced_tags = sanitize_cleaner(result_tags, object.tags)

  return {
    id = id,
    side = object.tags.side,
    tags = cleaned_tags,
    meta = Metadata(object),
  }, replaced_tags
end
