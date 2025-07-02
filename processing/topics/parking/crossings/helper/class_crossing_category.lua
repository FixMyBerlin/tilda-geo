require('init')
require("Log")

---@meta
---@class CrossingCategory
class_crossing_category = {}
class_crossing_category.__index = class_crossing_category

---@param args {
--- id: string,
--- side_schema: 'side_suffix'|'side_value'|'direction_key'|'none', -- The tagging schema used to encode the SIDE in the tag(s). Requires `side_key` and `perform_snap=side`. `side_suffix` is not implemented, yet.
--- side_key: string|nil, -- The OSM Key that has the value of "left|right|both"; For `direction_key` a prefixed `side_key` is needed like `_side_key_traffic_calming`. This will receive the SIDE value. For `side_schema=none` use `side_key=nil`.
--- buffer_radius: fun(tags: table):(number|nil), -- Radius in meters for adding a buffer or 0.
--- tags: fun(tags: table):(table), -- Tags which have to be sanitized in the category.
--- tags_cc: table, -- Tags which will be prefixed with "osm_" and copied as is.
--- conditions: fun(tags: table): (boolean),
--- }
function class_crossing_category.new(args)
  ---@class CrossingCategory
  local self = setmetatable({}, class_crossing_category)
  self.id = args.id

  self.side_schema = args.side_schema
  self.side_key = args.side_key

  self._buffer_radius = args.buffer_radius -- use category:get_buffer_radius(tags)

  self._tags = args.tags -- use category:get_tags(tags)
  self.tags_cc = args.tags_cc
  self._conditions = args.conditions -- use category:is_active(tags)

  return self
end

---@param tags table
---@return boolean
function class_crossing_category:is_active(tags)
  return self._conditions(tags)
end

---@param tags table
---@return number|nil
function class_crossing_category:get_buffer_radius(tags)
  return self._buffer_radius(tags)
end

---@return table
function class_crossing_category:get_tags(tags)
  return self._tags(tags)
end
