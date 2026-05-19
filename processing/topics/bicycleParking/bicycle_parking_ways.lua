local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.bicycleParking.bicycleParking_errors')
local result_tags = require('topics.bicycleParking.helper.result_tags')
local insert_bicycle_parking_point = require('topics.bicycleParking.helper.insert_bicycle_parking_point')

local areaTable = osm2pgsql.define_table({
  name = 'bicycleParking_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'polygon' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true }
  }
})

local function process_way(object)
  if object.tags.amenity ~= 'bicycle_parking' then return end

  if object.is_closed then
    local cleaned_tags, replaced_tags = result_tags(object.tags)
    local poly = object:as_polygon()
    LOG_ERROR.SANITIZED_VALUE(object, poly, replaced_tags, 'bicycleParking_way_area')

    local id = default_id(object)
    local meta = metadata(object)
    areaTable:insert({
      tags = cleaned_tags,
      meta = meta,
      geom = poly,
      minzoom = 0,
      id = id
    })

    insert_bicycle_parking_point(cleaned_tags, meta, poly:centroid(), id)
    return
  end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local line = object:as_linestring()
  LOG_ERROR.SANITIZED_VALUE(object, line, replaced_tags, 'bicycleParking_way_line')

  insert_bicycle_parking_point(
    cleaned_tags,
    metadata(object),
    line:centroid(),
    default_id(object)
  )
end

return process_way
