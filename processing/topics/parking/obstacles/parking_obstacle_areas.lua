require('init')
require('Log')
require('MergeTable')
require('categorize_area')
local sanitize_cleaner = require('sanitize_cleaner')
require('parking_errors')
local result_tags_obstacles = require('result_tags_obstacles')

local db_table = osm2pgsql.define_table({
  name = '_parking_obstacle_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    -- `geometry` means either Polygon or MultiPolygon (in this case)
    { column = 'geom',    type = 'geometry', projection = 5243 },
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
    parking_errors(result.object, replaced_tags, 'parking_obstacle_areas')

    local row = MergeTable({ geom = result.object:as_multipolygon() }, row_tags)
    db_table:insert(row)
  end

end

return parking_obstacle_areas
