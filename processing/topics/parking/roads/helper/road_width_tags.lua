require('init')
local parse_length = require('parse_length')
local round = require('round')

local highway_width_fallbacks = {
  ["primary"] = 17,
  ["primary_link"] = 6,
  ["secondary"] = 15,
  ["secondary_link"] = 6,
  ["tertiary"] = 13,
  ["tertiary_link"] = 6,
  ["residential"] = 11,
  ["unclassified"] = 11,
  ["living_street"] = 6,
  ["pedestrian"] = 11,
  ["road"] = 11,
  ["service"] = 4,
  ["bus_guideway"] = 3,
  ["track"] = 2.5,
  ["footway"] = 2.5,
}

---Creates road_width_tags table with value, confidence, and source
---Always returns a table (with nil values if no width can be determined)
---@param tags table<string, string|nil> Object tags containing width information
---@return {value: number|nil, confidence: string|nil, source: string|nil}
local function road_width_tags(tags)
  if tags.width then
    local width = parse_length(tags.width)
    if width then
      return {
        value = width,
        confidence = 'high',
        source = 'tag',
      }
    end
  end

  local base_width = highway_width_fallbacks[tags.highway] or 10
  if tags.oneway == "yes" then
    return {
      value = round(base_width * 2 / 3, 2),
      confidence = 'medium',
      source = 'highway_default_and_oneway',
    }
  end
  return {
    value = base_width,
    confidence = 'medium',
    source = 'highway_default',
  }
end

return road_width_tags
