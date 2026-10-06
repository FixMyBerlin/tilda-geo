-- Step 1 of `classify_parking_conditions`: clean the tags the classifier reads, and decide what to report.
-- This is the ONLY place that decides what goes to `parking_errors` for parking conditions:
-- * `dropped_tags`   → `SANITIZED_VALUE`: we did not understand (part of) the value and replaced or ignored it.
-- * `rewritten_tags` → `REWRITTEN_VALUE`: the value had a clear mistake that we corrected (please fix in OSM).
-- Both hold the original OSM key and value. A tag that is both rewritten and dropped is only in `dropped_tags`.
--
-- Rule: `condition_category` details only hold data we processed. See `condition_detail_tokens.lua`
-- (comments, durations, access values) and `condition_syntax.lua` (weekdays, times, vocabulary).

local CONDITION_SYNTAX = require('topics.parking.helper.condition_syntax')
local DETAIL_TOKENS = require('topics.parking.helper.condition_detail_tokens')
local is_valid_conditional_value = require('topics.parking.helper.is_valid_conditional_value')
local parse_conditional_value = require('topics.parking.helper.parse_conditional_value')
local vehicle_class_list = require('topics.parking.helper.vehicle_classes')

local M = {}

-- Value for an `access` we do not know: still an access restriction, but without a detail.
M.ACCESS_OTHER = 'other_access'

-- Every `*:conditional` key the classifier reads.
local CONDITIONAL_KEYS = {}
for _, key in ipairs({ 'fee', 'motor_vehicle', 'access', 'maxstay', 'restriction', 'reason', 'restriction:reason', 'maxweight', 'maxweightrating' }) do
  table.insert(CONDITIONAL_KEYS, key .. ':conditional')
end
for _, vehicle_class in ipairs(vehicle_class_list) do
  table.insert(CONDITIONAL_KEYS, vehicle_class .. ':conditional')
  table.insert(CONDITIONAL_KEYS, 'restriction:' .. vehicle_class .. ':conditional')
end

local MAXSTAY_KEEP = { [''] = true, no = true, none = true, yes = true, unlimited = true }
local FREE_ACCESS = { [''] = true, yes = true, destination = true, designated = true, permissive = true }

---@param tags OsmTags<string, string|nil> Parking-scoped OSM tags (unnested `parking:*` side tags or element tags)
---@return {tags?: table<string, string>, invalid?: boolean, dropped_tags?: table<string, string>, rewritten_tags?: table<string, string>}
function M.sanitize(tags)
  ---@type table<string, string>
  local dropped = {}
  ---@type table<string, string>
  local rewritten = {}

  -- `maxstay=1 hour @ (…)` is a common OSM mistake; the classifier reads it like `maxstay:conditional`.
  local maxstay_is_conditional = tags.maxstay ~= nil and string.find(tags.maxstay, '@') ~= nil

  -- 1. Conditional values we can not interpret at all (see `is_valid_conditional_value`) → category `invalid`
  local invalid = false
  local function check_syntax(key)
    local value = tags[key]
    if value and value ~= 'yes' and not is_valid_conditional_value(value) then
      dropped[key] = value
      invalid = true
    end
  end
  for _, key in ipairs(CONDITIONAL_KEYS) do
    check_syntax(key)
  end
  if maxstay_is_conditional then check_syntax('maxstay') end
  if invalid then
    return { invalid = true, dropped_tags = dropped }
  end

  local clean = {}
  for key, value in pairs(tags) do
    clean[key] = value
  end

  -- `2 hours`, `30 min` → one spelling; bare number → assumed unit (rewritten); unknown → `yes` (dropped)
  ---@param value string
  ---@return string cleaned
  ---@return 'dropped'|'rewritten'|nil report
  local function clean_maxstay(value)
    if MAXSTAY_KEEP[value] then return value, nil end
    local duration, assumed_unit = DETAIL_TOKENS.clean_duration(value)
    if not duration then return 'yes', 'dropped' end
    return duration, assumed_unit and 'rewritten' or nil
  end

  -- 2. Conditions: rewrite clear mistakes, map comments to tokens, replace atoms we do not understand
  ---@param key string
  ---@param clean_value (fun(value: string): string, 'dropped'|'rewritten'|nil)|nil
  local function clean_conditional(key, clean_value)
    local value = tags[key]
    local entries = parse_conditional_value(value)
    if not entries then return end

    local parts = {}
    local was_dropped, was_rewritten, changed = false, false, false
    for _, entry in ipairs(entries) do
      local condition = CONDITION_SYNTAX.normalize(entry.condition)
      if condition ~= entry.condition then was_rewritten = true end
      condition = condition:gsub('"([^"]*)"', function(comment)
        local token, known = DETAIL_TOKENS.comment_token(comment)
        if not known then was_dropped = true end
        return token
      end)
      condition = condition:gsub('"', '')
      local cleaned = CONDITION_SYNTAX.clean(condition)
      if cleaned ~= condition then was_dropped = true end

      local entry_value = entry.value
      if clean_value then
        local report
        entry_value, report = clean_value(entry.value)
        if report == 'dropped' then was_dropped = true end
        if report == 'rewritten' then was_rewritten = true end
      end

      if cleaned ~= entry.condition or entry_value ~= entry.value then changed = true end
      table.insert(parts, entry_value .. ' @ (' .. cleaned .. ')')
    end

    if changed then clean[key] = table.concat(parts, '; ') end
    if was_dropped then
      dropped[key] = value
    elseif was_rewritten then
      rewritten[key] = value
    end
  end
  for _, key in ipairs(CONDITIONAL_KEYS) do
    clean_conditional(key, key == 'maxstay:conditional' and clean_maxstay or nil)
  end

  -- 3. `maxstay`
  if maxstay_is_conditional then
    clean_conditional('maxstay', clean_maxstay)
  elseif tags.maxstay then
    local cleaned, report = clean_maxstay(tags.maxstay)
    clean.maxstay = cleaned
    if report == 'dropped' then dropped.maxstay = tags.maxstay end
    if report == 'rewritten' then rewritten.maxstay = tags.maxstay end
  end

  -- 4. `access` (the classifier reads `motor_vehicle` first)
  local access_key = tags.motor_vehicle and 'motor_vehicle' or 'access'
  local access = tags[access_key]
  if access == 'unknown' then
    -- No information: treat as not tagged
    dropped[access_key] = access
    clean.motor_vehicle = nil
    clean.access = nil
  elseif access and not FREE_ACCESS[access] and not DETAIL_TOKENS.is_known_access(access) then
    dropped[access_key] = access
    clean[access_key] = M.ACCESS_OTHER
  end

  return {
    tags = clean,
    dropped_tags = next(dropped) and dropped or nil,
    rewritten_tags = next(rewritten) and rewritten or nil,
  }
end

return M
