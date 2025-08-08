require('init')
require('CopyTags')
require('MergeTable')
require('DefaultId')
require('Metadata')
require('Log')
local sanitize_cleaner = require('sanitize_cleaner')
local classify_parking_conditions = require('classify_parking_conditions')

local function result_tags_separate_parking(result, area)
  local id = DefaultId(result.object)

  local result_tags = {
    category = result.category.id,
    source = result.category.source,
    buffer_radius = result.category:get_buffer_radius(result.object.tags),
  }

  local global_tags_cc = {
    'mapillary',
  }
  CopyTags(result_tags, result.object.tags, global_tags_cc, 'osm_')
  CopyTags(result_tags, result.object.tags, result.category.tags_cc, 'osm_')
  MergeTable(result_tags, result.category:get_tags(result.object.tags)) -- those are sanitized already
  MergeTable(result_tags, result.category:get_capacity(result.object.type, result.object.tags, area))

  -- Classify parking conditions into merged categories
  local conditional_categories = classify_parking_conditions.classify_parking_conditions(result.object.tags)
  MergeTable(result_tags, conditional_categories)

  local result_meta = Metadata(result)

  local cleaned_tags, replaced_tags = sanitize_cleaner(result_tags, result.object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = result_meta,
  }, replaced_tags
end

return result_tags_separate_parking
