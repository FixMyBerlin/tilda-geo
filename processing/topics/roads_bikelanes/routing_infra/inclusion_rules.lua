-- Segment exclusions: informal=yes (POC parity), disallowed bicycle access, motorway/trunk
-- prohibition. mixedTrafficFoot / roadsPathClasses join symmetry lives in
-- `excluded_from_roads_tables.lua` (called from build_segments). See README.md
-- (§ Exclusions, § Join symmetry).
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')
local SET = require('topics.helper.sets')

-- Keep-on-graph bicycle access. Not the published `access_bicycle` allowlist in
-- `helper/sanitize_access_tags.lua` (`allowed_values.bicycle`): that one also keeps `no`
-- as a documented value. Here `no` (and anything else not listed) drops the edge.
local allowed_bicycle_access = SET.set({
  'yes', 'permissive', 'designated', 'use_sidepath', 'optional_sidepath', 'discouraged', 'dismount',
})

local cycling_highway_prohibition = SET.set({
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
})

---@param tags OsmTags
---@return boolean exclude
local function exclude_segment(tags)
  local bicycle = sanitize_access_tags.normalize(sanitize_access_tags.resolve(tags, 'bicycle'))
  if bicycle and not allowed_bicycle_access[bicycle] then
    return true
  end
  if tags.informal == 'yes' and not bicycle then
    return true
  end
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

--- Published `access_bicycle` for one routing edge.
--- Lanes derived from the centerline (`source_table=bikelanes`, side left/right) do not inherit the
--- parent road's `bicycle=*`: `bicycle=use_sidepath` / `no` on the carriageway is about the
--- carriageway, and the lane is exactly where cycling is meant to happen.
---@param segment { source_table: string, tags: OsmTags }
---@param side SideKey
---@param object_tags OsmTags the OSM way this segment was built from
---@return string|nil
local function access_bicycle(segment, side, object_tags)
  local is_lane = segment.source_table == 'bikelanes' and side ~= 'self'
  local source = (segment.tags.bicycle or is_lane) and segment.tags or object_tags
  return sanitize_access_tags.sanitized_access(source, 'bicycle')
end

return {
  exclude_segment = exclude_segment,
  access_bicycle = access_bicycle,
}
