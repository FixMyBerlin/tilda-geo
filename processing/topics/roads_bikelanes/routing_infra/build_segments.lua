-- Enumerates directed travel edges per `source_table` (`roads`, `bikelanes`, `roadsPathClasses`).
-- Edge ids, oneway cases, mixedTraffic*: README.md (§ Directed edges).
local merge_table = require('topics.helper.merge_table')
local default_id = require('topics.helper.default_id')
local road_classification_road_value = require('topics.roads_bikelanes.roads.road_classification_road_value')
local derive_oneway = require('topics.roads_bikelanes.bikelanes.derive_oneway')
local reverse_linestring = require('topics.roads_bikelanes.routing_infra.reverse_linestring')
local SET = require('topics.helper.sets')
local HIGHWAYS = require('topics.helper.highway_classes')
local excluded_from_roads_tables = require('topics.roads_bikelanes.helper.excluded_from_roads_tables')

local road_highway_classes = SET.join_sets({
  HIGHWAYS.trunk_motorway_classes,
  HIGHWAYS.major_road_classes,
  HIGHWAYS.minor_road_classes,
})

-- Self infra that is a lane inside the carriageway (Mittellage). It uses the centerline id
-- like Fahrradstraße, but the road stays drivable, so the carriageway edges are kept.
-- `needsClarification` only matches motor roads via the unclear Mittellage condition.
local lane_within_carriageway_categories = SET.set({
  'cyclewayOnHighwayBetweenLanes',
  'needsClarification',
})

---@param segments table[]
---@param opts { segment_id: string, side: SideKey, geom: table, category: string, road: string, parent_id: string, edge_oneway: string, tags: OsmTags }
local function insert_carriageway_edge(segments, opts)
  table.insert(segments, {
    segment_id = opts.segment_id,
    side = opts.side,
    parent_id = opts.parent_id,
    source_table = 'roads',
    source_id = opts.parent_id,
    geom = opts.geom,
    category = opts.category,
    road = opts.road,
    edge_oneway = opts.edge_oneway,
    tags = merge_table({
      road = opts.road,
      parent_id = opts.parent_id,
      _side = opts.side,
    }, opts.tags),
  })
end

---@param segments table[]
---@param object_tags OsmTags
---@param object_geom table
---@param object_default_id string
---@param road_value string
local function emit_carriageway_edges(segments, object_tags, object_geom, object_default_id, road_value)
  local factor_oneway = derive_oneway(object_tags, { implicitOneWay = false })
  local raw_oneway = object_tags.oneway
  local is_car_not_bike = factor_oneway == 'car_not_bike'
  local base_tags = merge_table({ road = road_value }, object_tags)
  base_tags.oneway = factor_oneway

  local function edge_geom(forward)
    if forward then
      return object_geom
    end
    return reverse_linestring(object_geom)
  end

  local function emit(side, forward, category)
    insert_carriageway_edge(segments, {
      segment_id = object_default_id .. '/' .. side,
      side = side,
      geom = edge_geom(forward),
      category = category,
      road = road_value,
      parent_id = object_default_id,
      edge_oneway = 'yes',
      tags = base_tags,
    })
  end

  if is_car_not_bike then
    local motor_backward = raw_oneway == '-1'
    local with_flow_side = motor_backward and 'left' or 'right'
    local contra_side = motor_backward and 'right' or 'left'
    emit(with_flow_side, not motor_backward, 'mixedTrafficMotor')
    emit(contra_side, motor_backward, 'mixedTrafficMotorContraflow')
    return
  end

  if raw_oneway == '-1' then
    emit('left', false, 'mixedTrafficMotor')
    return
  end

  if factor_oneway == 'yes' or raw_oneway == 'yes' then
    emit('right', true, 'mixedTrafficMotor')
    return
  end

  emit('right', true, 'mixedTrafficMotor')
  emit('left', false, 'mixedTrafficMotor')
end

---@param segments table[]
---@param object_tags OsmTags
---@param object_geom table
---@param object_default_id string
---@param self_cycleway table|nil
---@param road_value string|nil
local function emit_path_edge(segments, object_tags, object_geom, object_default_id, self_cycleway, road_value)
  local bikelane_category_id = self_cycleway and self_cycleway.category or nil
  local derived_oneway = (self_cycleway and self_cycleway.oneway)
    or derive_oneway(object_tags, { implicitOneWay = false })
  local edge_oneway = 'yes'
  local edge_geom = object_geom
  if object_tags.oneway == '-1' and derived_oneway ~= 'car_not_bike' then
    -- Directed against the OSM way; derive_oneway has no `-1` case (falls to assumed_no).
    edge_geom = reverse_linestring(object_geom)
  elseif derived_oneway == 'no' or derived_oneway == 'assumed_no' or derived_oneway == 'car_not_bike' then
    -- Bikes may ride both ways (car_not_bike: only motor traffic is oneway).
    edge_oneway = 'no'
  end

  local tags = merge_table({
    parent_id = object_default_id,
    _side = 'self',
  }, object_tags)
  tags.oneway = edge_oneway

  table.insert(segments, {
    segment_id = object_default_id,
    side = 'self',
    parent_id = object_default_id,
    source_table = 'roadsPathClasses',
    source_id = object_default_id,
    geom = edge_geom,
    edge_oneway = edge_oneway,
    tags = tags,
    category = bikelane_category_id or 'mixedTrafficFoot',
    road = road_value,
  })
end

---@param context RoadsBikelanesWayContext
local function build_segments(context)
  local object_tags = context.object_tags
  local object_geom = context.object_geom
  local segments = {}
  local has_virtual_infra = false
  local virtual_uses_centerline_id = false
  local self_cycleway = nil
  local object_default_id = default_id({ type = object_tags._type, id = object_tags._id })

  for _, cycleway in ipairs(context.cycleways) do
    if cycleway._side == 'self' then
      self_cycleway = cycleway
    end
    if cycleway._infrastructureExists and cycleway.category then
      has_virtual_infra = true
      local side = cycleway._side or 'self'
      local geom = nil
      local edge_oneway = nil
      if side == 'self' and object_tags.oneway == '-1' and cycleway.oneway ~= 'car_not_bike' then
        -- Same as path edges: derive_oneway has no `-1` case, so orient the edge here.
        geom = reverse_linestring(object_geom)
        edge_oneway = 'yes'
      end
      table.insert(segments, {
        segment_id = cycleway._id,
        side = side,
        parent_id = object_default_id,
        source_table = 'bikelanes',
        source_id = cycleway._id,
        geom = geom,
        edge_oneway = edge_oneway,
        tags = merge_table({ parent_id = object_default_id }, cycleway),
        category = cycleway.category,
      })
    end
    if cycleway._infrastructureExists
      and cycleway._id == object_default_id
      and not lane_within_carriageway_categories[cycleway.category]
    then
      virtual_uses_centerline_id = true
    end
  end

  if road_highway_classes[object_tags.highway] and not virtual_uses_centerline_id then
    local road_value = context.shared_result_tags.road or road_classification_road_value(object_tags)
    emit_carriageway_edges(
      segments,
      object_tags,
      object_geom,
      object_default_id,
      road_value
    )
  elseif HIGHWAYS.path_classes[object_tags.highway] and not has_virtual_infra and not virtual_uses_centerline_id then
    -- Path edges always join roadsPathClasses; skip when that table would omit the way.
    if not excluded_from_roads_tables(object_tags) then
      emit_path_edge(
        segments,
        object_tags,
        object_geom,
        object_default_id,
        self_cycleway,
        road_classification_road_value(object_tags)
      )
    end
  end

  return segments
end

return build_segments
