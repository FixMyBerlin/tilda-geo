require('init')
require("Log")
local capacity_from_tag = require('capacity_from_tag')
local round = require('round')

---@meta
---@class SeparateParkingCategory
class_separate_parking_category = {}
class_separate_parking_category.__index = class_separate_parking_category

---@param args {
--- id: string,
--- buffer_radius: fun(tags: table):(number|nil), -- Radius in meters for adding a buffer or 0.
--- conditions: fun(tags: table): (boolean),
--- }
function class_separate_parking_category.new(args)
  ---@class SeparateParkingCategory
  local self = setmetatable({}, class_separate_parking_category)
  self.id = args.id

  self._buffer_radius = args.buffer_radius -- use category:get_buffer_radius(tags)
  self._conditions = args.conditions -- use category:is_active(tags)

  return self
end

---@param tags table
---@return boolean
function class_separate_parking_category:is_active(tags)
  return self._conditions(tags)
end

---@param tags table
---@return number|nil
function class_separate_parking_category:get_buffer_radius(tags)
  return self._buffer_radius(tags)
end

-- NOTE: Match SQL constants and formulas from
-- `processing/topics/parking/custom_functions/estimate_capacity.sql`.
-- SQL defines `_parking_orientation_constants` and uses:
--   length → capacity: (length + padding) / (car_space_x + padding)
--   length → area:     length * (car_space_y + 0.25)
-- Invert for area → capacity to match SQL closely:
--   length = area / (car_space_y + 0.25)
--   capacity_raw = (length + padding) / (car_space_x + padding)
--                = area / ((car_space_y + 0.25) * (car_space_x + padding)) + padding/(car_space_x + padding)
local function compute_area_to_capacity_constants(orientation)
  if orientation == 'perpendicular' then
    return 2.0, 4.4, 0.5
  elseif orientation == 'diagonal' then
    local deg = 60
    local s = math.sin(math.rad(deg))
    local c = math.cos(math.rad(deg))
    local car_space_x = s * 4.4 + c * 2.0
    local car_space_y = c * 4.4 + s * 2.0
    local padding = c * 0.5
    return car_space_x, car_space_y, padding
  else -- 'parallel' and fallback
    return 4.4, 2.0, 0.8
  end
end

local function capacity_from_area(area, orientation)
  local car_space_x, car_space_y, padding = compute_area_to_capacity_constants(orientation)
  local denom = (car_space_y + 0.25) * (car_space_x + padding)
  local offset = padding / (car_space_x + padding)
  return (area / denom) + offset
end

-- Match SQL rounding behavior from `5_estimate_parking_capacities.sql`:
-- if capacity + 0.1 < 10 → floor; else → round to nearest integer
local function normalize_capacity(capacity_raw)
  if capacity_raw == nil then return nil end
  return round(capacity_raw, 0)

  -- NOTE: We get closer to the numbers from Python by always rounding…
  -- if (capacity_raw + 0.1) < 10 then
  --   return math.floor(capacity_raw)
  -- else
  --   return round(capacity_raw, 0)
  -- end
end

---Create capacity taga from tags or fallback.
---Handles area and point datas.
---@param type string<'way'|'node'|'relation'> -- object.type, see https://osm2pgsql.org/doc/manual-v1.html#processing-callbacks
---@param tags table
---@param area number|nil
---@return table<{ area: number, capacity: number, capacity_confidence: "high"|"medium"|"low", capacity_source: string }>
function class_separate_parking_category:get_capacity(type, tags, area)
  -- For areas, we expect to have a `area` value passed in.
  -- Based on that we either either return confidenc=high from tags.capacity
  -- or confidence=medium from area.
  if type == 'way' or type == 'relation' then
    if not area then error('class_separate_parking_category:get_capacity requires an area=<Number> value for area data.') end

    local result_from_capacity_tag = capacity_from_tag(tags, area)
    if result_from_capacity_tag ~= nil then return result_from_capacity_tag end

    return {
      area = round(area, 2),
      capacity = normalize_capacity(capacity_from_area(area, tags.orientation)),
      capacity_confidence = tags.orientation and 'medium' or 'low',
      capacity_source = 'area_and_orientation_' .. (tags.orientation or 'parallel'),
    }
  end

  -- For points, we only have a capacity or assume 1
  -- Based on that we calculate an area.
  -- or confidence=medium from area.
  if type == 'node' then
    if area then error ('class_separate_parking_category:get_capacity does not expect area=<Number> value for point data.') end
    local car_space_x, car_space_y, padding = compute_area_to_capacity_constants(tags.orientation)
    local denom = (car_space_y + 0.25) * (car_space_x + padding)
    area = (tags.capacity or 1) * denom

    if tags.capacity then
      local result_from_capacity_tag = capacity_from_tag(tags, area)
      if result_from_capacity_tag ~= nil then return result_from_capacity_tag end
    end

    return {
      area = round(area, 2),
      capacity = 1,
      capacity_confidence = 'low',
      capacity_source = 'assumed_default',
    }
  end

  error('class_separate_parking_category:get_capacity has to have type=node or type=way')
end
