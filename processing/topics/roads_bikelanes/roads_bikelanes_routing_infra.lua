local build_segments = require('topics.roads_bikelanes.routing_infra.build_segments')
local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')
local resolve_motor_road_context = require('topics.roads_bikelanes.routing_infra.resolve_motor_road_context')
local routing_infra_generalization = require('topics.roads_bikelanes.routing_infra.routing_infra_generalization')
local roads_bikelanes_tables = require('topics.roads_bikelanes.roads_bikelanes_tables')
local road_width = require('topics.helper.road_width')

local routing_infra_table = roads_bikelanes_tables.routing_infra_table

-- Same sign as `extract_bikelanes`: + left / − right of the centerline (MapLibre inverts it).
local side_sign_map = {
  left = 1,
  right = -1,
}

-- Same attribute as `bikelanes.offset`: geometry stays on the centerline; this is only for
-- visual `line-offset`. Prefer the value already computed on virtual bikelanes; otherwise
-- half `road_width` of the OSM way (`width`/`est_width`, then highway-class fallbacks).
---@param segment { side: SideKey|nil, tags: OsmTags, edge_oneway: string|nil, category: string|nil, road: string|nil }
---@param object_tags OsmTags
---@param side SideKey
local function offset_for_segment(segment, object_tags, side)
  local sign = side_sign_map[side]
  if not sign then
    return nil
  end
  if segment.tags.offset ~= nil then
    return segment.tags.offset
  end
  return sign * road_width(object_tags) / 2
end

---@param segment { segment_kind: string, side: SideKey|nil, tags: OsmTags, edge_oneway: string|nil, category: string|nil, road: string|nil }
---@param motor_context MotorRoadContext
---@param context RoadsBikelanesWayContext
local function build_public_tags(segment, motor_context, context)
  local side = segment.side or segment.tags._side or 'self'
  local road = segment.road or segment.tags.road or context.shared_result_tags.road
  local tags = {
    segment_kind = segment.segment_kind,
    category = segment.category,
    name = context.shared_result_tags.name,
    length = context.shared_result_tags.length,
    prefix = segment.tags.prefix,
    side = side,
    oneway = segment.edge_oneway or segment.tags.oneway,
    parent_id = segment.tags.parent_id,
    road = road,
    parent_road = segment.tags.parent_road,
    access_bicycle = inclusion_rules.access_bicycle(segment, side, context.object_tags),
  }

  local offset = offset_for_segment(segment, context.object_tags, side)
  if offset ~= nil then
    tags.offset = offset
  end
  if segment.tags.surface then
    tags.surface = segment.tags.surface
  end
  if segment.tags.smoothness then
    tags.smoothness = segment.tags.smoothness
  end
  if segment.tags.width then
    tags.width = segment.tags.width
  end
  if motor_context.maxspeed then
    tags.maxspeed = motor_context.maxspeed
  end
  if motor_context.adjoining_road then
    tags.adjoining_road = motor_context.adjoining_road
  end
  if motor_context.adjoining_maxspeed then
    tags.adjoining_maxspeed = motor_context.adjoining_maxspeed
  end

  return tags
end

---@param context RoadsBikelanesWayContext
local function roads_bikelanes_routing_infra(context)
  local segments = build_segments(context)

  for _, segment in ipairs(segments) do
    if inclusion_rules.exclude_segment(segment.tags) then
      goto continue
    end

    local motor_context = resolve_motor_road_context(segment, context)
    local tags = build_public_tags(segment, motor_context, context)

    routing_infra_table:insert({
      id = segment.segment_id,
      parent_id = segment.parent_id,
      source_table = segment.source_table,
      source_id = segment.source_id,
      tags = tags,
      meta = context.object_meta,
      geom = segment.geom or context.object_geom,
      minzoom = routing_infra_generalization({ road = tags.road }, context.shared_result_tags.length),
    })

    ::continue::
  end
end

return roads_bikelanes_routing_infra
