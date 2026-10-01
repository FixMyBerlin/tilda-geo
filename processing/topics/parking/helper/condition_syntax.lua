-- Syntax check for the condition part of OSM conditional values (opening_hours style), e.g.
-- `Mo-Fr 08:00-18:00`, `Mo-Sa 00:00-09:00, Su, residents`, `stay > 1 hour`, `maxweightrating > 7.5`.
--
-- We do not validate how the pieces combine. We only check that every atom (split at space, `,`, `;`)
-- is a form we know: weekday, time range, month, number, operator, or a word from `VOCABULARY`.
-- Complex but valid conditions pass; broken ones (`12:00.18:00`, `Mo-S`, `07:00-??:??`) have an unknown atom.
-- Unknown atoms are replaced by `other_condition` in `condition_category` and the tag is logged to `parking_errors`.

local M = {}

M.UNKNOWN = 'other_condition'

-- Canonical weekday per lowercase spelling, incl. German abbreviations mappers use by mistake.
local WEEKDAYS = {
  mo = 'Mo', tu = 'Tu', we = 'We', th = 'Th', fr = 'Fr', sa = 'Sa', su = 'Su',
  di = 'Tu', mi = 'We', ['do'] = 'Th', so = 'Su',
  ph = 'PH', sh = 'SH',
}

local MONTHS = {}
for _, month in ipairs({ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' }) do
  MONTHS[month] = true
end

local OPERATORS = { ['<'] = true, ['>'] = true, ['<='] = true, ['>='] = true, ['='] = true, ['@'] = true, ['24/7'] = true, ['AND'] = true, ['-'] = true }

-- KEEP IN SYNC: words shown in details need a German label in
-- `app/.../TagsTable/parking/parkingConditionDetailTokenTranslations.const.ts`.
local VOCABULARY = {}
for _, word in ipairs({
  -- structure
  'except', 'only', 'none', 'off', 'stay', 'yes', 'no', 'unlimited', 'load-unload', 'comment',
  -- units
  'minute', 'minutes', 'hour', 'hours', 'day', 'days', 'week', 'weeks', 'night', 'nights', 't',
  -- opening_hours keywords and conditions
  'sunrise', 'sunset', 'dawn', 'dusk', 'easter', 'summer', 'winter', 'spring', 'autumn', 'wet', 'snow',
  'weight', 'maxweight', 'maxweightrating', 'height', 'width', 'length', 'axleload', 'wheels',
  -- access values
  'private', 'customers', 'permit', 'delivery', 'employees', 'residents', 'destination', 'designated',
  'permissive', 'discouraged',
  -- vehicles / user groups
  'motorcar', 'passenger_car', 'disabled', 'car_sharing', 'motorcycle', 'goods', 'hgv', 'bus', 'tourist_bus',
  'coach', 'psv', 'taxi', 'motorhome', 'emergency', 'agricultural', 'forestry', 'military', 'hazmat',
  'trailer', 'caravan', 'bicycle', 'moped', 'mofa', 'motor_vehicle', 'vehicle',
  -- our own tokens (`condition_detail_tokens.lua`)
  'large_events', 'doctors', 'illegible', 'mobile_library', 'other_comment', 'other_condition',
}) do
  VOCABULARY[word] = true
end

---@param atom string
---@return string|nil canonical Weekday atom in canonical spelling (`Mo-Fr`, `PH`, `Th[1]`) or nil
local function weekday_atom(atom)
  local body, nth = atom:match('^(.-)(%[[%d,%-]+%])$')
  body = body or atom
  local parts = {}
  for piece in (body .. '-'):gmatch('(.-)%-') do
    local canonical = #piece == 2 and WEEKDAYS[piece:lower()]
    if not canonical then return nil end
    table.insert(parts, canonical)
  end
  if #parts == 0 then return nil end
  return table.concat(parts, '-') .. (nth or '')
end

---@param hhmm string
---@return boolean
local function is_time(hhmm)
  local h, m = hhmm:match('^(%d%d):(%d%d)$')
  return h ~= nil and tonumber(h) <= 48 and tonumber(m) <= 59
end

---@param atom string
---@return boolean
local function is_time_atom(atom)
  local body = atom:gsub('%+$', '')
  local from, to = body:match('^(.-)%-(.+)$')
  if from then return is_time(from) and is_time(to) end
  return is_time(body)
end

---@param atom string
---@return boolean
local function is_month_atom(atom)
  local body = atom:gsub(':$', '')
  for piece in (body .. '-'):gmatch('(.-)%-') do
    if not MONTHS[piece] then return false end
  end
  return true
end

---@param atom string
---@return boolean
local function is_known_atom(atom)
  return weekday_atom(atom) == atom
    or is_time_atom(atom)
    or is_month_atom(atom)
    or atom:match('^%d+[%.,]?%d*:?$') ~= nil -- number, also day of month `31:`
    or atom:match('^%d+%-%d+$') ~= nil
    or MONTHS[atom:match('^%d+%-(%a%a%a)$') or ''] == true -- `13-Sep` in `May 13-Sep 30`
    or OPERATORS[atom] == true
    or VOCABULARY[atom] == true
end

-- `0900` → `09:00`, `18` / `9` → `18:00` / `09:00`; everything else unchanged.
---@param piece string
---@return string
local function to_hhmm(piece)
  local h, m = piece:match('^(%d%d)(%d%d)$')
  if h then return h .. ':' .. m end
  h = piece:match('^(%d%d?)$')
  if h then return ('%02d:00'):format(tonumber(h)) end
  return piece
end

-- Apply `fn` to every atom outside of `"…"` comments; separators stay untouched.
---@param text string
---@param fn fun(atom: string): string
---@return string
local function map_atoms(text, fn)
  local out = {}
  local in_quotes = false
  for chunk, quote in (text .. '"'):gmatch('([^"]*)(")') do
    table.insert(out, in_quotes and chunk or (chunk:gsub('[^,;%s]+', fn)))
    table.insert(out, quote)
    in_quotes = not in_quotes
  end
  table.remove(out) -- the quote we appended
  return table.concat(out)
end

-- Rewrite unambiguous mapper mistakes so the DB holds one spelling:
-- typographic dashes, `weightrating` typo, weekday case and German weekdays (`Mo-FR`, `Di` → `Tu`),
-- hours without leading zero (`9:00` → `09:00`), and time ranges with a missing `:00`, `:` or `-`
-- (`06:00-18`, `07:00-0900`, `12:00.18:00`).
---@param condition string
---@return string
function M.normalize(condition)
  local out = condition:gsub('\226\128[\147\148]', '-')
  out = out:gsub('%f[%w_]weightrating%f[^%w_]', 'maxweightrating')
  out = out:gsub('(maxweightrating)%s*([<>]=?)%s*', '%1 %2 ')
  return map_atoms(out, function(atom)
    local time = atom:gsub('%f[%d](%d):(%d%d)', '0%1:%2')
    -- Only inside a time range (one side is already `HH:MM`): `12:00.18:00`, `07:00-0900`, `06:00-18`, `09-14:00`
    time = time:gsub('^(%d%d:%d%d)%.(%d%d:%d%d)$', '%1-%2')
    local from, to = time:match('^([%d:]+)%-([%d:]+)$')
    if from and (from:find(':', 1, true) or to:find(':', 1, true)) then
      time = to_hhmm(from) .. '-' .. to_hhmm(to)
    end
    return weekday_atom(time) or time
  end)
end

-- True when every atom is a known form (comments in quotes are not checked here).
---@param condition string
---@return boolean
function M.is_known(condition)
  local known = true
  map_atoms(condition, function(atom)
    if not is_known_atom(atom) then known = false end
    return atom
  end)
  return known
end

-- Replace unknown atoms by `other_condition`.
---@param detail string
---@return string
function M.clean(detail)
  return map_atoms(detail, function(atom)
    return is_known_atom(atom) and atom or M.UNKNOWN
  end)
end

return M
