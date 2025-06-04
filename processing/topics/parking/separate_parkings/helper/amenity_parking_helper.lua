require('init')
require('sanitize_for_logging')
require('SanitizeTrafficSign')
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
    orientation = sanitize_for_logging(tags.orientation, { 'perpendicular', 'parallel', 'diagonal' }),
    informal = sanitize_for_logging(tags.informal, { 'yes' }),
    access = sanitize_for_logging(tags.access, { 'no', 'private', 'permissive' }, { 'yes' }),
    markings = sanitize_for_logging(tags.markings, { 'yes', 'no' }),
    disabled = sanitize_for_logging(tags.disabled, { 'private', 'designated' }),
    restriction = sanitize_for_logging(tags.restriction, { 'charging_only', 'loading_only' }),
    traffic_sign = SanitizeTrafficSign(tags.traffic_sign),
  }
end

function amenity_parking_tags_cc(value)
  return { }
end
