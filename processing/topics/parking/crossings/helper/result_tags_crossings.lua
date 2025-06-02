require('init')
require("CopyTags")
require("MergeTable")
require("DefaultId")
require("Metadata")
require("Log")

local function result_tags_crossings(result)
  local id = DefaultId(result.object) .. "/" .. result.object.tags.side

  local result_tags = {
    category = result.category.id,
    source = result.category.source,
    side = result.object.tags.side,
    perform_buffer = result.category:get_perform_buffer(result.object.tags),
  }

  local global_tags_cc = {
    "mapillary",
  }
  CopyTags(result_tags, result.object.tags, global_tags_cc, "osm_")
  CopyTags(result_tags, result.object.tags, result.category.tags_cc, "osm_")
  MergeTable(result_tags, result.category:get_tags(result.object.tags)) -- those are sanitized already

  local result_meta = Metadata(result)
  result_meta.updated_age = nil -- Lets start without this because it adds work and might not be needed

  return {
    id = id,
    tags = result_tags,
    meta = result_meta,
  }
end

return result_tags_crossings
