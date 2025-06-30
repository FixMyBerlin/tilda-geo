require('init')
local parse_length = require('parse_length')

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
  ["track"] = 2.5,
  ["bus_guideway"] = 3,
}

--@return number width The calculated or parsed width in meters
--@return string width_confidence 'high' if from tag, 'medium' if from fallback
--@return string width_source 'tag', 'highway_default', or 'highway_default_and_oneway'
function road_width(tags)
  if tags.width then
    local width = parse_length(tags.width)
    if width then
      return width, 'high', 'tag'
    end
  end

  local base_width = highway_width_fallbacks[tags.highway] or 10
  if tags.oneway == "yes" then
    return base_width * 2 / 3, 'medium', 'highway_default_and_oneway'
  end
  return base_width, 'medium', 'highway_default'
end
