local SET = require('topics.helper.sets')

-- Tag-only access resolution for roads_bikelanes / routing (chain resolve + agricultural_or_forestry
-- normalisation).

-- OSM access fallback chains per mode, e.g. motor_vehicle falls back to vehicle then access.
local access_chain = {
  foot = { 'access' },
  vehicle = { 'access' },
  bicycle = { 'vehicle', 'access' },
  motor_vehicle = { 'vehicle', 'access' },
  motorcar = { 'motor_vehicle', 'vehicle', 'access' },
  hgv = { 'motor_vehicle', 'vehicle', 'access' },
  psv = { 'motor_vehicle', 'vehicle', 'access' },
  bus = { 'psv', 'motor_vehicle', 'vehicle', 'access' },
}

--- Raw OSM access value for `mode`, resolved via the fallback chain (the explicit tag wins, else the
--- chain). No sanitisation.
---@param tags OsmTags
---@param mode string
---@return string|nil
local function resolve(tags, mode)
  local value = tags[mode]
  if value then
    return value
  end
  local chain = access_chain[mode]
  if not chain then
    return nil
  end
  for _, key in ipairs(chain) do
    if tags[key] then
      return tags[key]
    end
  end
  return nil
end

-- The four OSM spellings of agricultural/forestry access we collapse into one TILDA value.
local AGRICULTURAL_OR_FORESTRY = SET.set({
  'agricultural', 'forestry', 'agricultural;forestry', 'forestry;agricultural',
})

--- Collapse the agricultural/forestry spellings into the single TILDA value
--- `agricultural_or_forestry`; pass everything else through unchanged.
---@param value string|nil
---@return string|nil
local function normalize(value)
  if value and AGRICULTURAL_OR_FORESTRY[value] then
    return 'agricultural_or_forestry'
  end
  return value
end

-- Allowlisted values we keep per mode (after normalisation). Anything else -> nil.
-- `bicycle` is the published `access_bicycle` set (includes `no`). The routing
-- keep-on-graph list is separate: `routing_infra/inclusion_rules.lua` `allowed_bicycle_access`
-- (same values minus `no`).
local allowed_values = {
  motor_vehicle = SET.set({
    'yes', 'no', 'permissive', 'private', 'customers', 'delivery', 'permit', 'destination',
    'agricultural_or_forestry',
  }),
  bicycle = SET.set({
    'yes', 'no', 'designated', 'permissive', 'use_sidepath', 'optional_sidepath', 'discouraged',
    'dismount',
  }),
}

--- Keep only allowlisted values for `mode`; drop anything else to nil. (QA logging of dropped values
--- via sanitize_cleaner is added with the public access tag.)
---@param value string|nil
---@param mode string
---@return string|nil
local function sanitize(value, mode)
  if value == nil then
    return nil
  end
  local list = allowed_values[mode]
  if list and list[value] then
    return value
  end
  return nil
end

--- resolve -> normalize -> sanitize for `mode`. Published as `access_<mode>` (e.g. `access_bicycle`).
---@param tags OsmTags
---@param mode string
---@return string|nil
local function sanitized_access(tags, mode)
  return sanitize(normalize(resolve(tags, mode)), mode)
end

return {
  resolve = resolve,
  normalize = normalize,
  sanitize = sanitize,
  sanitized_access = sanitized_access,
}
