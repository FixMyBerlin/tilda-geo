-- `condition_category` details must only hold data we processed: free text from OSM is mapped to
-- a fixed token here, everything unknown becomes a fallback token and is logged to `parking_errors`
-- (so this table can grow from real data).
--
-- KEEP IN SYNC: every token needs a German label in
-- `app/.../TagsTable/parking/parkingConditionDetailTokenTranslations.const.ts`
-- (and an entry in `PARKING_CONDITION_DETAIL_TOKEN_IDS_LONGEST_FIRST`).

local M = {}

-- opening_hours comments (`"…"` inside a condition). Keys are lowercase.
local COMMENT_TOKENS = {
  ['large events'] = 'large_events',
  ['doctors'] = 'doctors',
  ['unleserlich'] = 'illegible',
  ['autobüchereibus'] = 'mobile_library',
}
M.COMMENT_FALLBACK = 'other_comment'

---@param comment string Text between the quotes
---@return string token
---@return boolean known
function M.comment_token(comment)
  local token = COMMENT_TOKENS[comment:lower():match('^%s*(.-)%s*$')]
  return token or M.COMMENT_FALLBACK, token ~= nil
end

-- `access` / `motor_vehicle` values we show as detail of `access_restriction`.
local ACCESS_DETAILS = {
  no = true,
  private = true,
  customers = true,
  permit = true,
  delivery = true,
  employees = true,
  residents = true,
  agricultural = true,
  forestry = true,
  emergency = true,
  military = true,
  disabled = true,
  discouraged = true,
}

---@param access string
---@return boolean
function M.is_known_access(access)
  return ACCESS_DETAILS[access] == true
end

local DURATION_UNITS = {
  min = 'minute', mins = 'minute', minute = 'minute', minutes = 'minute',
  h = 'hour', hr = 'hour', hrs = 'hour', hour = 'hour', hours = 'hour',
  day = 'day', days = 'day',
  week = 'week', weeks = 'week',
  night = 'night', nights = 'night',
}

-- `2 hours`, `30 min`, `1.5 h`, `load-unload` → one spelling; anything else → nil.
-- A bare number has no unit in OSM: we assume hours below 10 and minutes from 10 on
-- (`2` → `2 hours`, `120` → `120 minutes`) and tell the caller, so it can still be logged.
---@param value string
---@return string|nil duration
---@return boolean assumed_unit
function M.clean_duration(value)
  if value == 'load-unload' then return value, false end
  local bare = tonumber(value:match('^%s*(%d+)%s*$'))
  if bare then
    if bare == 0 then return nil, false end
    local unit = bare < 10 and 'hour' or 'minute'
    return bare .. ' ' .. unit .. (bare == 1 and '' or 's'), true
  end
  local num, unit = value:match('^%s*(%d+[%.,]?%d*)%s*(%a+)%s*$')
  unit = unit and DURATION_UNITS[unit:lower()]
  if not num or not unit then return nil, false end
  return num .. ' ' .. unit .. (num == '1' and '' or 's'), false
end

return M
