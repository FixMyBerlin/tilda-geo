require('init')
local sanitize_for_logging = require('sanitize_for_logging')

local SANITIZE_BARRIER_TAGS = {
  railway = function (value)
    return sanitize_for_logging(value, {
      'rail', 'light_rail', 'tram', 'subway',
    })
  end,
  waterway = function (value)
    return sanitize_for_logging(value, {
      'river', 'canal', 'stream', 'ditch', 'drain',
    })
  end,
  usage = function (value)
    return sanitize_for_logging(value, {
      'main', 'branch', 'industrial', 'military', 'tourism', 'test', 'leisure',
    })
  end,
  natural = function (value)
    return sanitize_for_logging(value, {
      'water', 'wetland',
    })
  end,
  bridge = function (value)
    return sanitize_for_logging(value, {
      'yes', 'boardwalk', 'viaduct', 'movable', 'aqueduct', 'covered',
      'cantilever', 'low_water_crossing',
    }, {
      'no',
    })
  end,
  tunnel = function (value)
    return sanitize_for_logging(value, {
      'culvert', 'yes', 'building_passage', 'flooded', 'avalanche_protector',
    }, {
      'no',
    })
  end,
  aerodrome = function (value)
    return sanitize_for_logging(value, {
      'international', 'regional', 'gliding', 'airsport', 'private',
    })
  end,
}

return SANITIZE_BARRIER_TAGS
