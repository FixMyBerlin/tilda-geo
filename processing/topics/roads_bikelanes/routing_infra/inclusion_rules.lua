-- Per-edge rules of `routing`: motorway and trunk are never routed, and an edge whose bicycle access
-- value is not published (e.g. `psv`, `delivery;destination`) is dropped. Which edges a restricted
-- way has at all is decided once per way in `helper/access_restriction.lua`; see README.md
-- § Exclusions.
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

--- The tags whose bicycle access applies to the edge. A lane derived from the centerline
--- (`source_table=bikelanes`, side left/right) reads only its own tags: `bicycle=use_sidepath` / `no`
--- on the carriageway is about the carriageway, the lane is where cycling is meant to happen.
---@param segment { source_table: string, side: SideKey, tags: OsmTags }
---@param object_tags OsmTags the OSM way this segment was built from
---@return OsmTags
local function access_tags(segment, object_tags)
  local is_lane = segment.source_table == 'bikelanes' and segment.side ~= 'self'
  return is_lane and segment.tags or object_tags
end

--- Published `access_bicycle` for one routing edge. Empty means no access tag, cycling is allowed.
---@param segment { source_table: string, side: SideKey, tags: OsmTags }
---@param object_tags OsmTags the OSM way this segment was built from
---@return string|nil
local function access_bicycle(segment, object_tags)
  return sanitize_access_tags.sanitized_access(access_tags(segment, object_tags), 'bicycle')
end

--- The edge has a bicycle access value that `access_bicycle` cannot publish. Publishing it empty
--- would read as "cycling allowed", so the edge is not on the graph.
---@param segment { source_table: string, side: SideKey, tags: OsmTags }
---@param object_tags OsmTags the OSM way this segment was built from
---@return boolean
local function unpublished_bicycle_access(segment, object_tags)
  local value = sanitize_access_tags.normalize((sanitize_access_tags.resolve(access_tags(segment, object_tags), 'bicycle')))
  return value ~= nil and sanitize_access_tags.sanitize(value, 'bicycle') == nil
end

return {
  prohibited_highway = prohibited_highway,
  access_bicycle = access_bicycle,
  unpublished_bicycle_access = unpublished_bicycle_access,
}
