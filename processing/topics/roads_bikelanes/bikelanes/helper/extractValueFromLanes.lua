require('init')

---Helper function to parse lanes schema into a table
---@param lanes_value string The lanes value (e.g., "1|2|3")
---@return table Array of values
local function _parseLanesValue(lanes_value)
  local lanes = {}
  for val in string.gmatch(lanes_value, '([^|]*)') do
    table.insert(lanes, val)
  end
  return lanes
end

---Helper function to find the index of |lane| or |designated| in lanes schema
-- (The "arrays" starts at 1)
---@param tags table The tags to check
---@return number|nil The index where |lane| or |designated| is found
local function _findLaneIndex(tags)
  -- Check cycleway:lanes for |lane| position
  if tags['cycleway:lanes'] then
    local cycleway_lanes = _parseLanesValue(tags['cycleway:lanes'])
    for i, value in ipairs(cycleway_lanes) do
      if value == 'lane' then
        return i
      end
    end
  end

  -- Check bicycle:lanes for |designated| position
  if tags['bicycle:lanes'] then
    local bicycle_lanes = _parseLanesValue(tags['bicycle:lanes'])
    for i, value in ipairs(bicycle_lanes) do
      if value == 'designated' then
        return i
      end
    end
  end

  return nil
end

---Helper function to extract value from lanes schema at the position where |lane| or |designated| is found
---@param lanes_tag string The lanes tag to extract from (e.g., 'width:lanes', 'surface:lanes')
---@param tags table The tags to check
---@return string|nil The value at the position where |lane| or |designated| is found
local function extractValueFromLanes(lanes_tag, tags)
  local lane_index = _findLaneIndex(tags)
  if not lane_index then
    return nil
  end

  if tags[lanes_tag] then
    local lanes_values = _parseLanesValue(tags[lanes_tag])
    if lanes_values[lane_index] and lanes_values[lane_index] ~= '' then
      return lanes_values[lane_index]
    end
  end

  return nil
end

---Helper function to extract the last value from a lanes schema string
---@param lanes_value string The lanes value (e.g., "1|2|3")
---@return string|nil The last value in the lanes schema
local function extractLastValueFromLanes(lanes_value)
  if not lanes_value then
    return nil
  end

  local lanes = _parseLanesValue(lanes_value)
  if #lanes > 0 then
    return lanes[#lanes]
  end

  return nil
end

local helper = {
  -- internal functions exposed for testing
  _parseLanesValue = _parseLanesValue,
  _findLaneIndex = _findLaneIndex,
  extractValueFromLanes = extractValueFromLanes,
  extractLastValueFromLanes = extractLastValueFromLanes,
}

return helper
