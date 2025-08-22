require('init')
require("Log")

---@meta
---@class SeparateParkingCategory
class_separate_parking_category = {}
class_separate_parking_category.__index = class_separate_parking_category

---@param args {
--- id: string,
--- conditions: fun(tags: table): (boolean),
--- }
function class_separate_parking_category.new(args)
  ---@class SeparateParkingCategory
  local self = setmetatable({}, class_separate_parking_category)
  self.id = args.id

  self._conditions = args.conditions -- use category:is_active(tags)

  return self
end

---@param tags table
---@return boolean
function class_separate_parking_category:is_active(tags)
  return self._conditions(tags)
end
