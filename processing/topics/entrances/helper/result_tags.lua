local extract_public_tags = require('topics.helper.extract_public_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

---@param tags OsmTags
---@param category 'public_transport'|'building'
---@return OsmTags, OsmTags
local function result_tags(tags, category)
  local result_tags = {
    category = category,
    entrance = SANITIZE_TAGS.safe_string(tags.entrance),
    ref = SANITIZE_TAGS.safe_string(tags.ref),
    name = SANITIZE_TAGS.safe_string(tags.name),
    wheelchair = SANITIZE_TAGS.wheelchair(tags.wheelchair),
    access = SANITIZE_TAGS.access(tags.access),
  }
  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags
