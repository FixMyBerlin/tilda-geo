local maxspeed_direct = require('topics.roads_bikelanes.maxspeed.maxspeed_direct')
local maxspeed_from_zone = require('topics.roads_bikelanes.maxspeed.maxspeed_from_zone')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

-- Try to find maxspeed information in the following order:
-- 1. `maxspeed` tag (also looking at `maxspeed:forward` and `maxspeed:backward`)
-- 2. maxspeed zones tags
-- 3. highway type
-- 4. TODO: intersecting landuse via SQL, see https://github.com/FixMyBerlin/atlas-geo/pull/28
---@param object_tags OsmTags
---@return table
local function maxspeed(object_tags)
  local tags = object_tags
  local result_tags = {}

  local speed, source, confidence = maxspeed_direct(tags)
  if speed == nil then
    speed, source, confidence = maxspeed_from_zone(tags)
  end

  if speed == nil then
    local highway_speeds = {
      ['living_street'] = 7,
    }
    if highway_speeds[tags.highway] then
      speed = highway_speeds[tags.highway]
      source = 'inferred_from_highway'
      confidence = 'high'
    end
  end

  result_tags['osm_maxspeed:backward'] = SANITIZE_TAGS.safe_string(tags['maxspeed:backward'])
  result_tags['osm_maxspeed:forward'] = SANITIZE_TAGS.safe_string(tags['maxspeed:forward'])
  result_tags['osm_maxspeed:conditional'] = SANITIZE_TAGS.safe_string(tags['maxspeed:conditional'])
  result_tags.maxspeed = speed
  if speed ~= nil then
    result_tags.maxspeed_source = source
    result_tags.maxspeed_confidence = confidence
  end

  return result_tags
end

return maxspeed
