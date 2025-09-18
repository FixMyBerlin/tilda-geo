require('init')
require('Set')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
local sanitize_cleaner = require('sanitize_cleaner')

local DIRECTIONAL_PARKING_INFERENCE_CATEGORIES = Set({
  'cyclewayOnHighway_advisory',
  'cyclewayOnHighway_advisoryOrExclusive',
  'cyclewayOnHighway_exclusive',
  'cyclewayOnHighwayBetweenLanes',
  'cyclewayOnHighwayProtected'
})

-- If parking lane exists and is not explicitly 'no', infer parking traffic mode
local function inferTrafficModeFromParking(centerlineTags, side)
  local raw_value = centerlineTags['parking:' .. side] or centerlineTags['parking:both']
  local value = SANITIZE_PARKING_TAGS.parking(raw_value)

  if sanitize_cleaner.remove_disallowed_value(value) == nil then return nil end
  if value == 'no' then return nil end
  return 'parking'
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
  if categoryId == 'bicycleRoad' or categoryId == 'bicycleRoad_vehicleDestination' then
    return { traffic_mode_left = infered_traffic_mode_left, traffic_mode_right = infered_traffic_mode_right }
  end

  -- CASE 'lane' bike infra: use only the transformed side
  if DIRECTIONAL_PARKING_INFERENCE_CATEGORIES[categoryId] ~= nil then
    traffic_mode_left = nil
    traffic_mode_right = inferTrafficModeFromParking(centerlineTags, side)
  end

  return { traffic_mode_left = traffic_mode_left, traffic_mode_right = traffic_mode_right }
end

return deriveTrafficMode
