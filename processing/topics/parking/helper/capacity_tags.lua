require('init')

--- Creates capacity_tags table with value, confidence, and source
--- Only sets confidence and source when value is present
---@param tags table<string, string|nil> Object tags containing capacity information
---@return {value: number|nil, confidence: string|nil, source: string|nil}
local function capacity_tags(tags)
  local capacity = tonumber(tags.capacity)

  if capacity == nil then
    return {
      value = nil,
      confidence = nil,
      source = nil,
    }
  end

  return {
    value = capacity,
    confidence = 'high',
    source = 'tag',
  }
end

return capacity_tags
