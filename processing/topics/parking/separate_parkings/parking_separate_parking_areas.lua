require('init')
require('Log')
require('MergeTable')
local sanitize_cleaner = require('sanitize_cleaner')
require('parking_errors')
local separate_parking_area_categories = require('separate_parking_area_categories')
local categorize_separate_parking = require('categorize_separate_parking')
local result_tags_separate_parking = require('result_tags_separate_parking')
local area_sqm = require('area_sqm')

local db_table = osm2pgsql.define_table({
  name = '_parking_separate_parking_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    -- `geometry` means either Polygon or MultiPolygon (in this cases)
    { column = 'geom',    type = 'geometry', projection = 5243 },
  },
})

-- Type way (area) and relation (areas)
local function parking_separate_parking_areas(object)
  if (object.type == 'way' and not object.is_closed) then return end
  if next(object.tags) == nil then return end

  local result = categorize_separate_parking(object, separate_parking_area_categories)
  if result.object then
    local row_tags = result_tags_separate_parking(result, area_sqm(result.object))
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_tags.tags, result.object.tags)
    row_tags.tags = cleaned_tags
    parking_errors(result.object, replaced_tags, 'parking_separate_parking_areas')

    local row = MergeTable({ geom = result.object:as_multipolygon() }, row_tags)
    db_table:insert(row)
  end

end

return parking_separate_parking_areas
