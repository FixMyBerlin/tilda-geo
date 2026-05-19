local sanitize_for_logging = require('topics.helper.sanitize_for_logging')
local SANITIZE_VALUES = require('topics.helper.sanitize_values')

-- Helper transform `direction` tags to our left|right|both schema.
-- If no `direction=*` is found, we assume `both`.
-- Some tags use a completely different approach to specify left/right with a additional tag `direction=forward|backward|both`.
-- We transform those tags to be able to use our standard `tag=left|right|both` transformation so we can treat all objects the same.
---@param source_dest table<string, string|nil>
---@param key string
---@return table<string, string> Replaced originals for `parking_errors` when direction is invalid
local function transform_point_direction_tags(source_dest, key)
  local replaced = {}
  local has_direction_key = (source_dest.direction and true) or false
  local raw = source_dest.direction
  local sanitized = raw ~= nil and sanitize_for_logging(raw, { 'forward', 'backward', 'both' }) or nil

  if raw ~= nil and sanitized == SANITIZE_VALUES.disallowed then
    replaced.direction = raw
    return replaced
  end

  local valid_direction_key = sanitized
  if not has_direction_key or (has_direction_key and valid_direction_key) then
    local direction_key = valid_direction_key or 'both'
    local side = (direction_key == 'forward' and 'right') or (direction_key == 'backward' and 'left') or 'both'
    source_dest[key] = side
  end

  return replaced
end

return transform_point_direction_tags
