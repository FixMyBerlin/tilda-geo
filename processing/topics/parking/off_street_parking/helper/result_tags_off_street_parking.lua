require('init')
require("CopyTags")
require("MergeTable")
require("DefaultId")
require("Metadata")
require("Log")
local sanitize_cleaner = require('sanitize_cleaner')

local function result_tags_off_street_parking(result, area)
  local result_tags = {
    category = result.category.id,
  }

  local global_tags_cc = {
    "mapillary",
  }
  CopyTags(result_tags, result.object.tags, global_tags_cc, "osm_")
  CopyTags(result_tags, result.object.tags, result.category.tags_cc, "osm_")
  MergeTable(result_tags, result.category:get_tags(result.object.tags)) -- those are sanitized already
  if area ~= nil then
    MergeTable(result_tags, result.category:get_capacity(result.object.tags, area))
  end

  local result_meta = Metadata(result)

  local cleaned_tags, replaced_tags = sanitize_cleaner(result_tags, result.object.tags)

  return {
    id = DefaultId(result.object),
    tags = cleaned_tags,
    meta = result_meta,
  }, replaced_tags
end

return result_tags_off_street_parking
