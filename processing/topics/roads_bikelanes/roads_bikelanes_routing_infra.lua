local build_public_tags = require('topics.roads_bikelanes.routing_infra.build_public_tags')
local build_segments = require('topics.roads_bikelanes.routing_infra.build_segments')
local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')
local resolve_motor_road_context = require('topics.roads_bikelanes.routing_infra.resolve_motor_road_context')
local routing_infra_generalization = require('topics.roads_bikelanes.routing_infra.routing_infra_generalization')
local roads_bikelanes_tables = require('topics.roads_bikelanes.roads_bikelanes_tables')

local routing_infra_table = roads_bikelanes_tables.routing_infra_table

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
      tags = tags,
      meta = context.object_meta,
      geom = segment.geom or context.object_geom,
      minzoom = routing_infra_generalization({ road = tags.road }, context.shared_result_tags.length),
    })

    ::continue::
  end
end

return roads_bikelanes_routing_infra
