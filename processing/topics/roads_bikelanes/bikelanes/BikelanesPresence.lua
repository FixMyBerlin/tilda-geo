require('init')
require("transformations")
require("HighwayClasses")

function BikelanesPresence(object_tags, cycleways)
  -- GUARD: Skip some roads
  if PathClasses[object_tags.highway] or object_tags.highway == 'pedestrian' then
    return nil
  end
  if HighwayClasses[object_tags.highway] then
    return nil
  end

  -- STEP: For each side, fill the cyclway category. The first one "wins".
  local presence = {}
  local sides = { "left", "self", "right" }
  for _, cycleway in ipairs(cycleways) do
    local side = cycleway._side
    presence[side] = presence[side] or cycleway.category
  end

  -- STEP: Handle special cases
  -- Set sides to "not_expeced" based on road class OR when infra is present on the center
  local noInfrastructureOnSidesExpected = Set({
    "residential",
    "road",
    "living_street",
    'service',
    'pedestrian', -- unreachable due to PathClasses guard
  })
  if noInfrastructureOnSidesExpected[object_tags.highway] or presence.self then
    for _, side in pairs(sides) do presence[side] = presence[side] or 'not_expected' end
  end

  -- Set center to "not_expected" when infra is present left OR right
  if presence.right or presence.left then
    presence.self = presence.self or 'not_expected'
  end

  local noInfrastructureOnSelfAssumed = Set({
    'unclassified',
    'primary', 'primary_link',
    'tertiary', 'tertiary_link',
    'secondary', 'secondary_link',
  })
  if noInfrastructureOnSelfAssumed[object_tags.highway] then
    -- Set center to "not_expected" based on road class
    presence.self = presence.self or 'not_expected'

    -- Set left/right to "assumed_no" based on road class AND when infra for the other side is present
    --    Usecase: Outside of cities, MajorRoadClasses often have one separate cycleway. Once that is mapped,
    --    we assume the otherside has no separate infra.
    if (
          (presence.left and presence.left ~= 'data_no') or
          (presence.right and presence.right ~= 'data_no')
        ) then
      presence.left = presence.left or 'assumed_no'
      presence.right = presence.right or 'assumed_no'
    end
  end

  -- Set left to "not_expected" if street is oneway for car and bike
  if object_tags.oneway == 'yes' and object_tags['oneway:bicycle'] ~= 'no' then
    presence.left = presence.left or 'not_expected'
  end

  -- Set left side to "not_expected" for junctions
  if object_tags.junction == 'roundabout' then
    presence.left = presence.left or 'not_expected'
  end

  -- Replace all nil values with 'missing'
  for _, side in pairs(sides) do presence[side] = presence[side] or "missing" end

  local result_tags = {
    bikelane_left = presence.left,
    bikelane_self = presence.self,
    bikelane_right = presence.right
  }

  return result_tags
end
