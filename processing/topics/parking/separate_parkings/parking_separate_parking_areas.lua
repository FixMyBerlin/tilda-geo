local log = require('topics.helper.log')
local merge_table = require('topics.helper.merge_table')
local LOG_ERROR = require('topics.parking.errors.parking_errors')
local separate_parking_area_categories = require('topics.parking.separate_parkings.area.separate_parking_area_categories')
local categorize_separate_parking = require('topics.parking.separate_parkings.helper.categorize_separate_parking')
local result_tags = require('topics.parking.separate_parkings.helper.result_tags')
local area_sqm = require('topics.parking.helper.area_sqm')

local db_table = osm2pgsql.define_table({
  name = '_parking_separate_parking_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'polygon', projection = 5243 },
  },
})

-- Type way (area) and relation (areas)
local function parking_separate_parking_areas(object)
  if (object.type == 'way' and not object.is_closed) then return end
  if next(object.tags) == nil then return end

  local result = categorize_separate_parking(object, separate_parking_area_categories)
  if result.object then
    local row_data, replaced_tags = result_tags(result.category, result.object, area_sqm(result.object))
    local row = merge_table({ geom = result.object:as_multipolygon() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_separate_parking_areas')
    -- `:as_multipolygon()` will create a postgis-polygon or postgis-multipoligon.
    -- With `:num_geometries()` we filter to only allow polygons which is our table column data type.
    if row.geom:num_geometries() == 1 then
      db_table:insert(row)
    else
      LOG_ERROR.RELATION(result.object, row.geom, 'parking_separate_parking_areas')
    end
  end

end

return parking_separate_parking_areas
