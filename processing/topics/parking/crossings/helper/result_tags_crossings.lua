require('init')
require("CopyTags")
require("MergeTable")
require("DefaultId")
require("Metadata")
require("Log")
local sanitize_cleaner = require('sanitize_cleaner')

local function result_tags_crossings(result)
  local id = DefaultId(result.object) .. "/" .. result.object.tags.side

  local result_tags = {
    category = result.category.id,
    source = result.category.source,
    side = result.object.tags.side,
    buffer_radius = result.category:get_buffer_radius(result.object.tags),
  }

  local global_tags_cc = {
    "mapillary",
  }
  CopyTags(result_tags, result.object.tags, global_tags_cc, "osm_")
  CopyTags(result_tags, result.object.tags, result.category.tags_cc, "osm_")
  MergeTable(result_tags, result.category:get_tags(result.object.tags)) -- those are sanitized already

  local result_meta = Metadata(result)

  local cleaned_tags, replaced_tags = sanitize_cleaner.split_cleaned_and_replaced_tags(result_tags, result.object.tags)

  return {
    id = id,
    tags = cleaned_tags,
    meta = result_meta,
  }, replaced_tags
end

return result_tags_crossings
