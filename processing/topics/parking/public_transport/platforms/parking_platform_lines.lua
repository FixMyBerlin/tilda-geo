require('init')
require('Log')
require('DefaultId')
local LOG_ERROR = require('parking_errors')
local SANITIZE_TAGS = require('sanitize_tags')
local sanitize_cleaner = require('sanitize_cleaner')

---@param tags table<string, string>
---@return boolean
local function is_platform_line(tags)
  return tags.public_transport == 'platform' and tags.bus == 'yes'
end

local function parking_platform_lines(object, db_table)
  if next(object.tags) == nil then return end

  if is_platform_line(object.tags) then
    local result_tags = {
      category = 'platform_line',
      buffer_radius = 0.6,
      name = SANITIZE_TAGS.safe_string(object.tags.name),
      ref = SANITIZE_TAGS.safe_string(object.tags.ref),
      operator = SANITIZE_TAGS.safe_string(object.tags.operator),
    }

    local cleaned_tags, replaced_tags = sanitize_cleaner.split_cleaned_and_replaced_tags(result_tags, object.tags)

    local row = {
      id = DefaultId(object),
      tags = cleaned_tags,
      meta = {},
      -- Reminder: This are mostly lines, but some of them are areas which we store as closed lines.
      -- Both work fine for our snapping purposes.
      geom = object:as_linestring(),
    }

    LOG_ERROR.SANITIZED_VALUE(object, row.geom, replaced_tags, 'parking_platform_lines')
    db_table:insert(row)
  end
end

return parking_platform_lines
