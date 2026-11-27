-- Read weekdays and time ranges from the condition part of an OSM conditional value
-- (the part after `@`, see `parse_conditional_value.lua`), e.g. `Mo-Fr 06:00-18:00` or `22:00-06:00`.
--
-- Spelling variants are normalized first (`condition_syntax.lua`): `mo-fr` → `Mo-Fr`, `6:00` → `06:00`,
-- spaces around a `-` between two weekdays or two times are dropped (`Mo - Fr 06:00 - 18:00`), and a day list
-- glued to its time is split
-- (`Mo-Fr:07:00-16:00`, `Mo-Fr07:00-16:00`, `Mo-Fr: 07:00-16:00`). Brackets and `AND` are ignored.
--
-- Rules are separated by `;`; days and times may also be comma lists (`Mo,We 08:00-12:00,14:00-18:00`).
-- Days followed by `off` (`PH off`, `Sa,Su off`, `Sa 10:00-12:00 off`) go to `off_days` and get no rule. Days without a time range (`Su`) and
-- `24/7` cover the whole day (00:00-24:00), unless another atom qualifies them (`Mo-Fr wet`).
-- Every other atom (`wet`, `snow`, `hgv`, `weight>7.5`, months, years, `sunset-sunrise`, broken times like
-- `06:00-17:030`) is returned in `other`, so callers can tell time-only conditions from mixed ones.

local CONDITION_SYNTAX = require('topics.helper.condition_syntax')

local WEEKDAYS = { 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su' }
local WEEKDAY_INDEX = {}
for i, day in ipairs(WEEKDAYS) do
  WEEKDAY_INDEX[day] = i
end

---@class ConditionTimeRule
---@field days string[]|nil Weekdays (`Mo`…`Su`, `PH`, `SH`), one table per rule; nil means every day
---@field from integer Minutes since midnight
---@field to integer Minutes since midnight; smaller than `from` when the range crosses midnight
---@field crosses_midnight boolean

---@class ConditionTimes
---@field rules ConditionTimeRule[] Time ranges, empty when the condition has none
---@field off_days string[] Days marked `off` (`PH off`)
---@field other string[] Atoms that are neither days, times nor `off`; empty for a time-only condition

---@param piece string
---@return string[]|nil
local function expand_day_piece(piece)
  if piece == 'PH' or piece == 'SH' then return { piece } end
  local a, b = piece:match('^(%a%a)%-(%a%a)$')
  if not a then
    return WEEKDAY_INDEX[piece] and { piece } or nil
  end
  local ia, ib = WEEKDAY_INDEX[a], WEEKDAY_INDEX[b]
  if not ia or not ib then return nil end
  local days = {}
  local i = ia
  while true do -- `Fr-Mo` wraps over the weekend
    table.insert(days, WEEKDAYS[i])
    if i == ib then break end
    i = i % 7 + 1
  end
  return days
end

---@param hhmm string
---@return integer|nil
local function to_minutes(hhmm)
  local h, m = hhmm:match('^(%d%d):(%d%d)$')
  if not h then return nil end
  h, m = tonumber(h), tonumber(m)
  if h > 24 or m > 59 or (h == 24 and m > 0) then return nil end
  return h * 60 + m
end

---@param piece string A time range, e.g. `06:00-18:00`
---@return integer|nil from
---@return integer|nil to
local function parse_range(piece)
  local a, b = piece:match('^(%d%d:%d%d)%-(%d%d:%d%d)$')
  if not a then return nil, nil end
  local from = to_minutes(a)
  -- opening_hours writes the next morning as hours past 24: `23:00-33:00` ends at 09:00
  local h, m = b:match('^(%d%d):(%d%d)$')
  local to = tonumber(h) > 24 and tonumber(h) <= 48 and to_minutes(('%02d:%s'):format(tonumber(h) - 24, m))
    or to_minutes(b)
  if to == 0 then to = 1440 end -- `20:00-00:00` and `00:00-00:00` end at midnight
  if not from or not to or from == to then return nil, nil end
  return from, to
end

-- Split a day list glued to a time (`Mo-Fr:07:00-16:00`, `Mo-Fr07:00-16:00`) and drop a trailing `:` (`Mo-Fr:`).
---@param text string
---@return string
local function separate_days_and_times(text)
  return (
    (text .. ' '):gsub('%f[%w]([%a%-,]+):?(%d)', function(days, digit)
      local all_days = true
      for piece in days:gmatch('[^,]+') do
        if not expand_day_piece(CONDITION_SYNTAX.normalize(piece)) then all_days = false end
      end
      if all_days then return days .. ' ' .. digit end
    end):gsub('%f[%w]([%a%-,]+):%f[%s]', function(days)
      local all_days = true
      for piece in days:gmatch('[^,]+') do
        if not expand_day_piece(CONDITION_SYNTAX.normalize(piece)) then all_days = false end
      end
      if all_days then return days end
    end)
  )
end

---@param condition string|nil
---@return ConditionTimes|nil times nil for empty input
local function parse_condition_times(condition)
  if type(condition) ~= 'string' or condition:match('^%s*$') then return nil end

  local text = condition:gsub('[()]', ' ')
  -- Only between two weekdays or two times: `08:00-12:00 - Sa 10:00-12:00` keeps its rules apart.
  text = text:gsub('%f[%a](%a%a)%s*%-%s*(%a%a)%f[%A]', '%1-%2')
  text = text:gsub('(%d:%d%d)%s*%-%s*(%d%d?:%d%d)', '%1-%2')
  text = separate_days_and_times(text)
  text = CONDITION_SYNTAX.normalize(text)

  ---@type ConditionTimes
  local result = { rules = {}, off_days = {}, other = {} }

  for rule_text in text:gmatch('[^;]+') do
    local days = nil
    local days_handled = true
    local previous_was_time = false
    local first_rule_of_days = 1

    ---@param from integer
    ---@param to integer
    local function add_rule(from, to)
      local rule_days = nil
      if days then
        rule_days = {}
        for _, day in ipairs(days) do
          table.insert(rule_days, day)
        end
      end
      table.insert(result.rules, { days = rule_days, from = from, to = to, crosses_midnight = to < from })
      days_handled = true
    end

    for piece in rule_text:gmatch('[^,%s]+') do
      local piece_days = expand_day_piece(piece)
      local from, to = parse_range(piece)
      if piece_days then
        if previous_was_time or days_handled then
          days = {}
          days_handled = false
          first_rule_of_days = #result.rules + 1
        end
        for _, day in ipairs(piece_days) do
          table.insert(days, day)
        end
        previous_was_time = false
      elseif from then
        add_rule(from, to)
        previous_was_time = true
      elseif piece == '24/7' then
        add_rule(0, 1440)
        previous_was_time = true
      elseif piece == 'off' and days and (previous_was_time or not days_handled) then
        for i = #result.rules, first_rule_of_days, -1 do
          table.remove(result.rules, i)
        end
        for _, day in ipairs(days) do
          table.insert(result.off_days, day)
        end
        days_handled = true
        previous_was_time = false
      elseif piece ~= 'AND' then
        table.insert(result.other, piece)
        days_handled = true
      end
    end
    if days and not days_handled then add_rule(0, 1440) end
  end

  return result
end

return parse_condition_times
