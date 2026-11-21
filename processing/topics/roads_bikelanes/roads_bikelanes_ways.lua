local transform_construction_prefix = require('topics.roads_bikelanes.helper.transform_tags.transform_construction_prefix')
local transform_cycleway_both_postfix = require('topics.roads_bikelanes.helper.transform_tags.transform_cycleway_both_postfix')
local transform_cycleway_opposite_schema = require('topics.roads_bikelanes.helper.transform_tags.transform_cycleway_opposite_schema')
local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')
local normalize_oneway_tags = require('topics.helper.normalize_oneway_tags')
local round = require('topics.helper.round')
local metadata = require('topics.helper.metadata')
local prepare_pseudo_tags_roads_bikelanes = require('topics.roads_bikelanes.pseudo_tags.prepare_pseudo_tags_roads_bikelanes')
local roads_bikelanes_sidepath_source_paths = require('topics.roads_bikelanes.pseudo_tags_sidepath.roads_bikelanes_sidepath_source_paths')
local prepare_shared_bikelane_state_roads_bikelanes = require('topics.roads_bikelanes.helper.prepare_shared_bikelane_state_roads_bikelanes')
local roads_bikelanes_bikelanes = require('topics.roads_bikelanes.roads_bikelanes_bikelanes')
local roads_bikelanes_routing_infra = require('topics.roads_bikelanes.roads_bikelanes_routing_infra')
local roads_bikelanes_roads = require('topics.roads_bikelanes.roads_bikelanes_roads')
local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local ACCESS = require('topics.roads_bikelanes.helper.access_restriction')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')

---@param object OsmObject
local function process_roads_bikelanes_way(object)
  if not object.tags.highway then return end

  ---@type OsmTags
  local object_tags = object.tags

  -- REMINDER: Keep the transform order in sync with `bikelanes/__tests__/bikelanes_lifecycle.test.lua`
  transform_lifecycle_tags(object_tags)
  if EXIT.exit_processing(object_tags) then return end -- stage 1: tags only

  -- `construction:access=private`, `construction:cycleway:right=lane` & co. have to be seen by stage 2.
  -- Tag rewrite only, no geometry or pseudo tags needed. The two `cycleway` transforms below stay
  -- late: they only rewrite `cycleway*` keys, which are a hint (`may_have_bike_infra`) before and after.
  transform_construction_prefix(object_tags)

  -- Stage 2: tags only. A `way` restriction without a hint of bike infrastructure is written nowhere.
  local restriction = ACCESS.access_restriction(object_tags)
  if restriction and restriction.level == 'way' and not restriction.may_have_bike_infra then return end

  local object_geom = object:as_linestring() -- only compute once
  object_tags._length = round(object_geom:transform(5243):length(), 2) -- used in result_tags but also nested decision
  object_tags._type = object.type
  object_tags._id = object.id
  object_tags._timestamp = object.timestamp

  prepare_pseudo_tags_roads_bikelanes(object_tags, object_tags._id, object_geom)

  normalize_oneway_tags(object_tags)
  transform_cycleway_opposite_schema(object_tags)
  transform_cycleway_both_postfix(object_tags)

  ---@type SharedResultTags
  local shared_result_tags = result_tags(object_tags)
  ---@type BikelaneState
  local shared_bikelane_state = prepare_shared_bikelane_state_roads_bikelanes(object_tags)

  -- Stage 3: own bike infrastructure lifts `service` / `indoor` / `informal`
  restriction = ACCESS.after_categorisation(restriction, object_tags, shared_bikelane_state.cycleways)
  if restriction and restriction.level == 'way' then return end

  ---@type RoadsBikelanesWayContext
  local context = {
    object_meta = metadata(object),
    object_tags = object_tags,
    object_geom = object_geom,
    shared_result_tags = shared_result_tags,
    cycleways = shared_bikelane_state.cycleways,
    cycleway_presence = shared_bikelane_state.cycleway_presence,
    restriction = restriction,
  }

  roads_bikelanes_sidepath_source_paths(object_tags, object_geom)
  roads_bikelanes_routing_infra(context)
  roads_bikelanes_bikelanes(context)
  roads_bikelanes_roads(context)
end

return process_roads_bikelanes_way
