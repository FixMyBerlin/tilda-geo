require('init')
require('Log')
require('MergeTable')
require('categorize_area')
local sanitize_cleaner = require('sanitize_cleaner')
local LOG_ERROR = require('parking_errors')
local result_tags_obstacles = require('result_tags_obstacles')

local db_table = osm2pgsql.define_table({
  name = '_parking_obstacle_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'polygon', projection = 5243 },
  },
})

local function parking_obstacle_areas(object)
  if (object.type == 'way' and not object.is_closed) then return end
  if next(object.tags) == nil then return end

  local result = categorize_area(object)
  if result.object then
    local row_tags = result_tags_obstacles(result)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_tags.tags, result.object.tags)
    row_tags.tags = cleaned_tags
    local row = MergeTable({ geom = result.object:as_multipolygon() }, row_tags)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'parking_obstacle_areas')

    -- `:as_multipolygon()` will create a postgis-polygon or postgis-multipoligon.
    -- With `:num_geometries()` we filter to only allow polygons which is our table column data type.
    if row.geom:num_geometries() == 1 then
      db_table:insert(row)
    else
      LOG_ERROR.RELATION(result.object, row.geom, 'parking_obstacle_areas')
    end
  end

end

return parking_obstacle_areas
