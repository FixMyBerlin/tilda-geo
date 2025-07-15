require('init')
local sanitize_cleaner = require('sanitize_cleaner')
local result_tags_off_street_parking = require('result_tags_off_street_parking')
local categorize_off_street_parking = require('categorize_off_street_parking')
local off_street_parking_area_categories = require('off_street_parking_area_categories')
local area_sqm = require('area_sqm')
require('parking_errors')

local db_table_area = osm2pgsql.define_table({
  name = 'off_street_parking_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    -- `geometry` means either Polygon or MultiPolygon (in this cases)
    { column = 'geom', type = 'geometry' }, -- default projection for vector tiles
    { column = 'minzoom', type = 'integer' },
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
    { column = 'minzoom', type = 'integer' },
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
    local row_tags = result_tags_off_street_parking(result, area_sqm(result.object))
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_tags.tags, result.object.tags)
    row_tags.tags = cleaned_tags
    parking_errors(result.object, replaced_tags, 'off_street_parking_areas')

    local row = MergeTable({ geom = result.object:as_multipolygon() }, row_tags)
    db_table_area:insert(row)

    local label_row_tags = {
      id = row_tags.id,
      tags = { capacity = row_tags.tags.capacity }
    }
    local label_row = MergeTable({ geom = result.object:as_multipolygon():pole_of_inaccessibility() }, label_row_tags)
    db_table_label:insert(label_row)
  end
end

return off_street_parking_areas
