require('init')
require('MergeTable')
require('DefaultId')
require('Metadata')
require('Log')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')

local function result_tags_separate_parking(result, area)
  local id = DefaultId(result.object)

  local conditional_categories = classify_parking_conditions.classify_parking_conditions(result.object.tags)

  local result_tags_surface = {
    value = SANITIZE_TAGS.surface(result.object.tags),
    confidence = 'high',
    source = result.object.tags.surface == SANITIZE_TAGS.surface(result.object.tags) and 'tag' or 'tag_transformed',
  }

  local result_tags = {
    -- Align common tag names with kerb-line parkings where applicable
    category = result.category.id,
    source = result.category.source,
    buffer_radius = result.category:get_buffer_radius(result.object.tags),
    covered = SANITIZE_PARKING_TAGS.covered(result.object.tags.covered),
    location = SANITIZE_PARKING_TAGS.location(result.object.tags.location),

    -- Surface (from helper)
    surface = result_tags_surface.value,
    surface_confidence = result_tags_surface.confidence,
    surface_source = result_tags_surface.source,

    -- Conditional categories (from helper)
    condition_category = conditional_categories.condition_category,
    condition_vehicles = conditional_categories.condition_vehicles,
    mapillary = result.object.tags.mapillary,
  }

  -- Add unspecified tags; those will mostly be visible in the underscore-helper tables
  MergeTable(result_tags, result.category:get_tags(result.object.tags))
  -- Add tags `area`, `capacity`, `capacity_confidence`, `capacity_source`
  MergeTable(result_tags, result.category:get_capacity(result.object.type, result.object.tags, area))

  local cleaned_tags, replaced_tags = sanitize_cleaner(result_tags, result.object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = Metadata(result),
  }, replaced_tags
end

return result_tags_separate_parking
