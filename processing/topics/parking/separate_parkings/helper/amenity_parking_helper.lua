require('init')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
require('Log')

function amenity_parking_point_radius(tags)
  -- TODO: Based on orientation + fallback, pick a width for one capacity.
  -- If no capacity given, take 1

  local todo_width = 4
  local capacity = tonumber(tags.capacity) or 1

  return capacity * todo_width
end
