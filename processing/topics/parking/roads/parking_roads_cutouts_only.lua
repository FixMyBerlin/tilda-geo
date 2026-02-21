require('init')
require('MergeTable')
require('result_tags_roads')

local db_table = osm2pgsql.define_table({
  name = '_parking_roads_cutouts_only',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'linestring', projection = 5243 },
    { column = 'is_driveway', type = 'boolean' },
    { column = 'has_parking', type = 'boolean' },
  },
  indexes = {
    { column = { 'osm_id' }, method = 'btree' },
    { column = { 'geom' }, method = 'gist' },
  }
})

-- Collect motorway_link ways for cutouts only. They are unioned with _parking_roads
-- in cutouts/1_insert_cutouts.sql so that parking strips crossing motorway_link get
-- punched out. We do not add motorway_link to _parking_roads (no kerbs, parkings,
-- intersections, etc.) because motorways are not parking streets.
function parking_roads_cutouts_only(object)
  if object.tags.highway ~= 'motorway_link' then return end
  if object.tags.area == 'yes' then return end

  local row_data = result_tags_roads(object)
  local row = MergeTable({
    geom = object:as_linestring(),
    is_driveway = false,
    has_parking = false,
  }, row_data)
  db_table:insert(row)
end
