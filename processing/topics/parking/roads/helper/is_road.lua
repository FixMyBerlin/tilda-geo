require('init')
require("Set")
require("Log")

local function is_road(tags)
  if not tags.highway then return false end

  local allowed_highways = Set({
    "primary", "primary_link",
    "secondary", "secondary_link",
    "tertiary", "tertiary_link",
    "residential",
    "unclassified",
    "living_street",
    "pedestrian",
    "road",
  })
  local is_allowed_highway = allowed_highways[tags.highway] or false
  local is_construction_highway = (tags.highway == "construction" and allowed_highways[tags.construction]) or false

  if ( is_allowed_highway or is_construction_highway) then return true end
  return false
end

return is_road
