local extract_public_tags = require('topics.helper.extract_public_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

local function result_tags_landuse(tags)
  local result_tags = {
    landuse = tags.landuse or tags.amenity or tags.leisure,
    access = SANITIZE_TAGS.access(tags.access),
    name = SANITIZE_TAGS.safe_string(tags.name),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
  }
  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_landuse
