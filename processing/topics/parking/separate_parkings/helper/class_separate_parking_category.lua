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
--- perform_buffer: fun(tags: table):(number|nil), -- Radius in meters for adding a buffer or 0.
--- tags: fun(tags: table):(table), -- Tags which have to be sanitized in the category.
--- tags_cc: table, -- Tags which will be prefixed with "osm_" and copied as is.
--- conditions: fun(tags: table): (boolean),
--- }
function class_separate_parking_category.new(args)
  ---@class SeparateParkingCategory
  local self = setmetatable({}, class_separate_parking_category)
  self.id = args.id

  self._perform_buffer = args.perform_buffer -- use category:get_perform_buffer(tags)

  self._tags = args.tags -- use category:get_tags(tags)
  self.tags_cc = args.tags_cc
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
function class_separate_parking_category:get_perform_buffer(tags)
  return self._perform_buffer(tags)
end

---@return table
function class_separate_parking_category:get_tags(tags)
  return self._tags(tags)
end

---Create capacity taga from tags or fallback.
---Handles area and point datas.
---@param type string<'way'|'node'|'relation'> -- object.type, see https://osm2pgsql.org/doc/manual-v1.html#processing-callbacks
---@param tags table
---@param area number|nil
---@return table<{ area: number, capacity: number, capacity_confidence: "high"|"medium"|"low", capacity_source: string }>
function class_separate_parking_category:get_capacity(type, tags, area)
  local factor = 14.5 -- TODO: Improve factor based on orientation

  -- For areas, we expect to have a `area` value passed in.
  -- Based on that we either either return confidenc=high from tags.capacity
  -- or confidence=medium from area.
  if type == 'way' or type == 'relation' then
    if not area then error('class_separate_parking_category:get_capacity requires an area=<Number> value for area data.') end

    local result_from_capacity_tag = capacity_from_tag(tags, area)
    if result_from_capacity_tag ~= nil then return result_from_capacity_tag end

    return {
      area = round(area, 2),
      capacity = round(area / factor, 0),
      capacity_confidence = 'medium',
      capacity_source = 'area',
    }
  end

  -- For points, we only have a capacity or assume 1
  -- Based on that we calculate an area.
  -- or confidence=medium from area.
  if type == 'node' then
    if area then error ('class_separate_parking_category:get_capacity does not expect area=<Number> value for point data.') end
    local area = (tags.capacity or 1) * factor  -- TODO LATER: Add error when capacity is nil

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
