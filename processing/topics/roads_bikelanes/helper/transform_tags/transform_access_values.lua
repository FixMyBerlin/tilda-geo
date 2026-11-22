-- Mutate the input to map access values that TILDA reads as another value, on every key of the
-- access fallback chains (`sanitize_access_tags.lua`). Runs before `access_restriction`, so roads
-- and routing see the same values.
-- - `unknown`: an explicit "nobody checked", read like no tag
--   https://wiki.openstreetmap.org/wiki/Key:access
-- - `optional_sidepath`: read like no tag. The carriageway is mixed traffic, `cycleway=separate`
--   shows the path next to it. The value has no consensus in the German community:
--   https://community.openstreetmap.org/t/brauchen-wir-bicycle-optional-sidepath/98659
-- - `official`: old spelling of `designated`
-- - `military`, `emergency`, `psv`, `bus`: only for others, read as `no`
-- - `residents`, `employees`, `restricted`: only with permission, read as `private`
--   https://wiki.openstreetmap.org/wiki/Tag:access%3Dresidents
-- - Lists (`agricultural;destination`): the most open value of the list, after the mapping above

local access_keys = require('topics.roads_bikelanes.helper.sanitize_access_tags').access_keys

local mapped_values = {
  official = 'designated',
  military = 'no',
  emergency = 'no',
  psv = 'no',
  bus = 'no',
  residents = 'private',
  employees = 'private',
  restricted = 'private',
}

local no_tag_values = { unknown = true, optional_sidepath = true }

-- Openness of the values a list can resolve to, most open first. Other values do not take part.
local openness_order = {
  'yes', 'designated', 'permissive', 'discouraged', 'dismount', 'use_sidepath',
  'destination', 'customers', 'delivery', 'permit', 'agricultural', 'forestry', 'private', 'no',
}
local openness = {}
for rank, value in ipairs(openness_order) do openness[value] = rank end

---@param value string
---@return string|nil
local function map_value(value)
  if no_tag_values[value] then return nil end
  return mapped_values[value] or value
end

--- `agricultural;destination` -> `destination`. Only agricultural and forestry stays
--- `agricultural;forestry`, which `sanitize_access_tags.normalize` collapses. A list without a known
--- value stays as it is.
---@param value string
---@return string
local function most_open_value(value)
  local best, best_rank, agricultural_or_forestry_only = nil, nil, true
  local seen = {}
  for part in value:gmatch('[^;]+') do
    part = map_value((part:gsub('^%s+', ''):gsub('%s+$', '')))
    local rank = part and openness[part]
    if rank then
      seen[part] = true
      if part ~= 'agricultural' and part ~= 'forestry' then agricultural_or_forestry_only = false end
      if not best_rank or rank < best_rank then best, best_rank = part, rank end
    end
  end
  if not best then return value end
  if agricultural_or_forestry_only and seen.agricultural and seen.forestry then return 'agricultural;forestry' end
  return best
end

---@param dest_tags OsmTags The input table of OSM tags to mutate in-place
local function transform_access_values(dest_tags)
  for _, key in ipairs(access_keys) do
    local value = dest_tags[key]
    if value then
      if value:find(';', 1, true) then
        dest_tags[key] = most_open_value(value)
      else
        dest_tags[key] = map_value(value)
      end
    end
  end
end

return transform_access_values
