require('init')
local parse_length = require('parse_length')

-- Main roads (primary/secondary/tertiary): different values for oneway vs non-oneway (2/3 rule for dual carriageways).
-- Other roads: same value regardless of oneway.
local highway_width_fallbacks_no_oneway = {
  ["primary"] = 18,
  ["secondary"] = 14,
  ["tertiary"] = 10,
  ["motorway_link"] = 9,
  ["primary_link"] = 6,
  ["secondary_link"] = 6,
  ["tertiary_link"] = 6,
  ["residential"] = 8,
  ["unclassified"] = 8,
  ["living_street"] = 5,
  ["pedestrian"] = 8,
  ["road"] = 8,
  ["service"] = 4,
  ["bus_guideway"] = 3,
  ["track"] = 2.5,
  ["footway"] = 2.5,
}

local highway_width_fallbacks_oneway = {
  ["primary"] = 12,
  ["secondary"] = 9,
  ["tertiary"] = 7,
  ["motorway_link"] = 9,
  ["primary_link"] = 6,
  ["secondary_link"] = 6,
  ["tertiary_link"] = 6,
  ["residential"] = 8,
  ["unclassified"] = 8,
  ["living_street"] = 5,
  ["pedestrian"] = 8,
  ["road"] = 8,
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

  local width_oneway = highway_width_fallbacks_oneway[tags.highway]
  local width_no_oneway = highway_width_fallbacks_no_oneway[tags.highway]

  local is_oneway = tags.oneway == "yes" or tags.oneway == "implicit_yes"
  if is_oneway then
    return {
      value = width_oneway or 10,
      confidence = 'medium',
      source = (width_oneway == width_no_oneway) and 'highway_default' or 'highway_default_and_oneway',
    }
  end

  return {
    value = width_no_oneway or 10,
    confidence = 'medium',
    source = 'highway_default',
  }
end

return road_width_tags
