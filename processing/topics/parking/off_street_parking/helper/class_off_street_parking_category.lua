require('init')
require("Log")
local capacity_tags = require('capacity_tags')
local THIS_OR_THAT = require('this_or_that')

---@meta
---@class OffStreetParkingCategory
class_off_street_parking_category = {}
class_off_street_parking_category.__index = class_off_street_parking_category

---@param args {
--- id: string,
--- conditions: fun(tags: table): (boolean),
--- capacity_from_area: fun(tags: table, area: number):table }
---   Function that calculates capacity_tags by dividing area by a category-specific factor.
---   Always returns table with {value, confidence, source} (with nil values if not applicable, e.g., point categories).
function class_off_street_parking_category.new(args)
  ---@class OffStreetParkingCategory
  local self = setmetatable({}, class_off_street_parking_category)
  self.id = args.id

  self._conditions = args.conditions -- use category:is_active(tags)
  self._capacity_tags_from_area = args.capacity_from_area -- use category:get_capacity(tags)

  return self
end

---@param tags table
---@return boolean
function class_off_street_parking_category:is_active(tags)
  return self._conditions(tags)
end

---Returns capacity_tags combining tag-based capacity (if present) with area-based capacity (if applicable).
---@param tags table Object tags
---@param area number|nil Area value (can be nil)
---@return table { value: number|nil, confidence: "high"|"medium"|"low"|nil, source: string|nil }
function class_off_street_parking_category:get_capacity(tags, area)
  local tag_capacity = capacity_tags(tags)

  if area == nil then
    return tag_capacity
  end

  local area_capacity_tags = self._capacity_tags_from_area(tags, area)

  -- Prefer tag-based capacity over area-based capacity
  return THIS_OR_THAT.value_confidence_source(tag_capacity, area_capacity_tags)
end
