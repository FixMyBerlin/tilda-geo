require('init')
local sanitize_for_logging = require('sanitize_for_logging')
local parse_length = require('parse_length')
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
  separation = function (tags, side)
    -- The side-unspecific tags.separation is deprecated. We interpret it as 'in the direction of travel', meaning left
    local value = tags['separation:' .. side] or tags['separation:both']
    if side == 'left' then value = value or tags['separation'] end
    if value == nil then return nil end

    -- Transform known but unsupported values to values that we support:
    local transformations = {
      ['separation_kerb'] = 'bump',
      ['lane_separator'] = 'bump',
      ['surface'] = 'no',
      ['tree_row;kerb'] = 'tree_row', -- primary separation is 'tree_row'
      ['kerb;tree_row'] = 'tree_row', -- primary separation is 'tree_row'
      ['tree_row;kerb;parking_lane'] = 'tree_row', -- primary separation is 'tree_row'
      ['grass_verge;tree_row'] = 'tree_row', -- primary separation is 'tree_row'
      ['kerb;greenery'] = 'kerb', -- primary
      ['parking_lane;kerb'] = 'parking_lane', -- primary
      ['solid_line;parking_lane'] = 'parking_lane', -- deprecated value
    }
    if transformations[value] then
      value = transformations[value]
    end
    -- Sanitize values:
    -- TODO: We should migrate the roads_bikelanes to use the same sanitize_for_logging system that parkings now uses. Until then, we use the other Sanitize helper.
    return Sanitize(value, {
      'no',
      'bollard', 'flex_post', 'vertical_panel', 'studs', 'bump', 'planter', 'kerb', 'fence', 'jersey_barrier', 'guard_rail', 'structure', 'ditch', 'greenery', 'hedge', 'tree_row', 'cone',
      -- We preserver some combinations but transform other
      'kerb;parking_lane', -- sidewalk but additional protection
      'kerb;bollard', -- meaning, its still on the side walk
      'yes' -- unspecific
    })
    -- return sanitize_for_logging(
    --   value,
    --   { … },
    --   -- Values that we ignore (not part of the logging, just silently `nil`ed)
    --   {}
    -- )
  end,
  marking = function (tags, side)
    -- The side-unspecific tags.marking is deprecated. We interpret it as 'in the direction of travel', meaning left
    local value = tags['marking:' .. side] or tags['marking:both']
    if side == 'left' then value = value or tags['marking'] end
    if value == nil then return nil end

    -- Sanitize values:
    -- TODO: We should migrate the roads_bikelanes to use the same sanitize_for_logging system that parkings now uses. Until then, we use the other Sanitize helper.
    return Sanitize(value, {
      'solid_line', 'dashed_line', 'double_solid_line', 'barred_area', 'pictogram', 'surface',
    })
    -- return sanitize_for_logging(
    --   value,
    --   { … },
    --   -- Values that we ignore (not part of the logging, just silently `nil`ed)
    --   {}
    -- )
  end,
  traffic_mode = function (tags, side)
    -- The side-unspecific tags.traffic_mode is deprecated. We interpret it as 'in the direction of travel', meaning left
    local value = tags['traffic_mode:' .. side] or tags['traffic_mode:both']
    if side == 'left' then value = value or tags['traffic_mode'] end
    if value == nil then return nil end

    -- Transform known but unsupported values to values that we support:
    local transformations = {
      ['foot;bicycle'] = 'foot',
      ['motorized'] = 'motor_vehicle',
      ['none'] = 'no',
    }
    if transformations[value] then
      value = transformations[value]
    end

    -- Sanitize values:
    -- TODO: We should migrate the roads_bikelanes to use the same sanitize_for_logging system that parkings now uses. Until then, we use the other Sanitize helper.
      return Sanitize(value, {
      'no',
      'motor_vehicle', 'parking', 'psv', 'bicycle', 'foot'
    })
    -- return sanitize_for_logging(
    --   value,
    --   { … },
    --   -- Values that we ignore (not part of the logging, just silently `nil`ed)
    --   {}
    -- )
  end,
  buffer = function (tags, side)
    -- The side-unspecific tags.buffer is deprecated. We interpret it as 'in the direction of travel', meaning left
    local value = tags['buffer:' .. side] or tags['buffer:both']
    if side == 'left' then value = value or tags['buffer'] end
    if value == nil then return nil end

    -- We want values of type number, so we have to change no-strings to 0
    local transformations = {
      ['no'] = 0,
      ['none'] = 0,
    }
    if transformations[value] then
      value = transformations[value]
    end

    return parse_length(value)
  end,
}

return SANITIZE_ROAD_TAGS
