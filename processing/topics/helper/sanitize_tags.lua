require('init')
require('SanitizeTrafficSign')
local sanitize_for_logging = require('sanitize_for_logging')
local parse_length = require('parse_length')

local SANITIZE_TAGS = {
  access = function (value)
    -- TOOD: How to handle… { 'unknown' }
    return sanitize_for_logging(value, { 'no', 'private', 'permissive', 'permit', 'employees', 'customers', 'delivery', 'residents' }, { 'yes' })
  end,
  traffic_sign = function (value)
    return SanitizeTrafficSign(value)
  end,
  surface = function (tags)
    -- Transform known but unsupported values to values that we support:
    local transformations = {
      earth = 'ground', mud = 'ground', clay = 'ground', dirt = 'ground',
      rock = 'stone',
      unhewn_cobblestone = 'sett',
    }
    if transformations[tags.surface] then
      tags.surface = transformations[tags.surface]
    end
    -- Sanitize values:
    return sanitize_for_logging(tags.surface, {
        -- Common
        'asphalt',
        -- Unspecific
        'paved', 'unpaved',
        -- Concrete
        'concrete', 'concrete:plates', 'concrete:lanes',
        -- Stone/brick types
        'paving_stones', 'sett', 'cobblestone', 'bricks', 'stone',
        -- Ground/earthy
        'ground', 'grass', 'sand', 'compacted', 'fine_gravel', 'gravel', 'pebblestone',
        -- Material
        'wood', 'woodchips', 'metal', 'plastic', 'rubber', 'grass_paver',
      },
      -- Values that we ignore (not part of the logging, just silently `nil`ed)
      { 'ice', 'snow', 'salt', }
    )
  end,
}

return SANITIZE_TAGS
