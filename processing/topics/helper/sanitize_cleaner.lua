local SANITIZE_VALUES = require('topics.helper.sanitize_values')
local log = require('topics.helper.log')

-- Returns cleaned_tags, replaced_tags (with _instruction if any replaced)
-- `log_source_overrides`: optional map result_key -> raw OSM value when it differs from `object_tags[result_key]`
---@param tags_to_clean OsmTags
---@param object_tags OsmTags
---@param log_source_overrides OsmTags|nil
---@return OsmTags, OsmTags
local function separate_tags(tags_to_clean, object_tags, log_source_overrides)
  local cleaned_tags = {}
  local replaced_tags = {}

  for key, _ in pairs(tags_to_clean) do
    if tags_to_clean[key] == SANITIZE_VALUES.disallowed then
      local override = log_source_overrides and log_source_overrides[key]
      replaced_tags[key] = override ~= nil and override or object_tags[key]
    else
      cleaned_tags[key] = tags_to_clean[key]
    end
  end

  return cleaned_tags, replaced_tags
end

-- Returns cleaned_tags with disallowed values set to nil
---@param tags_to_clean OsmTags
---@return OsmTags
local function remove_disallowed_values(tags_to_clean)
  local cleaned_tags = {}

  for key, value in pairs(tags_to_clean) do
    if value == SANITIZE_VALUES.disallowed then
      cleaned_tags[key] = nil
    else
      cleaned_tags[key] = value
    end
  end

  return cleaned_tags
end

-- Returns cleaned_tag with disallowed value set to nil
---@param tag_to_clean OsmTagValue
---@return OsmTagValue
local function remove_disallowed_value(tag_to_clean)
  if tag_to_clean == SANITIZE_VALUES.disallowed then
    return nil
  end
  return tag_to_clean
end

---@class SanitizeCleaner
---@field separate_tags fun(tags_to_clean: OsmTags, object_tags: OsmTags, log_source_overrides: OsmTags|nil): OsmTags, OsmTags
---@field remove_disallowed_values fun(tags_to_clean: OsmTags): OsmTags
---@field remove_disallowed_value fun(tag_to_clean: OsmTagValue): OsmTagValue
---@type SanitizeCleaner
return {
  separate_tags = separate_tags,
  remove_disallowed_values = remove_disallowed_values,
  remove_disallowed_value = remove_disallowed_value,
}
