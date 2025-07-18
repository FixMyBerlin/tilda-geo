require('init')
require("TimeUtils")
require("MaxspeedDirect")
require("MaxspeedFromZone")
require("CopyTags")
require("Set")

local tags_copied = {}
local tags_prefixed = {
  "maxspeed:backward",
  "maxspeed:forward",
  "maxspeed:conditional",
}

-- Try to find maxspeed information in the following order:
-- 1. `maxspeed` tag (also looking at `maxspeed:forward` and `maxspeed:backward`)
-- 2. maxspeed zones tags
-- 3. highway type
-- 4. TODO: intersecting landuse via SQL, see https://github.com/FixMyBerlin/atlas-geo/pull/28
function Maxspeed(object)
  local tags = object.tags
  local result_tags = {}

  local maxspeed, source, confidence = MaxspeedDirect(tags)

  if maxspeed == nil then
    maxspeed, source, confidence = MaxspeedFromZone(tags)
  end

  if maxspeed == nil then
    local highway_speeds = {
      ["living_street"] = 7
    }
    if highway_speeds[tags.highway] then
      maxspeed = highway_speeds[tags.highway]
      source = "inferred_from_highway"
      confidence = 'high' -- living_street is 'high', others would be 'medium
    end
  end

  CopyTags(result_tags, tags, tags_copied)
  CopyTags(result_tags, tags, tags_prefixed, "osm_")
  result_tags.maxspeed = maxspeed
  result_tags.maxspeed_source = source
  result_tags.maxspeed_confidence = confidence

  return result_tags
end
