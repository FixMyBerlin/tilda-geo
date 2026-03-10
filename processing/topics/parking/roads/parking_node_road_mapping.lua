require('init')
require('Log')
require('MergeTable')
require('result_tags_roads')
local is_road_check = require('is_road')
local is_driveway_check = require('is_driveway')
local has_parking_check = require('has_parking')

local db_table = osm2pgsql.define_table({
  name = '_parking_node_road_mapping',
  ids = { type = 'way', id_column = 'way_id', create_index = 'always'},
  columns = {
    { column = 'node_id', type = 'bigint', not_null = true },
    { column = 'idx', type = 'int', not_null = true },
    { column = 'is_terminal_node', type = 'boolean', not_null = true },
    { column = 'is_driveway', type = 'boolean'},
    { column = 'has_parking', type = 'boolean'},
    { column = 'is_parking_road', type = 'boolean'},
  },
  indexes = {
    { column = 'node_id', method = 'btree'},
    { column = 'way_id', method = 'btree'},
    { column = {'node_id', 'way_id'}, method = 'btree'}
  }
})

function parking_node_road_mapping(object)
  local is_road = is_road_check(object.tags)
  local is_driveway = is_driveway_check(object.tags)
  if not (is_road or is_driveway) then return end

  -- Same is_parking_road rule as parking_roads.lua; used for road_degree in 1_find_intersections.sql.
  local has_parking = has_parking_check(object.tags)
  local is_parking_road = is_road or (is_driveway and has_parking)

  for idx, node_id in ipairs(object.nodes) do
    local row = {
      node_id = node_id,
      idx = idx,
      is_terminal_node = idx == 1 or idx == #object.nodes,
      is_driveway = is_driveway,
      has_parking = has_parking,
      is_parking_road = is_parking_road,
    }
    db_table:insert(row)
  end
end
