require('init')
require('Clone')
require('Log')
require('obstacle_point_categories')
require('transform_point_direction_tags')
local TAG_HELPER = require('tag_helper')
require('class_obstacle_category')

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

  -- Step 1: Find best matching specific category (largest buffer wins)
  for _, category in ipairs(obstacle_point_categories) do
    if category:is_active(object.tags) then
      local buffer = category:get_buffer_radius(object.tags)
      if buffer and buffer > max_buffer then
        max_buffer = buffer
        best_result.category = category
        best_result.object = MetaClone(object)
      end
    end
  end

  -- Step 2: Fallback for unmatched obstacle:parking=yes items
  -- Uses default buffer radius of 0.5m for unknown obstacles (nodes).
  if not best_result.category and TAG_HELPER.is_obstacle_parking(object.tags) then
    best_result.category = class_obstacle_category.new({
      id = 'other',
      buffer_radius = function(tags) return 0.5 end,
      conditions = function(tags) return false end, -- Never matches in main loop
      tags = function(tags) return {} end,
      tags_cc = {},
    })
    best_result.object = MetaClone(object)
  end

  return best_result
end

return categorize_obstacle_points
