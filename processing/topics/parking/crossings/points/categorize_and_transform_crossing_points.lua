require('init')
require('Clone')
require('Log')
require('transform_point_direction_tags')
local crossing_point_categories = require('crossing_point_categories')

-- Categorize the object and transforms it if needed. Picks the best result for self, left, right.
-- The best result is the one with the largest buffer.
-- Handles three cases of data:
-- - 'self': Points that are applied once at their given location
-- - 'left/right': Points that have a key that specifies the side; those are duplicated based on that key.
-- - 'left/right': Points that are are always applied to both sides; those are always duplicated.
---@class CrossingObject
---@field tags table<string, string>
---@field _side string|nil
--
---@class BestCrossingResult
---@field category CrossingCategory|nil
---@field object CrossingObject|nil
--
---@class BestCrossingResultTable
---@field self BestCrossingResult
---@field left BestCrossingResult
---@field right BestCrossingResult
--
---@return table<string, BestCrossingResult>
local function categorize_and_transform_crossing_points(object)
  ---@type table<string, number>
  local max_buffer = { self = -1, left = -1, right = -1 }

  ---@type BestCrossingResultTable
  local best_result = {
    self = { category = nil, object = nil },
    left = { category = nil, object = nil },
    right = { category = nil, object = nil },
  }

  for _, category in ipairs(crossing_point_categories) do
    if category:is_active(object.tags) then
      -- CASE: Handle `side_suffix` (`foo:left=bar`)
      -- Handled separately from 1 and 2.
      if(category.side_schema == 'side_suffix') then
        for _, side in ipairs({ 'left', 'right' }) do
          local side_key = category.side_key .. ':' .. side
          local other_side_key = (side == 'left' and category.side_key .. ':right') or category.side_key .. ':left'
          local both_key = category.side_key .. ':both'

          if object.tags[side_key] or object.tags[both_key] then
            local buffer = category:get_perform_buffer(object.tags)
            if buffer > max_buffer[side] then
              max_buffer[side] = buffer
              best_result[side].category = category

              local side_object = MetaClone(object)
              side_object.tags[category.side_key] = side_object.tags[both_key] or side_object.tags[side_key]
              side_object.tags[other_side_key] = nil
              side_object.tags[side_key] = nil
              side_object.tags[both_key] = nil
              side_object.tags.side = side
              best_result[side].object = side_object
            end
          end
        end
      end

      if(category.side_schema == 'side_value' or
        category.side_schema == 'direction_key' or
        category.side_schema == 'none'
      ) then
        -- CASE: Handle `side_value` (`foo=left|right|both`)
        -- This is the main code below.
        --
        -- CASE: Handle `direction_key` (`foo=bar + direction=forward`)
        -- Handled by the `side_value` code after we modify the tags to follow that schema
        if(category.side_schema == 'direction_key') then
          transform_point_direction_tags(object.tags, category.side_key)
        end

        -- CASE: WITH side_key
        -- Points that are only transformed if a given side is present (including 'both')
        if (category.side_key) then
          local side_set = { object.tags[category.side_key] }
          if (object.tags[category.side_key] == 'both') then
            side_set = { 'left', 'right' }
          end

          for _, side in ipairs(side_set) do
            -- Log(category, '333')
            local buffer = category:get_perform_buffer(object.tags)
            -- Log(buffer, '333aaa')
            -- Log(side, '333bbb')
            -- Log(max_buffer[side], '333ccc')
            if buffer > max_buffer[side] then
              max_buffer[side] = buffer
              best_result[side].category = category

              local side_object = MetaClone(object)
              side_object.tags[category.side_key] = side -- overwrite 'both' with left/right
              side_object.tags.side = side
              best_result[side].object = side_object
            end
          end
        end

        -- CASE: WITHOUT side_key
        -- Points that are always transformed to left/right
        if(not category.side_key) then
          for _, side in ipairs({ 'left', 'right' }) do
            local buffer = category:get_perform_buffer(object.tags)
            if buffer > max_buffer[side] then
              max_buffer[side] = buffer
              best_result[side].category = category

              local side_object = MetaClone(object)
              side_object.tags.side = side
              best_result[side].object = side_object
            end
          end
        end
      end
    end
  end

  return best_result
end

return categorize_and_transform_crossing_points
