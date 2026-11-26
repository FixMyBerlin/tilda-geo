-- Per-edge rules of `routing`. Which ways are public at all is decided once per way in
-- `helper/access_restriction.lua`, for all tables alike; see README.md § Exclusions. The rules
-- here only drop routing edges, the rows in `roads`, `roadsPathClasses` and `bikelanes` stay.
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')
local highway_classes = require('topics.helper.highway_classes')

--- The edge is on a road where the law prohibits cycling: Autobahn and Schnellstraße
--- (`motorway`, `trunk` and their links, also lanes tagged on them via `parent_road`) and the
--- carriageway of a Kraftfahrstraße (`motorroad=yes`, DE: Zeichen 331.1), whatever `bicycle` says.
--- These roads stay in `roads` like every other road; only a bike router must never use them.
--- A lane tagged on a motorroad (`cycleway:*=track|lane`) has its own tags without `motorroad`
--- and stays. https://wiki.openstreetmap.org/wiki/DE:Tag:motorroad%3Dyes
---@param tags OsmTags
---@return boolean
local function cycling_prohibited_road(tags)
  local motor_road_classes = highway_classes.trunk_motorway_classes
  if motor_road_classes[tags.highway] or motor_road_classes[tags.parent_road] then
    return true
  end
  return tags.motorroad == 'yes'
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
  local value = sanitize_access_tags.resolve(access_tags(segment, object_tags), 'bicycle') -- the value only, not the key
  value = sanitize_access_tags.normalize(value)
  return value ~= nil and sanitize_access_tags.sanitize(value, 'bicycle') == nil
end

return {
  cycling_prohibited_road = cycling_prohibited_road,
  access_bicycle = access_bicycle,
  unpublished_bicycle_access = unpublished_bicycle_access,
}
