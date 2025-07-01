require('init')
require('Clone')
require('Log')
require('obstacle_point_categories')
require('transform_point_direction_tags')

-- Categorize the object and picks the best result (with the largest buffer).
---@class ObstacleObject
---@field tags table<string, string>
--
---@class BestObstaceResult
---@field category ObstacleCategory|nil
---@field object ObstacleObject|nil
--
---@return table<string, BestObstaceResult>
local function categorize_obstacle_points(object)
  ---@type number
  local max_buffer = -1

  ---@type BestObstaceResult
  local best_result = { category = nil, object = nil }

  for _, category in ipairs(obstacle_point_categories) do
    if category:is_active(object.tags) then
      local buffer = category:get_buffer_radius(object.tags)
      if buffer and buffer > max_buffer then
        max_buffer = buffer
        best_result.category = category

        local side_object = MetaClone(object)
        best_result.object = side_object
      end
    end
  end

  return best_result
end

return categorize_obstacle_points
