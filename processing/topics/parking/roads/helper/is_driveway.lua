require('init')
require('Set')
require('Log')
local is_road = require('is_road')

-- Emergency roads are sometimes mapped as hw=path|footway but still require a driveway treatment
-- Therefore all ways that allow any vehicle or emergency access are included.
local function driveway_like_road(tags)
  return (
    (tags.motor_vehicle ~= nil and tags.motor_vehicle ~= 'no') or
    (tags.vehicle ~= nil and tags.vehicle ~= 'no' and tags.motor_vehicle ~= 'no') or
    (tags.emergency ~= nil and tags.emergency ~= 'no')
  )
end

local function is_driveway(tags)
  if not tags.highway then return false end
  if is_road(tags) then return false end

  local allowed_highways = Set({
    'service',
    'track',
    'bus_guideway',
  })
  local is_allowed_highway = allowed_highways[tags.highway] or false
  local is_construction_highway = (tags.highway == 'construction' and allowed_highways[tags.construction]) or false

  if (
    is_allowed_highway or
    is_construction_highway or
    driveway_like_road(tags)
  ) then return true end

  return false
end

return is_driveway
