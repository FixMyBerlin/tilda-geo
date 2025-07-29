require('init')
require('Set')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
local SANITIZE_VALUES = require('sanitize_values')

local DIRECTIONAL_PARKING_INFERENCE_CATEGORIES = Set({
  'cyclewayOnHighway_advisory',
  'cyclewayOnHighway_advisoryOrExclusive',
  'cyclewayOnHighway_exclusive',
  'cyclewayOnHighwayBetweenLanes',
  'cyclewayOnHighwayProtected'
})

-- If parking lane exists and is not explicitly 'no', infer parking traffic mode
local function inferTrafficModeFromParking(centerlineTags, side)
  local value = SANITIZE_PARKING_TAGS.parking(centerlineTags['parking:' .. side] or centerlineTags['parking:both'])
  if value ~= nil and value ~= 'no' and value ~= SANITIZE_VALUES.disallowed then
    return 'parking'
  end

  return nil
end

local function deriveTrafficMode(bikelaneTags, centerlineTags, categoryId, side)
  -- Get explicit traffic modes using existing sanitization
  local traffic_mode_left = SANITIZE_ROAD_TAGS.traffic_mode(bikelaneTags, 'left')
  local traffic_mode_right = SANITIZE_ROAD_TAGS.traffic_mode(bikelaneTags, 'right')

  -- Infer data only if no explict traffic_mode present (on any of the sides)
  local has_explicit_traffic_mode = traffic_mode_left ~= nil or traffic_mode_right ~= nil
  if has_explicit_traffic_mode then
    return { traffic_mode_left = traffic_mode_left, traffic_mode_right = traffic_mode_right }
  end

  -- Only apply parking inference for specific categories and when no explicit traffic_mode exists
  local infered_traffic_mode_left = inferTrafficModeFromParking(centerlineTags, 'left')
  local infered_traffic_mode_right = inferTrafficModeFromParking(centerlineTags, 'right')

  -- CASE bicycle roads: use both sides
  if categoryId == 'bicycleRoad' then
    return { traffic_mode_left = infered_traffic_mode_left, traffic_mode_right = infered_traffic_mode_right }
  end

  -- CASE 'lane' bike infra: use only the transformed side
  if DIRECTIONAL_PARKING_INFERENCE_CATEGORIES[categoryId] ~= nil then
    if side == 'left' then
      traffic_mode_left = nil
      traffic_mode_right = inferTrafficModeFromParking(centerlineTags, 'left')
    else
      traffic_mode_left = nil
      traffic_mode_right = inferTrafficModeFromParking(centerlineTags, 'right')
    end
  end

  return { traffic_mode_left = traffic_mode_left, traffic_mode_right = traffic_mode_right }
end

return deriveTrafficMode
