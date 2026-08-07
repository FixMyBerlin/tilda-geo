local maxspeed = require('topics.roads_bikelanes.maxspeed.maxspeed')
local adjoining_context = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_context')
local HIGHWAYS = require('topics.helper.highway_classes')

--- Option 1 motor-road context for factor_motor_traffic.
---@param segment { segment_kind: string, tags: OsmTags }
---@param context RoadsBikelanesWayContext
---@return MotorRoadContext
local function resolve_motor_road_context(segment, context)
  local tags = segment.tags
  local object_tags = context.object_tags
  local result = {}

  if segment.segment_kind == 'virtual_bikelane' then
    -- Published adjoining follows bikelanes literally (empty on left/right; CSV/:of on self).
    -- Do not copy this way's own `road` class — that is already `tags.road`.
    result.sidepath = 'yes'
    result.adjoining_road = tags.adjoining_road
    result.adjoining_maxspeed = tags.adjoining_maxspeed
    return result
  end

  if HIGHWAYS.path_classes[tags.highway] or HIGHWAYS.sidepath_highway_classes[tags.highway] then
    result.sidepath = adjoining_context.has_sidepath_context(object_tags, tags) and 'yes' or 'no'
    local adjoining = adjoining_context.derive_adjoining_context(object_tags, tags)
    result.adjoining_road = tags.adjoining_road or adjoining.adjoining_road
    if tags.adjoining_maxspeed ~= nil then
      result.adjoining_maxspeed = tags.adjoining_maxspeed
    else
      result.adjoining_maxspeed = adjoining.adjoining_maxspeed
    end
    return result
  end

  local ms = maxspeed(tags)
  result.maxspeed = ms.maxspeed
  return result
end

return resolve_motor_road_context
