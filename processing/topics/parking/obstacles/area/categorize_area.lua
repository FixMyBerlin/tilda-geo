require('init')
require('Log')
require('obstacle_area_categories')
require('class_obstacle_category')
local TAG_HELPER = require('tag_helper')

---@return table<string, { category: ObstacleCategory, object: OSMObject} | { category: nil, object: nil}>
function categorize_area(object)
  for _, category in ipairs(obstacle_area_categories) do
    if category:is_active(object.tags) then
      return {
        category = category,
        object = object
      }
    end
  end

  -- Fallback for unmatched obstacle:parking=yes items
  -- Uses default buffer radius of 0.5m for unknown obstacles.
  if TAG_HELPER.is_obstacle_parking(object.tags) then
    return {
      category = class_obstacle_category.new({
        id = 'other',
        buffer_radius = function(_) return 0.5 end,
        conditions = function(_) return false end,
        tags = function(_) return {} end,
        tags_cc = {},
      }),
      object = object,
    }
  end

  return {
    category = nil,
    object = nil
  }
end
