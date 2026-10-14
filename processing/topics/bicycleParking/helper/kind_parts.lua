local AMENITY_KINDS = require('topics.bicycleParking.helper.amenity_kinds')

---@class BicycleParkingPart
---@field kind BicycleParkingKind
---@field capacity number|nil

-- Spaces of another kind, counted in `capacity:<subkey>` and taken out of `capacity`.
-- The rest of `capacity` is `bicycle_parking`. Add a row to split out another kind.
local CAPACITY_SUBKEY_KINDS = {
  { subkey = 'cargo_bike', kind = 'cargo_bike_parking' },
}

---@param value string|nil
---@return number|nil
local function positive_number(value)
  local number = tonumber(value)
  if number == nil or number <= 0 then return nil end
  return number
end

---@param kind BicycleParkingKind
---@param capacity number|nil
---@return BicycleParkingPart[]
local function single_part(kind, capacity)
  return { { kind = kind, capacity = capacity } }
end

--- `amenity=bicycle_parking`: the normal spaces plus one part per `capacity:<subkey>`.
--- A `capacity` that is not a number is unknown: the normal spaces exist, but are not counted.
---@param tags OsmTags
---@return BicycleParkingPart[]
local function bicycle_parking_parts(tags)
  local subparts = {}
  local subpart_sum = 0
  for _, row in ipairs(CAPACITY_SUBKEY_KINDS) do
    local capacity = positive_number(tags['capacity:' .. row.subkey])
    if capacity then
      table.insert(subparts, { kind = row.kind, capacity = capacity })
      subpart_sum = subpart_sum + capacity
    end
  end

  if #subparts == 0 then
    local kind = tags.cargo_bike == 'designated' and 'cargo_bike_parking' or 'bicycle_parking'
    return single_part(kind, positive_number(tags.capacity))
  end

  local parts = {}
  local total = tonumber(tags.capacity)
  if tags.capacity ~= nil and total == nil then
    table.insert(parts, { kind = 'bicycle_parking', capacity = nil })
  elseif total ~= nil and total - subpart_sum > 0 then
    table.insert(parts, { kind = 'bicycle_parking', capacity = total - subpart_sum })
  end
  for _, part in ipairs(subparts) do
    table.insert(parts, part)
  end
  return parts
end

--- The parts of an OSM object, one row each. The `bicycle_parking` part comes first.
--- Empty when the object is not a bicycle parking kind (the object is skipped).
---@param tags OsmTags
---@return BicycleParkingPart[]
local function kind_parts(tags)
  local kind = AMENITY_KINDS[tags.amenity]
  if kind == nil then return {} end

  if kind == 'bicycle_parking' then
    return bicycle_parking_parts(tags)
  end

  if kind == 'bicycle_rental' and (tags.bicycle_rental == 'shop' or tags.bicycle_rental == 'virtual') then
    return {}
  end

  return single_part(kind, positive_number(tags.capacity))
end

return kind_parts
