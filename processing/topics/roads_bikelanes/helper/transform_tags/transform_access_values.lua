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

local contains_substring = require('topics.helper.contains_substring')
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')
local access_keys = sanitize_access_tags.access_keys

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

-- Rank of the values a list can resolve to, most open first (1). Other values do not take part.
local openness_rank = {
  yes = 1,
  designated = 2,
  permissive = 3,
  discouraged = 4,
  dismount = 5,
  use_sidepath = 6,
  destination = 7,
  customers = 8,
  delivery = 9,
  permit = 10,
  agricultural_or_forestry = 11,
  private = 12,
  no = 13,
}

---@param value string
---@return string|nil
local function map_value(value)
  if no_tag_values[value] then return nil end
  return mapped_values[value] or value
end

--- `agricultural;destination` -> `destination`, `agricultural;forestry` -> `agricultural_or_forestry`.
--- A list without a known value stays as it is.
---@param value string
---@return string
local function most_open_value(value)
  local best, best_rank = value, nil
  for _, raw_part in ipairs(osm2pgsql.split_string(value, ';')) do -- split and trim
    local part = sanitize_access_tags.normalize(map_value(raw_part))
    local rank = part and openness_rank[part]
    if rank and (not best_rank or rank < best_rank) then
      best, best_rank = part, rank
    end
  end
  return best
end

---@param dest_tags OsmTags The input table of OSM tags to mutate in-place
local function transform_access_values(dest_tags)
  for _, key in ipairs(access_keys) do
    local value = dest_tags[key]
    if value then
      if contains_substring(value, ';') then
        dest_tags[key] = most_open_value(value)
      else
        dest_tags[key] = map_value(value)
      end
    end
  end
end

return transform_access_values
