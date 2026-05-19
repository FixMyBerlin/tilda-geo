
---@param lanes_value string The lanes value (e.g., '1|2|3')
---@return table Array of values
local function _parse_lanes_value(lanes_value)
  local lanes = {}
  for val in string.gmatch(lanes_value, '([^|]*)') do
    table.insert(lanes, val)
  end
  return lanes
end

---@param tags OsmTags The tags to check
---@return number|nil The index where |lane| or |designated| is found
local function _find_lane_index(tags)
  if tags['cycleway:lanes'] then
    local cycleway_lanes = _parse_lanes_value(tags['cycleway:lanes'])
    for i, value in ipairs(cycleway_lanes) do
      if value == 'lane' then
        return i
      end
    end
  end

  if tags['bicycle:lanes'] then
    local bicycle_lanes = _parse_lanes_value(tags['bicycle:lanes'])
    for i, value in ipairs(bicycle_lanes) do
      if value == 'designated' then
        return i
      end
    end
  end

  return nil
end

---@param lanes_tag string The lanes tag to extract from (e.g., 'width:lanes', 'surface:lanes')
---@param tags OsmTags The tags to check
---@return string|nil
local function extract_value_from_lanes(lanes_tag, tags)
  local lane_index = _find_lane_index(tags)
  if not lane_index then
    return nil
  end

  if tags[lanes_tag] then
    local lanes_values = _parse_lanes_value(tags[lanes_tag])
    if lanes_values[lane_index] and lanes_values[lane_index] ~= '' then
      return lanes_values[lane_index]
    end
  end

  return nil
end

---@param lanes_value string The lanes value (e.g., '1|2|3')
---@return string|nil The last value in the lanes schema
local function extract_last_value_from_lanes(lanes_value)
  if not lanes_value then
    return nil
  end

  local lanes = _parse_lanes_value(lanes_value)
  if #lanes > 0 then
    return lanes[#lanes]
  end

  return nil
end

return {
  -- NOTE: `_...` helpers are intentionally exported for unit tests.
  _parse_lanes_value = _parse_lanes_value,
  _find_lane_index = _find_lane_index,
  extract_value_from_lanes = extract_value_from_lanes,
  extract_last_value_from_lanes = extract_last_value_from_lanes,
}
