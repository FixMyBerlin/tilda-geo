require('init')
local sanitize_for_logging = require('sanitize_for_logging')
local SANITIZE_TAGS = require('sanitize_tags')

local YES_NO = { 'yes', 'no' }

--- Map `separate_tags` result keys to OSM strings when the result key differs from `object_tags[key]`.
---@param tags OsmTags
---@return table
local function log_source_overrides(tags)
  return {
    access_cargo_bike = tags.cargo_bike,
    operator_type = SANITIZE_TAGS.operator_type_log_source(tags),
    position = tags['bicycle_parking:position'] or tags.position,
  }
end

local SANITIZE_BICYCLE_PARKING = {
  -- Expose this key explicitly so `separate_tags` can map derived result keys
  -- back to the original OSM source fields for error reporting.
  log_source_overrides = log_source_overrides,
  ---@param value string|nil
  access = function(value)
    return sanitize_for_logging(value, { 'yes', 'private', 'permissive', 'customers' })
  end,

  --- nil preserves implicit-default behaviour (`implicit_no`).
  ---@param value string|nil
  covered = function(value)
    if value == nil then
      return 'implicit_no'
    end
    return sanitize_for_logging(value, { 'yes', 'no', 'partial' })
  end,

  ---@param value string|nil
  fee = function(value)
    if value == nil then
      return 'implicit_no'
    end
    return sanitize_for_logging(value, YES_NO)
  end,

  ---@param value string|nil
  cargo_bike = function(value)
    return sanitize_for_logging(value, { 'yes' }, { 'no' })
  end,

  ---@param value string|nil
  lit = function(value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,

  ---@param value string|nil
  bicycle_parking = function(value)
    return sanitize_for_logging(value, {
      'stands',
      'wide_stands',
      'bollard',
      'wall_loops',
      'shed',
      'two-tier',
      'lockers',
    })
  end,
  surveillance = function(value)
    return sanitize_for_logging(value, {
      'outdoor', 'public', 'indoor', 'yes', 'webcam', 'traffic', 'camera', 'private',
    }, {
      'no',
    })
  end,
  ---@param tags OsmTags
  bicycle_parking_position = function(tags)
    local value = tags['bicycle_parking:position'] or tags.position
    return sanitize_for_logging(value, {
      'sidewalk', 'grass_verge', 'lane', 'kerb_extension', 'parking_lot',
      'street_side', 'school_ground', 'private_property', 'pedestrian_area',
      'park', 'parking',
    })
  end,
}

return SANITIZE_BICYCLE_PARKING
