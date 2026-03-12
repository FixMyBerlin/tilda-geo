local time_helper = require('time_helper')

local WEEKDAYS = time_helper.WEEKDAYS
local ranges_to_string = time_helper.ranges_to_string
local compact_day_map = time_helper.compact_day_map
local merge_ranges = time_helper.merge_ranges
local subtract_ranges = time_helper.subtract_ranges
local build_day_map = time_helper.build_day_map

-- Detect prohibition entries
---@param entry string
---@return boolean
local function is_prohibition(entry)
  if not entry or type(entry) ~= 'string' then
    return false
  end

  return entry:match("^no_parking")
      or entry:match("^no_standing")
      or entry:match("^no_stopping")
end

------------------------------------------------------------
-- Main Function: Subtract prohibition rules from other rules
------------------------------------------------------------

-- This function subtracts parking prohibition times from other parking condition times in the provided list. Prohibition rules or conditions without times remain unchanged.
-- Example:
-- { 'loading (09:00-20:00)', 'no_parking (14:00-18:00)' } => { 'loading (09:00-14:00,18:00-20:00)', 'no_parking (14:00-18:00)' }
---@param list string[]|nil The list containing parking conditions
---@return string[]|nil The list with adjusted time intervals, or the same list if no adjustments are necessary
function subtract_prohibitions(list)
  if not list or #list == 0 then
    return list
  end

  local prohibitions = {}
  for _, d in ipairs(WEEKDAYS) do
    prohibitions[d] = {}
  end

  -- Collect all prohibition intervals
  for _, entry in ipairs(list) do
    if is_prohibition(entry) then
      local cond = entry:match("%((.*)%)")
      if cond then
        local map = build_day_map(cond)
        if map then
          for _,day in ipairs(WEEKDAYS) do
            for _,r in ipairs(map[day]) do
              table.insert(prohibitions[day], r)
            end
          end
        end
      end
    end
  end

  for _,day in ipairs(WEEKDAYS) do
    prohibitions[day] = merge_ranges(prohibitions[day])
  end

  -- Apply subtraction to non-prohibition rules
  local result = {}
  for _, entry in ipairs(list) do
    if not is_prohibition(entry) then
      local cond = entry:match("%((.*)%)")
      if cond then
        local base_map = build_day_map(cond)
        if base_map then
          local day_time_map = {}
          for _, day in ipairs(WEEKDAYS) do
            local remaining =
              subtract_ranges(base_map[day], prohibitions[day])
            local str = ranges_to_string(remaining)
            if str then
              day_time_map[day] = str
            end
          end

          local new_cond = compact_day_map(day_time_map)
          if new_cond and new_cond ~= "" then
            entry = entry:gsub("%(.*%)", "(" .. new_cond .. ")")
          end
        end
      end
    end
    table.insert(result, entry)
  end
  return result
end

return subtract_prohibitions
