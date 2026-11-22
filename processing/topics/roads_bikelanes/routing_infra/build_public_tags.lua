local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')
local CLEANER = require('topics.helper.sanitize_cleaner')

-- `segment.tags` of carriageway and path edges is the raw OSM way: the inclusion rules and the
-- motor-road context need it, the published row must not read it. Those edges publish
-- `shared_result_tags`, the same sanitized values as `roads` / `roadsPathClasses`. Bikelane edges
-- publish their row from `extract_bikelanes`, which holds the values of the lane. Values the
-- sanitizers did not allow (`DISALLOWED_VALUE`) are left out; `roads` logs them.
---@param segment { source_table: string, side: SideKey, tags: OsmTags, edge_oneway: string, oneway_motor: string|nil, category: string|nil, road: string|nil, parent_id: string, source_id: string }
---@param motor_context MotorRoadContext
---@param context RoadsBikelanesWayContext
local function build_public_tags(segment, motor_context, context)
  local shared_result_tags = context.shared_result_tags
  local sanitized_tags = segment.source_table == 'bikelanes' and segment.tags or shared_result_tags

  return CLEANER.remove_disallowed_values({
    category = segment.category,
    name = shared_result_tags.name,
    length = shared_result_tags.length,
    prefix = sanitized_tags.prefix,
    side = segment.side,
    oneway = segment.edge_oneway,
    oneway_motor = segment.oneway_motor,
    parent_id = segment.parent_id,
    source_table = segment.source_table,
    source_id = segment.source_id,
    road = segment.road or shared_result_tags.road,
    parent_road = sanitized_tags.parent_road,
    access_bicycle = inclusion_rules.access_bicycle(segment, context.object_tags),
    offset = sanitized_tags.offset,
    surface = sanitized_tags.surface,
    smoothness = sanitized_tags.smoothness,
    width = sanitized_tags.width,
    informal = shared_result_tags.informal,
    maxspeed = motor_context.maxspeed,
    adjoining_road = motor_context.adjoining_road,
    adjoining_maxspeed = motor_context.adjoining_maxspeed,
  })
end

return build_public_tags
