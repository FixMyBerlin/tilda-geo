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

function amenity_parking_tags(tags)
  return {
    amenity = tags.amenity,
    parking = tags.parking, -- sanitized by 'conditions'
    orientation = SANITIZE_PARKING_TAGS.orientation(tags.orientation),
    informal = SANITIZE_PARKING_TAGS.informal(tags.informal),
    access = SANITIZE_TAGS.access(tags.access),
    markings = SANITIZE_PARKING_TAGS.markings(tags.markings),
    disabled = SANITIZE_PARKING_TAGS.disabled(tags.disabled),
    restriction = SANITIZE_PARKING_TAGS.restriction(tags.restriction),
    traffic_sign = SANITIZE_TAGS.traffic_sign(tags.traffic_sign),
  }
end

function amenity_parking_tags_cc(value)
  return { }
end
