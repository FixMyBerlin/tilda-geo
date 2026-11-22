-- Mutate the input to map access values that TILDA reads as another value, on every key of the
-- access fallback chains (`sanitize_access_tags.lua`). Runs before `access_restriction`, so roads
-- and routing see the same values.
-- - `unknown`: an explicit "nobody checked", read like no tag
--   https://wiki.openstreetmap.org/wiki/Key:access
-- - `military`: only military traffic, read as `no`
-- - `residents`: only residents, read as `private`
--   https://wiki.openstreetmap.org/wiki/Tag:access%3Dresidents

local access_keys = require('topics.roads_bikelanes.helper.sanitize_access_tags').access_keys

local mapped_values = {
  military = 'no',
  residents = 'private',
}

---@param dest_tags OsmTags The input table of OSM tags to mutate in-place
local function transform_access_values(dest_tags)
  for _, key in ipairs(access_keys) do
    local value = dest_tags[key]
    if value == 'unknown' then
      dest_tags[key] = nil
    elseif value and mapped_values[value] then
      dest_tags[key] = mapped_values[value]
    end
  end
end

return transform_access_values
