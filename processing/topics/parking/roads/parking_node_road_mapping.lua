require('init')
require("Log")
require("MergeTable")
require("result_tags_roads")
require("is_road")
require("is_driveway")
require("has_parking")

local db_table = osm2pgsql.define_table({
  name = '_parking_node_road_mapping',
  ids = { type = 'way', id_column = 'way_id', create_index = 'always'},
  columns = {
    { column = 'node_id', type = 'bigint', not_null = true },
    { column = 'idx', type = 'int', not_null = true },
    { column = 'is_terminal_node', type = 'boolean', not_null = true },
    { column = 'is_driveway', type = 'boolean'},
    { column = 'has_parking', type = 'boolean'},
  },
  indexes = {
    { column = 'node_id', method = 'btree'},
    { column = 'way_id', method = 'btree'},
    { column = {'node_id', 'way_id'}, method = 'btree'}
  }
})

function parking_node_road_mapping(object)
  local is_main = is_road(object.tags)
  local is_driveway = is_driveway(object.tags)
  if not (is_main or is_driveway) then return end

  for idx, node_id in ipairs(object.nodes) do
    local row = {
      node_id = node_id,
      idx = idx,
      is_terminal_node = idx == 1 or idx == #object.nodes,
      is_driveway = is_driveway,
      has_parking = has_parking(object.tags),
    }
    db_table:insert(row)
  end
end
