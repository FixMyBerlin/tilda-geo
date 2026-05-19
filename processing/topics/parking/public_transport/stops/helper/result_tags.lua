local log = require('topics.helper.log')
local default_id = require('topics.helper.default_id')
local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

local function result_tags_public_transport_stops(result)
  local category = result.category
  local object = result.object
  local tags = result.object.tags

  local result_tags = {
    category = category.id,
    buffer_radius = category.buffer_radius,
  }

  -- Add category-specific tags
  local category_tags = category:get_tags(tags)
  for key, value in pairs(category_tags) do
    result_tags[key] = value
  end

  -- Extract public tags (remove internal tags starting with '_')
  local public_tags = extract_public_tags(result_tags)

  local cleaned_tags, replaced_tags = CLEANER.separate_tags(public_tags, tags)

  local row_data = {
    id = default_id(object),
    tags = cleaned_tags,
    meta = {},
  }

  return row_data, replaced_tags
end

return result_tags_public_transport_stops
