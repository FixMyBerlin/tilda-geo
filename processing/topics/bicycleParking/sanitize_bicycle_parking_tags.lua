local sanitize_for_logging = require('topics.helper.sanitize_for_logging')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local SANITIZE_VALUES = require('topics.helper.sanitize_values')
local AMENITY_KINDS = require('topics.bicycleParking.helper.amenity_kinds')

local YES_NO = { 'yes', 'no' }

--- Raw OSM value of `position`: `<amenity>:position` (e.g. `small_electric_vehicle_parking:position`), then `bicycle_parking:position`, then `position`.
---@param tags OsmTags
---@return string|nil
local function position_raw(tags)
  local amenity_position = AMENITY_KINDS[tags.amenity] and tags[tags.amenity .. ':position'] or nil
  return amenity_position or tags['bicycle_parking:position'] or tags.position
end

--- Map `separate_tags` result keys to OSM strings when the result key differs from `object_tags[key]`.
---@param tags OsmTags
---@return table
local function log_source_overrides(tags)
  return {
    access_cargo_bike = tags.cargo_bike,
    stand_type = tags.bicycle_parking,
    rental_type = tags.bicycle_rental,
    operator_type = SANITIZE_TAGS.operator_type_log_source(tags),
    position = position_raw(tags),
  }
end

local SANITIZE_BICYCLE_PARKING = {
  -- Expose this key explicitly so `separate_tags` can map derived result keys
  -- back to the original OSM source fields for error reporting.
  log_source_overrides = log_source_overrides,
  ---@param value string|nil
  access = function(value)
    return sanitize_for_logging(value, { 'yes', 'private', 'permissive', 'customers', 'members', 'no' })
  end,

  --- nil preserves implicit-default behaviour (`implicit_no`).
  ---@param value string|nil
  covered = function(value)
    if value == nil then
      return 'implicit_no'
    end
    return sanitize_for_logging(value, { 'yes', 'no', 'partial' })
  end,

  ---@param value string|nil
  fee = function(value)
    if value == nil then
      return 'implicit_no'
    end
    return sanitize_for_logging(value, YES_NO)
  end,

  ---@param value string|nil
  cargo_bike = function(value)
    return sanitize_for_logging(value, { 'yes', 'designated' }, { 'no' })
  end,

  ---@param value string|nil
  lit = function(value)
    return sanitize_for_logging(value, { 'yes', 'no' })
  end,

  --- `bicycle_parking=*`, the type of stand
  ---@param value string|nil
  stand_type = function(value)
    -- The values of https://wiki.openstreetmap.org/wiki/Key:bicycle_parking that occur in Germany.
    return sanitize_for_logging(value, {
      -- Stands and holders
      'stands', 'wide_stands', 'bollard', 'wall_loops', 'rack', 'safe_loops', 'ground_slots', 'anchors',
      'lean_and_stick', 'handlebar_holder', 'upright_stands', 'two-tier',
      -- Closed or covered
      'shed', 'building', 'lockers', 'streetpod', 'smart_dock',
      -- No holder
      'floor',
    })
  end,

  --- Disallowed when set but not a number, else nil: the capacity of a row comes from kind_parts.lua.
  ---@param value string|nil
  capacity_check = function(value)
    if value == nil or tonumber(value) ~= nil then return nil end
    return SANITIZE_VALUES.disallowed
  end,

  --- `bicycle_rental=*`, the type of rental station
  ---@param value string|nil
  rental_type = function(value)
    return sanitize_for_logging(value, {
      'docking_station', 'dropoff_point', 'key_dispensing_machine',
    })
  end,

  surveillance = function(value)
    return sanitize_for_logging(value, {
      'outdoor', 'public', 'indoor', 'yes', 'webcam', 'traffic', 'camera', 'private',
    }, {
      'no',
    })
  end,
  ---@param tags OsmTags
  position = function(tags)
    -- Grouped as in the position proposal (https://wiki.openstreetmap.org/wiki/Proposal:Position_of_bicycle_parking_facilities_and_other_street_furniture).
    return sanitize_for_logging(position_raw(tags), {
      -- Pedestrian space
      'sidewalk', 'grass_verge', 'kerb_extension', 'pedestrian_area',
      -- Roadway
      'lane', 'street_side', 'shoulder', 'traffic_island', 'parklet',
      -- Off street
      'park', 'school_ground', 'playground', 'parking_lot', 'parking', 'driveway',
      -- Fallbacks
      'private_property', 'public_property',
    })
  end,
}

return SANITIZE_BICYCLE_PARKING
