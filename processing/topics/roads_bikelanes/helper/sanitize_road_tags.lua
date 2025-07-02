require('init')
local sanitize_for_logging = require('sanitize_for_logging')
require('Sanitize')

local SANITIZE_ROAD_TAGS = {
  surface_color = function (tags)
    if tags['surface:colour'] == nil then return nil end

    -- Transform known but unsupported values to values that we support:
    local transformations = {
      -- https://taginfo.geofabrik.de/europe:germany/keys/surface%3Acolour#values
      -- (Reminder: This list shows values for roofs and such as well as ways)
      ['grey'] = 'no',
      ['gray'] = 'no',
      ['#888888'] = 'no',
      ['silver'] = 'no',
      ['dimgray'] = 'no',
      ['#b5565a'] = 'red',
      ['orange'] = 'red',
    }
    if transformations[tags['surface:colour']] then
      tags['surface:colour'] = transformations[tags['surface:colour']]
    end
    -- Sanitize values:
    -- TODO: We should migrate the roads_bikelanes to use the same sanitize_for_logging system that parkings now uses. Until then, we use the other Sanitize helper.
    return Sanitize(tags['surface:colour'], { 'red', 'green', 'no' })
    -- return sanitize_for_logging(
    --   tags['surface:colour'],
    --   { 'red', 'green', 'no' },
    --   -- Values that we ignore (not part of the logging, just silently `nil`ed)
    --   {}
    -- )
  end,
}

return SANITIZE_ROAD_TAGS
