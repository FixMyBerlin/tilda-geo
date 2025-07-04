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
    if tags.surface == nil then return nil end
    -- Transform known but unsupported values to values that we support:
    local transformations = {
      -- Ground
      earth = 'ground', mud = 'ground', clay = 'ground', dirt = 'ground',
      ['dirt/sand'] = 'ground',
      -- Sett
      cobblestone = 'large_sett',
      unhewn_cobblestone = 'large_sett',
      ['cobblestone:flattened'] = 'large_sett',
      -- Stone
      rock = 'stone', ['stone:plates'] = 'stone',
      -- Paving Stones
      ['paving_stones:20'] = 'paving_stones', -- we don't transform the tags['paving_stones:length'] = 20 for now because we don't use it
      ['paving_stones:30'] = 'paving_stones', -- we don't transform the tags (yet)
      -- Other
      tartan = 'rubber',
    }
    if transformations[tags.surface] then
      tags.surface = transformations[tags.surface]
    end
    -- Treat special cases:
    -- https://wiki.openstreetmap.org/wiki/Tag:surface%3Dsett#Size
    if tags.surface == 'sett' then
      local size = parse_length(tags['sett:length'])
      if size and size <= 0.08 then return 'mosaic_sett' end
      if size and size <= 0.13 then return 'small_sett' end
      if size and size > 0.13 then return 'large_sett' end
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
        'paving_stones', 'paving_stones:lanes', 'sett', 'bricks', 'stone',
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
