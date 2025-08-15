require('init')
require('Log')

-- Estimate a buffer radius for a parking point based on capacity and orientation.
-- Keep in sync with:
--  - SQL constants in processing/topics/parking/custom_functions/estimate_capacity.sql
--  - LUA area/capacity logic in class_separate_parking_category.lua
local function constants_for_orientation(orientation)
  if orientation == 'perpendicular' then
    return 2.0, 4.4, 0.5
  elseif orientation == 'diagonal' then
    local deg = 60
    local s = math.sin(math.rad(deg))
    local c = math.cos(math.rad(deg))
    local car_space_x = s * 4.4 + c * 2.0
    local car_space_y = c * 4.4 + s * 2.0
    local padding = c * 0.5
    return car_space_x, car_space_y, padding
  else -- 'parallel' and fallback
    return 4.4, 2.0, 0.8
  end
end

local function parking_point_radius(object)
  if object.type ~= 'node' then return nil end

  local tags = object.tags
  local capacity = tonumber(tags.capacity) or 1
  local car_space_x, car_space_y, padding = constants_for_orientation(tags.orientation)
  -- Area per stall derived from SQL formulas: (car_space_y + 0.25) * (car_space_x + padding)
  local area_per_stall = (car_space_y + 0.25) * (car_space_x + padding)
  local total_area = capacity * area_per_stall

  -- Convert area to an equivalent circle radius (meters)
  local radius = math.sqrt(total_area / math.pi)

  return radius
end

return parking_point_radius
