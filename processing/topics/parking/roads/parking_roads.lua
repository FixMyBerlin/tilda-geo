require('init')
require('Log')
require('MergeTable')
require('result_tags_roads')
local is_road_check = require('is_road')
local is_driveway_check = require('is_driveway')
local has_parking_check = require('has_parking')
local LOG_ERROR = require('parking_errors')

local db_table = osm2pgsql.define_table({
  name = '_parking_roads',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring', projection = 5243 },
    { column = 'is_driveway', type = 'boolean'},
    { column = 'has_parking', type = 'boolean'},
  },
  indexes = {
    { column = { 'osm_id' }, method = 'btree' },
    { column = { 'geom' }, method = 'gist' },
  }
})

function parking_roads(object)
  local is_road = is_road_check(object.tags)
  local is_driveway = is_driveway_check(object.tags)
  if not (is_road or is_driveway) then return end
  if object.tags.area == 'yes' then return end -- exclude areas like https://www.openstreetmap.org/way/185835333

  local row_data, replaced_tags = result_tags_roads(object)
  local row = MergeTable({ geom = object:as_linestring(), is_driveway = is_driveway, has_parking = has_parking_check(object.tags) }, row_data)

  LOG_ERROR.SANITIZED_VALUE(object, row.geom, replaced_tags, 'parking_roads')
  db_table:insert(row)
end
