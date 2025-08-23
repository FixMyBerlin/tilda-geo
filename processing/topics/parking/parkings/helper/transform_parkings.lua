require('init')
require("Log")
require("Clone")
require("unnest_parking_tags")

---@class TransformedObject
---@field side string
---@field _parent_tags string
---@field [string] any

---@class TransformationResults
---@field left TransformedObject | nil
---@field right TransformedObject | nil

--- Transform Centerline data into left|right data
---@param object table
---@return TransformationResults
local function transform_parkings(object)
  local result_objects = { left = nil, right = nil}

  for _, side in ipairs({ "left", "right" }) do
    local side_object = MetaClone(object)

    -- We look for tags with the following hierarchy: `prefix:side` > `prefix:both` > `prefix`
    -- thus a more specific tag will always overwrite a more general one
    local result_tags = {
      side = side,
    }
    unnest_parking_tags(object.tags, '', result_tags)
    unnest_parking_tags(object.tags, ':both', result_tags)
    unnest_parking_tags(object.tags, ':' .. side, result_tags)

    side_object.tags = result_tags
    side_object._parent_tags = object.tags
    result_objects[side] = side_object
  end

  return result_objects
end

return transform_parkings
