local parse_length = require('topics.helper.parse_length')

-- Like `parse_length` for the width of a road or lane, where 0 can only be a mapping error.
---@param width string|number|nil
---@return number|nil
local function parse_width(width)
  local value = parse_length(width)
  if value and value > 0 then
    return value
  end
  return nil
end

return parse_width
