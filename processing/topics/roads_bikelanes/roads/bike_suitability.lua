local contains_substring = require('topics.helper.contains_substring')
local derive_smoothness = require('topics.helper.derive_smoothness')
local contains_traffic_sign_id = require('topics.helper.contains_traffic_sign_id')

local bike_suitability_category = {}
bike_suitability_category.__index = bike_suitability_category

---@param args table
---@param args.desc string
---@param args.condition function
local function bike_suitability_new(args)
  local self = setmetatable({}, bike_suitability_category)
  local fields = { 'id', 'desc', 'condition' }
  for _, v in pairs(fields) do
    if args[v] == nil then
      error('Missing field \'' .. v .. '\' for bike_suitability \'' .. args.id .. '\'')
    end
    self[v] = args[v]
  end
  return self
end

function bike_suitability_category:is_active(tags)
  return self.condition(tags)
end

local good_surface = bike_suitability_new({
  id = 'goodSurface',
  desc = 'Paths which have a surface which is suited for biking.',
  condition = function(tags)
    if tags.highway == 'track' or tags.highway == 'path' then
      local smoothness = derive_smoothness(tags).smoothness
      if smoothness == nil or smoothness == 'bad' or smoothness == 'very_bad' then
        return false
      end
      return true
    end
  end,
})

local no_motorized_vehicle = bike_suitability_new({
  id = 'noMotorizedVehicle',
  desc = 'Track-like ways which disallow vehicles are bike friendly and can potentially be developed into bike infrastructure.',
  condition = function(tags)
    if tags.highway == 'track' or tags.highway == 'service' then
      -- https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:250
      if tags.vehicle == 'no'
        or contains_substring(tags.vehicle, 'delivery')
        or contains_substring(tags.vehicle, 'destination')
        or contains_traffic_sign_id(tags.traffic_sign, '250') then
        return true
      end
      -- https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:260
      if tags.motor_vehicle == 'no'
        or contains_substring(tags.motor_vehicle, 'delivery')
        or contains_substring(tags.motor_vehicle, 'destination')
        or contains_traffic_sign_id(tags.traffic_sign, '260') then
        return true
      end
      -- https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:251
      if tags.motorcar == 'no'
        or contains_substring(tags.motorcar, 'delivery')
        or contains_substring(tags.motorcar, 'destination')
        or contains_traffic_sign_id(tags.traffic_sign, '251') then
        return true
      end
    end
  end,
})

local no_overtaking = bike_suitability_new({
  id = 'noOvertaking',
  desc = 'Shared lane with overtaking prohibition for motor vehicles indicate that someone tried to make this infrastructure bike friendly.',
  condition = function(tags)
    if contains_traffic_sign_id(tags.traffic_sign, '277.1') then
      return true
    end
  end,
})

-- https://wiki.openstreetmap.org/wiki/DE:Tag:highway=living_street
local living_street = bike_suitability_new({
  id = 'livingStreet',
  desc = 'Living streets are considered bike friendly unless prohibited.' ..
      ' (DE: Verkehrsberuhigter Bereich AKA Spielstraße)',
  condition = function(tags)
    if tags.highway == 'living_street' then
      -- Exit if all vehicle are prohibited (but don't exit if bikes are allowed)
      if tags.vehicle == 'no' and not (tags.bicycle == 'yes' or tags.bicycle == 'designated') then
        return false
      end
      -- Exit if bikes are prohibited
      if tags.bicycle == 'no' or tags.bicycle == 'dismount' then
        return false
      end
      return true
    end
  end,
})

local category_definitions = {
  living_street,
  good_surface,
  no_motorized_vehicle,
  no_overtaking,
}

---@param tags OsmTags
---@return table|nil
local function categorize_bike_suitability(tags)
  for _, category in pairs(category_definitions) do
    if category:is_active(tags) then
      return category
    end
  end
  return nil
end

-- Match parking helpers: export a single function (not multiple parts).
return categorize_bike_suitability
