require('init')
require("Log")
local capacity_from_tag = require('capacity_from_tag')

---@meta

---@class OffStreetParkingCategory
class_off_street_parking_category = {}
class_off_street_parking_category.__index = class_off_street_parking_category

---@param args {
--- id: string,
--- conditions: fun(tags: table): (boolean),
--- tags: fun(tags: table):(table), -- Tags which have to be sanitized in the category.
--- tags_cc: table, -- Tags which will be prefixed with "osm_" and copied as is.
--- capacity_from_area: fun(tags: table, area: number):(table)|nil }
function class_off_street_parking_category.new(args)
  ---@class OffStreetParkingCategory
  local self = setmetatable({}, class_off_street_parking_category)
  self.id = args.id

  self._conditions = args.conditions -- use category:is_active(tags)
  self._tags = args.tags -- use category:get_tags(tags)
  self.tags_cc = args.tags_cc
  self._capacity_from_area = args.capacity_from_area -- use category:get_capacity(tags)

  return self
end

---@param tags table
---@return boolean
function class_off_street_parking_category:is_active(tags)
  return self._conditions(tags)
end

---@return table
function class_off_street_parking_category:get_tags(tags)
  return self._tags(tags)
end

---Returns a table representing an off-street parking category.
---@return table { area: number, capacity: number, capacity_confidence: "high"|"medium"|"low", capacity_source: string }
function class_off_street_parking_category:get_capacity(tags, area)
  return capacity_from_tag(tags, area) or self._capacity_from_area(tags, area)
end
