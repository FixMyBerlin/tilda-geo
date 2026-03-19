require('init')
local bikelane_generalization = require('bikelane_generalization')
local merge_table = require('merge_table')
local extract_public_tags = require('extract_public_tags')
local default_id = require('default_id')
local roads_bikelanes_tables = require('roads_bikelanes_tables')
local SANITIZE_TAGS = require('sanitize_tags')

local bikelanes_table = roads_bikelanes_tables.bikelanes_table
local bikelanes_presence_table = roads_bikelanes_tables.bikelanes_presence_table
local todo_lines_table = roads_bikelanes_tables.todo_lines_table

local function roads_bikelanes_bikelanes(context)
  local object_meta = context.object_meta
  local object_tags = context.object_tags
  local object_geom = context.object_geom
  local shared_result_tags = context.shared_result_tags
  local cycleways = context.cycleways
  local cycleway_presence = context.cycleway_presence

  for _, cycleway in ipairs(cycleways) do
    if cycleway._infrastructureExists then
      local result_tags = {
        name = shared_result_tags.name,
        road = shared_result_tags.road,
        length = shared_result_tags.length,
        mapillary_coverage = object_tags.mapillary_coverage,
        mapillary = cycleway.mapillary or shared_result_tags.mapillary,
        mapillary_forward = cycleway.mapillary_forward or shared_result_tags.mapillary_forward,
        mapillary_backward = cycleway.mapillary_backward or shared_result_tags.mapillary_backward,
        mapillary_traffic_sign = cycleway.mapillary_traffic_sign or shared_result_tags.mapillary_traffic_sign,
        description = SANITIZE_TAGS.safe_string(cycleway.description) or shared_result_tags.description,
        operator_type = shared_result_tags.operator_type,
        informal = shared_result_tags.informal,
        covered = shared_result_tags.covered,
        _parent_highway = cycleway._parent_highway,
        _is_sidepath = object_tags._is_sidepath,
      }
      local meta = object_meta

      bikelanes_table:insert({
        id = cycleway._id,
        tags = merge_table(extract_public_tags(cycleway), result_tags),
        meta = meta,
        geom = object_geom,
        minzoom = bikelane_generalization(object_tags, result_tags)
      })

      if next(cycleway._todo_list) ~= nil then
        local todo_meta = {
          todos = cycleway.todos,
          category = cycleway.category,
          mapillary_coverage = object_tags.mapillary_coverage,
        }
        todo_lines_table:insert({
          id = cycleway._id,
          table = 'bikelanes',
          tags = cycleway._todo_list,
          meta = merge_table(todo_meta, meta),
          length = math.floor(result_tags.length),
          geom = object_geom,
          minzoom = 0
        })
      end
    end
  end

  if cycleway_presence == nil then return end

  local has_expected_presence =
    cycleway_presence.bikelane_left ~= 'not_expected' or
    cycleway_presence.bikelane_right ~= 'not_expected' or
    cycleway_presence.bikelane_self ~= 'not_expected'

  if not has_expected_presence then return end

  bikelanes_presence_table:insert({
    id = default_id({ type = object_tags._type, id = object_tags._id }),
    tags = cycleway_presence,
    meta = object_meta,
    geom = object_geom,
    minzoom = 0
  })
end

return roads_bikelanes_bikelanes
