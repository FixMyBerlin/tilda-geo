require('init')
local SANITIZE_VALUES = require('sanitize_values')
require('Clone') -- 'StructuredClone'
require('Log')

-- Returns cleaned_tags, replaced_tags (with _instruction if any replaced)
local function split_cleaned_and_replaced_tags(tags_to_clean, object_tags)
  local cleaned_tags = {}
  local replaced_tags = {}

  for key, _ in pairs(tags_to_clean) do
    if tags_to_clean[key] == SANITIZE_VALUES.disallowed then
      replaced_tags[key] = object_tags[key]
    else
      cleaned_tags[key] = tags_to_clean[key]
    end
  end

  return cleaned_tags, replaced_tags
end

-- Returns cleaned_tags with disallowed values set to nil
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
local function remove_disallowed_value(tag_to_clean)
  if tag_to_clean == SANITIZE_VALUES.disallowed then
    return nil
  end
  return tag_to_clean
end

return {
  split_cleaned_and_replaced_tags = split_cleaned_and_replaced_tags,
  remove_disallowed_values = remove_disallowed_values,
  remove_disallowed_value = remove_disallowed_value,
}
