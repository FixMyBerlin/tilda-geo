require('init')
local SET = require('sets')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')
local SANITIZE_PARKING_TAGS = require('sanitize_parking_tags')
local CLEANER = require('sanitize_cleaner')

local DIRECTIONAL_PARKING_INFERENCE_CATEGORIES = SET.set({
  'cyclewayOnHighway_advisory',
  'cyclewayOnHighway_advisoryOrExclusive',
  'cyclewayOnHighway_exclusive',
  'cyclewayOnHighwayBetweenLanes',
  'cyclewayOnHighwayProtected',
})

local function infer_traffic_mode_from_parking(centerlineTags, side)
  local raw_value = centerlineTags['parking:' .. side] or centerlineTags['parking:both']
  local value = SANITIZE_PARKING_TAGS.parking(raw_value)

  if CLEANER.remove_disallowed_value(value) == nil then return nil end
  if value == 'no' then return nil end
  return 'parking'
end

---@param bikelaneTags table
---@param centerlineTags table
---@param categoryId string
---@param side string
---@return table
local function derive_traffic_mode(bikelaneTags, centerlineTags, categoryId, side)
  local traffic_mode_left = CLEANER.remove_disallowed_value(SANITIZE_ROAD_TAGS.traffic_mode(bikelaneTags, 'left'))
  local traffic_mode_right = CLEANER.remove_disallowed_value(SANITIZE_ROAD_TAGS.traffic_mode(bikelaneTags, 'right'))

  local has_explicit_traffic_mode = traffic_mode_left ~= nil or traffic_mode_right ~= nil
  if has_explicit_traffic_mode then
    return { traffic_mode_left = traffic_mode_left, traffic_mode_right = traffic_mode_right }
  end

  local infered_traffic_mode_left = infer_traffic_mode_from_parking(centerlineTags, 'left')
  local infered_traffic_mode_right = infer_traffic_mode_from_parking(centerlineTags, 'right')

  if categoryId == 'bicycleRoad' or categoryId == 'bicycleRoad_vehicleDestination' then
    return { traffic_mode_left = infered_traffic_mode_left, traffic_mode_right = infered_traffic_mode_right }
  end

  if DIRECTIONAL_PARKING_INFERENCE_CATEGORIES[categoryId] ~= nil then
    traffic_mode_left = nil
    traffic_mode_right = infer_traffic_mode_from_parking(centerlineTags, side)
  end

  return { traffic_mode_left = traffic_mode_left, traffic_mode_right = traffic_mode_right }
end

return derive_traffic_mode
