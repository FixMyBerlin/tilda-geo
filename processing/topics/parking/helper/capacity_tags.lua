require('init')

--- Creates capacity_tags table with value, confidence, and source
--- Only sets confidence and source when value is present
---@param tags table<string, string|nil> Object tags containing capacity information
---@return {value: number|nil, confidence: string|nil, source: string|nil}
local function capacity_tags(tags)
  local capacity = tonumber(tags.capacity)
  if capacity ~= nil then
    return {
      value = capacity,
      confidence = 'high',
      source = 'tag',
    }
  end

  local est_capacity = tonumber(tags.est_capacity)
  if est_capacity ~= nil then
    return {
      value = est_capacity,
      confidence = 'medium',
      source = 'tag_estimation',
    }
  end

  return {
    value = nil,
    confidence = nil,
    source = nil,
  }
end

return capacity_tags
