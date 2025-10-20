require('init')
require('Log')

---@meta
---@class PublicTransportCategory
class_public_transport_category = {}
class_public_transport_category.__index = class_public_transport_category

---@param args {
--- id: string,
--- buffer_radius: number, -- Radius in meters for adding a buffer or 0.
--- tags: fun(tags: table):(table), -- Tags which have to be sanitized in the category.
--- conditions: fun(tags: table): (boolean),
--- }
function class_public_transport_category.new(args)
  ---@class PublicTransportCategory
  local self = setmetatable({}, class_public_transport_category)
  self.id = args.id
  self.buffer_radius = args.buffer_radius

  self._tags = args.tags -- use category:get_tags(tags)
  self._conditions = args.conditions -- use category:is_active(tags)

  return self
end

---@param tags table
---@return boolean
function class_public_transport_category:is_active(tags)
  return self._conditions(tags)
end


---@return table
function class_public_transport_category:get_tags(tags)
  return self._tags(tags)
end
