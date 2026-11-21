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
--- chain). No sanitisation. The second return value is the key the value was read from.
---@param tags OsmTags
---@param mode string
---@return string|nil value
---@return string|nil key
local function resolve(tags, mode)
  local value = tags[mode]
  if value then
    return value, mode
  end
  local chain = access_chain[mode]
  if not chain then
    return nil
  end
  for _, key in ipairs(chain) do
    if tags[key] then
      return tags[key], key
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

-- Bicycle access values under which cycling is allowed. This is the filter a router applies on the
-- published `access_bicycle`: an edge whose `access_bicycle` is empty (no access tag) or in this set
-- is routable, every value of `not_routable_bicycle_access` is on the graph but cycling is not
-- allowed. An edge with any other value is not on the graph (`routing_infra/inclusion_rules.lua`). `access_restriction.lua` uses the set for the explicit
-- permission that lifts `access=destination` / `customers`.
local routable_bicycle_access = SET.set({
  'yes', 'designated', 'permissive', 'use_sidepath', 'optional_sidepath', 'discouraged', 'dismount',
})

--- Cycling is explicitly allowed: the resolved `bicycle` value (`bicycle` -> `vehicle` -> `access`) is
--- one of `routable_bicycle_access`.
---@param tags OsmTags
---@return boolean
local function bicycle_explicitly_allowed(tags)
  local value = normalize((resolve(tags, 'bicycle')))
  return value ~= nil and routable_bicycle_access[value] == true
end

--- The resolved `bicycle` value is `designated`: a signposted cycle route.
---@param tags OsmTags
---@return boolean
local function bicycle_designated(tags)
  return normalize((resolve(tags, 'bicycle'))) == 'designated'
end

-- Published `access_bicycle` values under which cycling is not allowed.
local not_routable_bicycle_access = SET.set({
  'no', 'destination', 'private', 'customers', 'delivery', 'permit', 'agricultural_or_forestry',
})

-- Allowlisted values we keep per mode (after normalisation). Anything else -> nil.
-- `bicycle` is the published `access_bicycle` set: the routable values plus the ones that do not
-- allow cycling.
local allowed_values = {
  motor_vehicle = SET.set({
    'yes', 'no', 'permissive', 'private', 'customers', 'delivery', 'permit', 'destination',
    'agricultural_or_forestry',
  }),
  bicycle = SET.join_sets({
    routable_bicycle_access,
    not_routable_bicycle_access,
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
  return sanitize(normalize((resolve(tags, mode))), mode)
end

return {
  resolve = resolve,
  normalize = normalize,
  sanitize = sanitize,
  sanitized_access = sanitized_access,
  routable_bicycle_access = routable_bicycle_access,
  bicycle_explicitly_allowed = bicycle_explicitly_allowed,
  bicycle_designated = bicycle_designated,
  not_routable_bicycle_access = not_routable_bicycle_access,
}
