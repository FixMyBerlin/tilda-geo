require('init')
require('sanitize_for_logging')
require('SanitizeTrafficSign')

local SANITIZE_TAGS = {
  parking = function(value)
    return sanitize_for_logging(value, { 'no', 'yes', 'lane', 'street_side', 'on_kerb', 'half_on_kerb', 'shoulder', 'separate' })
  end,
  orientation = function (value)
    return sanitize_for_logging(value, { 'perpendicular', 'parallel', 'diagonal' })
  end,
  operator_type = function(value)
    return sanitize_for_logging(value, { 'public', 'private' })
  end,
  access = function (value)
    -- TOOD: How to handle… { 'unknown' }
    return sanitize_for_logging(value, { 'no', 'private', 'permissive', 'permit', 'employees', 'customers', 'delivery', 'residents' }, { 'yes' })
  end,
  taxi = function (value)
    return sanitize_for_logging(value, { 'yes', 'designated' })
  end,
  motorcar = function (value)
    -- TOOD: How to handle… { 'unknown', 'private', 'customers', 'delivery', 'permissive', 'permit', 'residents' }
    return sanitize_for_logging(value, { 'yes', 'no', 'designated' })
  end,
  hgv = function (value)
    -- TOOD: How to handle… { 'unknown', 'private', 'customers', 'delivery', 'permissive', 'permit', 'residents' }
    return sanitize_for_logging(value, { 'yes', 'no', 'designated' })
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
  traffic_sign = function (value)
    return SanitizeTrafficSign(value)
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
  authentication_disc = function (value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,
  surface = function (value)
    local transformations = {
      earth = 'ground', mud = 'ground', clay = 'ground', dirt = 'ground',
      rock = 'stone',
    }
    if transformations[value] then
      value = transformations[value]
    end
    return sanitize_for_logging(value, {
        -- Common
        'asphalt',
        -- Unspecific
        'paved', 'unpaved',
        -- Concrete
        'concrete', 'concrete:plates', 'concrete:lanes',
        -- Stone/brick types
        'paving_stones', 'sett', 'cobblestone', 'bricks', 'stone', 'pebblestone',
        -- Ground/earthy
        'ground', 'grass', 'sand', 'compacted', 'fine_gravel', 'gravel',
        -- Material
        'wood', 'woodchips', 'metal', 'plastic', 'rubber', 'grass_paver',
      },
      { 'ice', 'snow', 'salt', }
    )
  end,
  parking_entrance = function(value)
    return sanitize_for_logging(value, { 'surface', 'depot', 'underground', 'multi-storey' })
  end,
}

return SANITIZE_TAGS
