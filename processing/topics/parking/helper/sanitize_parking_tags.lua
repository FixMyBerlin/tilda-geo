require('init')
local sanitize_for_logging = require('sanitize_for_logging')

local SANITIZE_PARKING_TAGS = {
  parking = function(value)
    return sanitize_for_logging(value, { 'no', 'yes', 'lane', 'street_side', 'on_kerb', 'half_on_kerb', 'shoulder', 'separate' })
  end,
  location = function (value)
    return sanitize_for_logging(value, { 'median' })
  end,
  orientation = function (value)
    return sanitize_for_logging(value, { 'perpendicular', 'parallel', 'diagonal' })
  end,
  operator_type = function(value)
    return sanitize_for_logging(value, { 'public', 'private' })
  end,
  covered = function (value)
    return sanitize_for_logging(value, { 'yes' }, { 'no' })
  end,
  informal = function (value)
    return sanitize_for_logging(value, { 'yes' })
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
    return sanitize_for_logging(value, { 'surface', 'depot', 'underground', 'multi-storey' })
  end,
}

return SANITIZE_PARKING_TAGS
