------------------------------------------------------------
-- Help functions for handling, inverting and sorting time restrictions
------------------------------------------------------------

local M = {}

---@type string[]
M.WEEKDAYS = { "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su", "PH", "SH" }

---@param day string
---@return number|nil
local function weekday_index(day)
  for i, v in ipairs(M.WEEKDAYS) do
    if v == day then
      return i
    end
  end
  return nil
end

---@param expr string
---@return string[]|nil
local function expand_day_range(expr)
  -- Single day (e.g. "Su")?
  if weekday_index(expr) then
    return { expr }
  end

  -- Range of days? (e.g. "Mo-Fr")
  local a, b = expr:match("^(%a%a)%-(%a%a)$")
  if not a then return nil end

  local ia = weekday_index(a)
  local ib = weekday_index(b)
  if not ia or not ib then return nil end

  local result = {}
  for i = ia, ib do
    table.insert(result, M.WEEKDAYS[i])
  end
  return result
end

---@param t string Time string "HH:MM" or "H:MM"
---@return number|nil Minutes since midnight
local function time_to_min(t)
  local h, m = t:match("^(%d%d?):(%d%d)$")
  if not h then
    return nil
  end
  return tonumber(h) * 60 + tonumber(m)
end

---@param m number Minutes since midnight
---@return string "HH:MM"
local function min_to_time(m)
  return string.format("%02d:%02d", math.floor(m / 60), m % 60)
end

-- Expand expressions that can contain comma-separated days and ranges,
-- e.g. "Mo,We,Fr" or "Mo-We,Su".
---@param expr string
---@return string[]|nil
function M.expand_day_expr(expr)
  local all_days = {}
  local seen = {}

  for part in expr:gmatch("[^,]+") do
    part = part:match("^%s*(.-)%s*$")
    if part ~= "" then
      local days = expand_day_range(part)
      if not days then
        return nil
      end
      for _, d in ipairs(days) do
        if not seen[d] then
          table.insert(all_days, d)
          seen[d] = true
        end
      end
    end
  end

  return all_days
end

---@param str string Comma-separated time ranges "HH:MM-HH:MM,..."
---@return {from: number, to: number}[]|nil
function M.parse_times(str)
  local ranges = {}

  for r in str:gmatch("[^,]+") do
    r = r:match("^%s*(.-)%s*$")
    local a,b = r:match("^(%d%d?:%d%d)%-(%d%d?:%d%d)$")
    if not a then return nil end

    local from = time_to_min(a)
    local to   = time_to_min(b)
    if not from or not to then return nil end

    table.insert(ranges, { from = from, to = to })
  end

  table.sort(ranges, function(x,y) return x.from < y.from end)
  return ranges
end

---@param ranges {from: number, to: number}[]
---@return {from: number, to: number}[]
function M.invert_ranges(ranges)
  local result = {}
  local cur = 0

  for _, r in ipairs(ranges) do
    if r.from > cur then
      table.insert(result, { from = cur, to = r.from })
    end
    cur = math.max(cur, r.to)
  end

  if cur < 1440 then
    table.insert(result, { from = cur, to = 1440 })
  end

  return result
end

---@param ranges {from: number, to: number}[]
---@return string|nil
function M.ranges_to_string(ranges)
  if #ranges == 0 then
    return nil
  end
  local parts = {}
  for _, r in ipairs(ranges) do
    table.insert(parts, min_to_time(r.from) .. "-" .. min_to_time(r.to))
  end
  return table.concat(parts, ",")
end

-- Compacting identical times on different days in the weekday list to generate day ranges
---@param day_time_map table<string, string> Map weekday key (e.g. "Mo") to time range string
---@return string
function M.compact_day_map(day_time_map)
  local groups = {}

  for _, day in ipairs(M.WEEKDAYS) do
    local t = day_time_map[day]
    if t then
      groups[t] = groups[t] or {}
      table.insert(groups[t], day)
    end
  end

  local result_parts = {}

  for time_str, days in pairs(groups) do
    table.sort(days, function(a, b)
      return weekday_index(a) < weekday_index(b)
    end)

    -- Build contiguous segments (for ranges like Mo-Fr),
    -- then combine all segments with commas into a single expression,
    -- e.g. "Mo,We,Fr" or "Mo-We,Su".
    local segments = {}
    local range_start = days[1]
    local prev_index = weekday_index(days[1])

    for i = 2, #days do
      local idx = weekday_index(days[i])

      if idx ~= prev_index + 1 then
        -- Close current segment
        table.insert(segments, { start = range_start, finish = days[i-1] })
        range_start = days[i]
      end

      prev_index = idx
    end

    -- Add last segment
    table.insert(segments, { start = range_start, finish = days[#days] })

    -- Convert segments into a compact day expression
    local day_parts = {}
    for _, seg in ipairs(segments) do
      if seg.start == seg.finish then
        table.insert(day_parts, seg.start)
      else
        table.insert(day_parts, seg.start .. "-" .. seg.finish)
      end
    end

    local day_expr = table.concat(day_parts, ",")

    -- Special case: if time applies equally to all weekdays Mo-Su, we omit the day expression and output only the time string.
    if day_expr == "Mo-Su" then
      table.insert(result_parts, time_str)
    else
      table.insert(result_parts, day_expr .. " " .. time_str)
    end
  end

  -- Sort resulting blocks by the first weekday in the expression
  table.sort(result_parts, function(a, b)
    local da = a:match("^(%a%a)")
    local db = b:match("^(%a%a)")
    local ia = weekday_index(da) or 99
    local ib = weekday_index(db) or 99
    if ia ~= ib then
      return ia < ib
    end
    return a < b
  end)
  return table.concat(result_parts, "; ")
end

---@param ranges {from: number, to: number}[]
---@return {from: number, to: number}[]
function M.merge_ranges(ranges)
  if #ranges <= 1 then
    return ranges
  end

  table.sort(ranges, function(a, b) return a.from < b.from end)

  local merged = {}
  local cur = { from = ranges[1].from, to = ranges[1].to }

  for i = 2, #ranges do
    local r = ranges[i]

    if r.from <= cur.to then
      cur.to = math.max(cur.to, r.to)
    else
      table.insert(merged, cur)
      cur = { from = r.from, to = r.to }
    end
  end

  table.insert(merged, cur)

  return merged
end

---@param base {from: number, to: number}[]
---@param forbidden {from: number, to: number}[]
---@return {from: number, to: number}[]
function M.subtract_ranges(base, forbidden)
  if #base == 0 then
    return {}
  end

  if #forbidden == 0 then
    return base
  end

  forbidden = M.merge_ranges(forbidden)

  local result = {}

  for _, b in ipairs(base) do

    local cur_from = b.from
    local cur_to   = b.to

    for _, f in ipairs(forbidden) do

      if f.to <= cur_from then
        -- forbidden before current range

      elseif f.from >= cur_to then
        break

      else
        if f.from > cur_from then
          table.insert(result, { from = cur_from, to = f.from })
        end

        cur_from = math.max(cur_from, f.to)

        if cur_from >= cur_to then
          break
        end
      end
    end

    if cur_from < cur_to then
      table.insert(result, { from = cur_from, to = cur_to })
    end
  end

  return result
end

---@param condition string OSM-style condition (e.g. "Mo-Fr 08:00-18:00; Sa 09:00-14:00")
---@return table<string, {from: number, to: number}[]>|nil
function M.build_day_map(condition)
  local day_map = {}
  for _, d in ipairs(M.WEEKDAYS) do
    day_map[d] = {}
  end

  for block in condition:gmatch("[^;]+") do
    block = block:match("^%s*(.-)%s*$")

    local day_part, time_part =
      block:match("^([A-Za-z%-,]+)%s+(.+)$")

    if not day_part then
      local days_only = M.expand_day_expr(block)

      if days_only then
        day_part = block
        time_part = nil
      elseif block:match("^%d") then
        day_part = "Mo-Su"
        time_part = block
      else
        return nil
      end
    end

    local days = M.expand_day_expr(day_part)
    if not days then
      if day_part == "Mo-Su" then
        days = M.WEEKDAYS
      else
        return nil
      end
    end

    local ranges

    if not time_part then
      ranges = { { from=0, to=1440 } }
    else
      ranges = M.parse_times(time_part)
      if not ranges then return nil end
    end

    for _,d in ipairs(days) do
      for _,r in ipairs(ranges) do
        table.insert(day_map[d], { from=r.from, to=r.to })
      end
    end
  end

  for _, d in ipairs(M.WEEKDAYS) do
    day_map[d] = M.merge_ranges(day_map[d])
  end

  return day_map
end

return M
