require('init')
local CLONE = require('clones')
local transform_construction_prefix = require('transform_construction_prefix')
local transform_cycleway_both_postfix = require('transform_cycleway_both_postfix')
local transform_cycleway_opposite_schema = require('transform_cycleway_opposite_schema')
local transform_lifecycle_tags = require('transform_lifecycle_tags')
local round = require('round')
local metadata = require('metadata')
local prepare_pseudo_tags_roads_bikelanes = require('prepare_pseudo_tags_roads_bikelanes')
local roads_bikelanes_sidepath_source_paths = require('roads_bikelanes_sidepath_source_paths')
local prepare_shared_bikelane_state_roads_bikelanes = require('prepare_shared_bikelane_state_roads_bikelanes')
local roads_bikelanes_bikelanes = require('roads_bikelanes_bikelanes')
local roads_bikelanes_roads = require('roads_bikelanes_roads')
local EXIT = require('exit_processing_roads_bikelanes')
local result_tags_roads_bikelanes = require('result_tags_roads_bikelanes')

function osm2pgsql.process_way(object)
  local object_tags = CLONE.structured_clone(object.tags)

  transform_lifecycle_tags(object_tags)
  if EXIT.exit_processing_roads_bikelanes(object_tags) then return end

  local object_geom = object:as_linestring() -- only compute once
  object_tags._length = round(object_geom:transform(5243):length(), 2) -- used in result_tags but also nested decision
  object_tags._type = object.type
  object_tags._id = object.id
  object_tags._timestamp = object.timestamp

  prepare_pseudo_tags_roads_bikelanes(object_tags, object_tags._id)

  transform_cycleway_opposite_schema(object_tags)
  transform_construction_prefix(object_tags)
  transform_cycleway_both_postfix(object_tags)

  local shared_result_tags = result_tags_roads_bikelanes(object_tags)
  local shared_bikelane_state = prepare_shared_bikelane_state_roads_bikelanes(object_tags, object_geom)
  local context = {
    object_meta = metadata(object),
    object_tags = object_tags,
    object_geom = object_geom,
    shared_result_tags = shared_result_tags,
    cycleways = shared_bikelane_state.cycleways,
    cycleway_presence = shared_bikelane_state.cycleway_presence,
  }

  roads_bikelanes_sidepath_source_paths(object_tags, object_geom)
  roads_bikelanes_bikelanes(context)
  roads_bikelanes_roads(context)
end
