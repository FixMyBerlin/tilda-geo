-- Segment exclusions: motorway/trunk prohibition and bicycle access values we do not publish (e.g.
-- `psv`, `emergency`, `delivery;destination`): the segment is dropped. Cycling that is not allowed by
-- a published value stays on the graph as `access_bicycle` and the router filters (README.md
-- § Exclusions). Which carriageway and path edges a restricted way has
-- is decided once per way by `helper/access_restriction.lua` (`context.restriction`, read in
-- `build_segments.lua`); mixedTrafficFoot / roadsPathClasses join symmetry lives there too.
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')
local SET = require('topics.helper.sets')

local cycling_highway_prohibition = SET.set({
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
})

--- Motorway / trunk (own or parent): never routed.
---@param tags OsmTags
---@return boolean
local function prohibited_highway(tags)
  local highway = tags.highway
  if highway and cycling_highway_prohibition[highway] then
    return true
  end
  local parent_road = tags.parent_road
  if parent_road and cycling_highway_prohibition[parent_road] then
    return true
  end
  return false
end

--- Lanes derived from the centerline (`source_table=bikelanes`, side left/right) do not inherit the
--- parent road's `bicycle=*`: `bicycle=use_sidepath` / `no` on the carriageway is about the
--- carriageway, and the lane is exactly where cycling is meant to happen.
---@param segment { source_table: string, tags: OsmTags }
---@param side SideKey
---@param object_tags OsmTags the OSM way this segment was built from
---@return OsmTags
local function access_source(segment, side, object_tags)
  local is_lane = segment.source_table == 'bikelanes' and side ~= 'self'
  return (segment.tags.bicycle or is_lane) and segment.tags or object_tags
end

--- Published `access_bicycle` for one routing edge. Empty means no access tag, cycling is allowed;
--- see `routable_bicycle_access` in `helper/sanitize_access_tags.lua` for the values that allow it.
---@param segment { source_table: string, tags: OsmTags }
---@param side SideKey
---@param object_tags OsmTags the OSM way this segment was built from
---@return string|nil
local function access_bicycle(segment, side, object_tags)
  return sanitize_access_tags.sanitized_access(access_source(segment, side, object_tags), 'bicycle')
end

--- The edge has a bicycle access value that `access_bicycle` cannot publish. Publishing it empty
--- would read as "cycling allowed", so the edge is not on the graph.
---@param segment { source_table: string, tags: OsmTags }
---@param side SideKey
---@param object_tags OsmTags the OSM way this segment was built from
---@return boolean
local function unpublished_bicycle_access(segment, side, object_tags)
  local source = access_source(segment, side, object_tags)
  local value = sanitize_access_tags.normalize((sanitize_access_tags.resolve(source, 'bicycle')))
  return value ~= nil and sanitize_access_tags.sanitize(value, 'bicycle') == nil
end

return {
  prohibited_highway = prohibited_highway,
  access_bicycle = access_bicycle,
  unpublished_bicycle_access = unpublished_bicycle_access,
}
