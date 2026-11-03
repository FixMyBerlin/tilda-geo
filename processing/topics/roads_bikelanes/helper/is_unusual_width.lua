local MAX_USUAL_WIDTH = 50

local reviewed_keys = {
  'check_date',
  'check_date:width',
  'survey:date',
  'survey:date:width',
  'survey_date',
}

---@param tags OsmTags|nil
---@return boolean
local function has_reviewed_key(tags)
  if tags == nil then return false end
  for _, key in ipairs(reviewed_keys) do
    if tags[key] ~= nil then return true end
  end
  return false
end

-- Condition of the `unusual_width` todo of `roads` and `bikelanes`, for `width` values we want a
-- human to look at:
-- - not readable by `parse_width` (`narrow`, `1-2`, `-1`, `0`), so `width` stays empty
-- - above `MAX_USUAL_WIDTH`, where the value is published but is probably a typo
--
-- A check date marks a value as reviewed, so the todo is closed from the data: mappers confirm the
-- value (or fix it) and add one of `reviewed_keys`, on the way or on the width itself. Any value
-- counts because OSM also allows `2024-05` and `2024`.
---@param object_tags OsmTags
---@param result_tags table
---@return boolean
local function is_unusual_width(object_tags, result_tags)
  if object_tags.width == nil then return false end
  -- Lanes are transformed objects: `_parent` is the road they were split off.
  if has_reviewed_key(object_tags) or has_reviewed_key(object_tags._parent) then
    return false
  end
  return result_tags.width == nil or result_tags.width > MAX_USUAL_WIDTH
end

return is_unusual_width
