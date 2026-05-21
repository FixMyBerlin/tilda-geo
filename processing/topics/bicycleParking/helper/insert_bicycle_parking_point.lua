
local minzoom = require('topics.bicycleParking.helper.minzoom')

local point_table = osm2pgsql.define_table({
  name = 'bicycleParking_points',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true }
  }
})

local function insert_bicycle_parking_point(cleaned_tags, meta, geom, id)
  point_table:insert({
    tags = cleaned_tags,
    meta = meta,
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = id,
  })
end

return insert_bicycle_parking_point
