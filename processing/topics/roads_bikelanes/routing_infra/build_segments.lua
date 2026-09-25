-- Enumerates routing edges per `source_table` (`roads`, `bikelanes`, `roadsPathClasses`).
-- One edge per source object; direction via `oneway` / `oneway_motor` + geometry (README.md).
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

-- Routing publishes `oneway` as plain `yes`/`no` on every edge. `bikelanes.oneway` keeps the
-- detailed value (how we know), a router only needs whether it may ride against the line:
-- `implicit_yes` (lanes are one-way unless tagged otherwise) → yes;
-- `assumed_no` (untagged) and `car_not_bike` (only motor traffic is one-way) → no.
local routing_oneway = {
  yes = 'yes',
  implicit_yes = 'yes',
  no = 'no',
  assumed_no = 'no',
  car_not_bike = 'no',
}

-- Self infra that is a lane inside the carriageway (Mittellage). It uses the centerline id
-- like Fahrradstraße, but the road stays drivable, so the carriageway edges are kept.
-- `needsClarification` only matches motor roads via the unclear Mittellage condition.
local lane_within_carriageway_categories = SET.set({
  'cyclewayOnHighwayBetweenLanes',
  'needsClarification',
})

-- One carriageway edge per OSM way (`id` = `source_id` = `roads.id`), like path and bikelane edges.
-- `oneway=yes`: geometry points in the legal direction. `oneway=no` with `oneway_motor=yes`: cars
-- are one-way, bikes both ways; geometry points along the car direction, so riding against the
-- line is riding against car traffic (contraflow).
---@param segments table[]
---@param object_tags OsmTags
---@param object_geom table
---@param object_default_id string
---@param road_value string
local function emit_carriageway_edge(segments, object_tags, object_geom, object_default_id, road_value)
  local derived_oneway = derive_oneway(object_tags, { implicitOneWay = false })
  local geom = object_geom
  if object_tags.oneway == '-1' then
    geom = reverse_linestring(object_geom)
  end
  local edge_oneway = routing_oneway[derived_oneway]
  if object_tags.oneway == '-1' and derived_oneway ~= 'car_not_bike' then
    -- derive_oneway has no `-1` case (falls to assumed_no).
    edge_oneway = 'yes'
  end

  local tags = merge_table({ road = road_value, parent_id = object_default_id, _side = 'self' }, object_tags)
  tags.oneway = edge_oneway

  table.insert(segments, {
    segment_id = object_default_id,
    side = 'self',
    parent_id = object_default_id,
    source_table = 'roads',
    source_id = object_default_id,
    geom = geom,
    category = 'mixedTrafficMotor',
    road = road_value,
    edge_oneway = edge_oneway,
    oneway_motor = derived_oneway == 'car_not_bike' and 'yes' or nil,
    tags = tags,
  })
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
      local edge_oneway = routing_oneway[cycleway.oneway]
      local oneway_motor = nil
      if side == 'self' and object_tags.oneway == '-1' then
        -- Same as carriageway/path edges: point along the (motor) direction of `oneway=-1`.
        -- derive_oneway has no `-1` case, so a bike-too oneway becomes `yes` here.
        geom = reverse_linestring(object_geom)
        if cycleway.oneway ~= 'car_not_bike' then
          edge_oneway = 'yes'
        end
      end
      if side == 'self' and cycleway.oneway == 'car_not_bike' then
        -- E.g. Fahrradstraße with two-way cycling: same contraflow flag as carriageway edges.
        oneway_motor = 'yes'
      end
      -- A Mittellage lane shares the centerline id with the carriageway edge (`roads`).
      -- Keep the row id unique; `source_id` still joins `bikelanes`.
      local segment_id = cycleway._id
      if side == 'self'
        and road_highway_classes[object_tags.highway]
        and lane_within_carriageway_categories[cycleway.category]
      then
        segment_id = cycleway._id .. '/cycleway/self'
      end
      table.insert(segments, {
        segment_id = segment_id,
        side = side,
        parent_id = object_default_id,
        source_table = 'bikelanes',
        source_id = cycleway._id,
        geom = geom,
        edge_oneway = edge_oneway,
        oneway_motor = oneway_motor,
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
    emit_carriageway_edge(segments, object_tags, object_geom, object_default_id, road_value)
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
