require('init')
local merge_table = require('merge_table')
local default_id = require('default_id')
local metadata = require('metadata')
local log = require('log')
local CLEANER = require('sanitize_cleaner')
local SANITIZE_TAGS = require('sanitize_tags')

local function result_tags_obstacles(result)
  local id = default_id(result.object)

  local result_tags = {
    category = result.category.id,
    source = result.category.source,
    buffer_radius = result.category:get_buffer_radius(result.object.tags),
  }

  result_tags.osm_mapillary = SANITIZE_TAGS.safe_string(result.object.tags.mapillary)
  for _, tag_key in ipairs(result.category.tags_cc) do
    result_tags['osm_' .. tag_key] = SANITIZE_TAGS.safe_string(result.object.tags[tag_key])
  end
  merge_table(result_tags, result.category:get_tags(result.object.tags)) -- those are sanitized already

  local result_meta = metadata(result)

  local cleaned_tags, replaced_tags = CLEANER.separate_tags(result_tags, result.object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = result_meta,
  }, replaced_tags
end

return result_tags_obstacles
