require('init')
local result_tags_off_street_parking = require('result_tags_off_street_parking')
local categorize_off_street_parking = require('categorize_off_street_parking')
local off_street_parking_area_categories = require('off_street_parking_area_categories')
local area_sqm = require('area_sqm')
local LOG_ERROR = require('parking_errors')

local db_table_area = osm2pgsql.define_table({
  name = 'off_street_parking_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'polygon' }, -- default projection for vector tiles
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'id', method = 'btree', unique = true  },
  }
})

local db_table_label = osm2pgsql.define_table({
  name = 'off_street_parking_area_labels',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' }, -- default projection for vector tiles
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'id', method = 'btree', unique = true  },
  }
})

local function off_street_parking_areas(object)
  if (object.type == "way" and not object.is_closed) then return end
  if next(object.tags) == nil then return end

  local result = categorize_off_street_parking(object, off_street_parking_area_categories)
  if result.object then
    local row_data, replaced_tags = result_tags_off_street_parking(result, area_sqm(result.object))
    local row = MergeTable({ geom = result.object:as_multipolygon() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'off_street_parking_areas')
    -- `:as_multipolygon()` will create a postgis-polygon or postgis-multipoligon.
    -- With `:num_geometries()` we filter to only allow polygons which is our table column data type.
    if row.geom:num_geometries() == 1 then
      db_table_area:insert(row)

      local label_row = {
        id = row_data.id,
        tags = {
          capacity = row_data.tags.capacity,
          operator_type = row_data.tags.operator_type,
        },
        meta = {},
        geom = row.geom:pole_of_inaccessibility(),
        minzoom = 0,
      }
      db_table_label:insert(label_row)
    else
      LOG_ERROR.RELATION(result.object, row.geom, 'off_street_parking_areas')
    end
  end
end

return off_street_parking_areas
