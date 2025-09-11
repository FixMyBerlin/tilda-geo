require('init')
local parse_length = require('parse_length')

--- Parse capacity from tags and return capacity with source and confidence
---@param tags table The object tags containing capacity information
---@return number|nil capacity The parsed capacity value
---@return string|nil capacity_source The source of the capacity ('tag' or nil)
---@return string|nil capacity_confidence The confidence level ('high' or nil)
local function parse_capacity(tags)
  local capacity = parse_length(tags.capacity)
  local capacity_source = nil
  local capacity_confidence = nil

  if capacity ~= nil then
    capacity_source = 'tag'
    capacity_confidence = 'high'
  end

  return capacity, capacity_source, capacity_confidence
end

return parse_capacity
