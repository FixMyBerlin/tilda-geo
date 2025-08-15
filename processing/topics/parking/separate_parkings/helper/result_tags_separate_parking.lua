require('init')
require('MergeTable')
require('DefaultId')
require('Metadata')
require('Log')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
local parking_point_radius = require('parking_point_radius')

local function result_tags_separate_parking(result, area)
  local id = DefaultId(result.object)

  local result_tags = {
    buffer_radius = parking_point_radius(result.object),
  }

  local conditional_categories_tags = classify_parking_conditions.classify_parking_conditions(result.object.tags)
  local surface_tags = {
    value = SANITIZE_TAGS.surface(result.object.tags),
    confidence = 'high',
    source = result.object.tags.surface == SANITIZE_TAGS.surface(result.object.tags) and 'tag' or 'tag_transformed',
  }
  local capacity_tags = result.category:get_capacity(result.object.type, result.object.tags, area)

  local merge_tags = {
    -- Align common tag names with kerb-line parkings where applicable
    category = result.category.id,
    source = result.category.source,
    amenity =result.object.tags.amenity,
    parking =result.object.tags.parking, -- sanitized by 'conditions'
    orientation = SANITIZE_PARKING_TAGS.orientation(result.object.tags.orientation),
    informal = SANITIZE_PARKING_TAGS.informal(result.object.tags.informal),
    access = SANITIZE_TAGS.access(result.object.tags.access),
    markings = SANITIZE_PARKING_TAGS.markings(result.object.tags.markings),
    restriction = SANITIZE_PARKING_TAGS.restriction(result.object.tags.restriction),
    traffic_sign = SANITIZE_TAGS.traffic_sign(result.object.tags.traffic_sign),
    covered = SANITIZE_PARKING_TAGS.covered(result.object.tags.covered),
    location = SANITIZE_PARKING_TAGS.location(result.object.tags.location),

    -- Surface
    surface = surface_tags.value,
    surface_confidence = surface_tags.confidence,
    surface_source = surface_tags.source,

    -- Conditional categories
    condition_category = conditional_categories_tags.condition_category,
    condition_vehicles = conditional_categories_tags.condition_vehicles,
    mapillary = result.object.tags.mapillary,

    -- Capacity tags
    area = capacity_tags.area,
    capacity = capacity_tags.capacity,
    capacity_confidence = capacity_tags.capacity_confidence,
    capacity_source = capacity_tags.capacity_source,
  }

  MergeTable(result_tags, merge_tags)

  local cleaned_tags, replaced_tags = sanitize_cleaner(result_tags, result.object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = Metadata(result),
  }, replaced_tags
end

return result_tags_separate_parking
