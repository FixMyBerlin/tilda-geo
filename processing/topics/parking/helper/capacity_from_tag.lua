local round = require('round')

--- Calculates the parking capacity from the given tags and optional area.
---@param tags table A table containing tag key-value pairs. Must include a 'capacity' key if available.
---@param area number The area value
---@return nil|table<{ area: number, capacity: number, capacity_confidence: 'high', capacity_source: 'tag'}>
local function capacity_from_tag(tags, area)
  if type(tonumber(tags.capacity)) == "number" then
    return {
      area = round(area, 2),
      capacity = tonumber(tags.capacity),
      capacity_confidence = 'high',
      capacity_source = 'tag',
    }
  end
  return nil
end

return capacity_from_tag
