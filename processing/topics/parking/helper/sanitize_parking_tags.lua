require('init')
local sanitize_for_logging = require('sanitize_for_logging')

local SANITIZE_PARKING_TAGS = {
  parking = function(value)
    return sanitize_for_logging(value, { 'no', 'yes', 'lane', 'street_side', 'on_kerb', 'half_on_kerb', 'shoulder', 'separate' })
  end,
  -- `parking` is our main tag.
  -- for is_driveway this is alway some precise value (because everything else is excluded)
  -- for is_road this with either 'missing' or some precise value.
  -- except for dual_carriageway|s when we fall back to 'not_expected' instead of 'missing'
  parking_extended = function(value, dual_carriageway)
    local result = sanitize_for_logging(value, { 'no', 'yes', 'lane', 'street_side', 'on_kerb', 'half_on_kerb', 'shoulder', 'separate', 'surface' })
    if dual_carriageway and dual_carriageway == 'yes' then
      result = result or 'not_expected'
    end
    result = result or 'missing'
    return result
  end,
  -- When location is given (not nil), we apply special category processing and SQL logic
  -- (e.g., splitting areas into front/back kerbs in `tilda_parking_area_to_line`)
  location = function(value)
    if value == 'lane_center' then return 'lane_centre' end
    return sanitize_for_logging(value, { 'median', 'lane_centre' })
  end,
  orientation = function (value)
    return sanitize_for_logging(value, { 'perpendicular', 'parallel', 'diagonal' })
  end,
  markings = function (value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,
  disabled = function (value)
    -- TODO: How to handle… { 'no', 'customers', 'delivery', 'permissive', 'permit', 'residents', 'unknown' })
    return sanitize_for_logging(value, { 'private', 'designated', 'yes' })
  end,
  restriction = function (value)
    -- TODO: How to handle… { 'none' })
    return sanitize_for_logging(value, { 'no_parking', 'no_stopping', 'no_standing', 'loading_only', 'charging_only' })
  end,
  direction = function (value)
    return sanitize_for_logging(value, { 'back_in', 'head_in' })
  end,
  reason = function (value)
    return sanitize_for_logging(value, {
      'narrow', 'cycleway', 'turn_lane', 'bus_lane', 'bus_stop', 'turnaround', 'priority_road', 'living_street', 'dual_carriage', 'markings', 'rails', 'structure', 'junction', 'driveway', 'crossing', 'fire_lane', 'loading_zone', 'passenger_loading_zone', 'street_cleaning'
    })
  end,
  staggered = function (value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,
  fee = function (value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,
  parking_entrance = function(value)
    return sanitize_for_logging(value, { 'surface', 'depot', 'underground', 'multi-storey', 'rooftop' })
  end,
  direction_to_side = function(value)
    local transformations = {
      forward = 'right',
      backward = 'left',
    }
    return transformations[value]
  end,
}

return SANITIZE_PARKING_TAGS
