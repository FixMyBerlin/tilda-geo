local time_helper = require('time_helper')

local WEEKDAYS = time_helper.WEEKDAYS
local expand_day_expr = time_helper.expand_day_expr
local parse_times = time_helper.parse_times
local invert_ranges = time_helper.invert_ranges
local ranges_to_string = time_helper.ranges_to_string
local compact_day_map = time_helper.compact_day_map

-- This function inverts time conditions, for example, to derive the times you have to pay for parking from a time specification for free parking/no fees.
-- Example:
-- Input: "Mo-Fr 00:00-09:00,22:00-24:00; Sa 00:00-09:00,18:00-24:00; Su" (from fee:conditional = no @ (...))
-- Output: "Mo-Fr 09:00-22:00; Sa 09:00-18:00" (the times you have to pay for parking here)
---@param condition string|nil The condition to invert. Should be a time interval according to OSM opening hours syntax
---@return string|nil The inverted time interval, or nil if input is not matching typical day and time patterns (e.g. "Mar-Oct: ...", "maxweight > 7.5")
function invert_time_condition(condition)
  if not condition or type(condition) ~= 'string' then
    return nil
  end

  -- Initial: 24 hours a day
  local day_map = {}
  for _,d in ipairs(WEEKDAYS) do
    day_map[d] = { { from=0, to=1440 } }
  end

  -- Separate blocks (;)
  for block in condition:gmatch("[^;]+") do
    block = block:match("^%s*(.-)%s*$")

    -- First try to parse "DAY(S) TIME" (e.g. "Mo-Fr 00:00-09:00")
    local day_part, time_part = block:match("^([A-Za-z%-,]+)%s+(.+)$")

    -- If that didn't match, we may have either:
    --   * only a day expression (e.g. "Su" or "Mo-Fr")
    --   * only a time expression (e.g. "10:00-12:00")
    if not day_part then
      -- Day-only? (no time given, means whole day)
      local days_only = expand_day_expr(block)
      if days_only then
        day_part = block
        time_part = nil
      elseif block == "Mo-Su" then
        -- Explicit full week shorthand without time
        day_part = "Mo-Su"
        time_part = nil
      elseif block:match("^%d") then
        -- Time only (applies to all days)
        day_part = "Mo-Su"
        time_part = block
      else
        -- unsupported (e.g. month, or other non-time expressions)
        return nil
      end
    end

    local days = expand_day_expr(day_part)
    if not days then
      if day_part == "Mo-Su" then
        days = WEEKDAYS
      else
        return nil
      end
    end

    -- Whole day
    if not time_part then
      for _,d in ipairs(days) do
        day_map[d] = { { from=0, to=1440 } }
      end
    else
      local parsed = parse_times(time_part)
      if not parsed then return nil end

      for _,d in ipairs(days) do
        day_map[d] = parsed
      end
    end
  end

  -- Invert
  local day_time_map = {}

  for _,day in ipairs(WEEKDAYS) do
    local inverted = invert_ranges(day_map[day])
    local str = ranges_to_string(inverted)
    if str then
      day_time_map[day] = str
    end
  end

  -- If no fee periods remain
  local any = false
  for _,v in pairs(day_time_map) do
    any = true
    break
  end
  if not any then return nil end

  return compact_day_map(day_time_map)
end

return invert_time_condition
