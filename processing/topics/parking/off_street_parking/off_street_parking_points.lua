require('init')
require('DefaultId')
require('Metadata')
local sanitize_cleaner = require('sanitize_cleaner')
local result_tags_off_street_parking = require('result_tags_off_street_parking')
local categorize_off_street_parking = require('categorize_off_street_parking')
local off_street_parking_point_categories = require('off_street_parking_point_categories')
local LOG_ERROR = require('parking_errors')

local db_table = osm2pgsql.define_table({
  name = 'off_street_parking_points',
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

local function off_street_parking_points(object)
  if next(object.tags) == nil then return end

  local result = categorize_off_street_parking(object, off_street_parking_point_categories)
  if result.object then
    local row_data = result_tags_off_street_parking(result)
    local cleaned_tags, replaced_tags = sanitize_cleaner(row_data.tags, result.object.tags)
    row_data.tags = cleaned_tags
    local row = MergeTable({ geom = result.object:as_point() }, row_data)

    LOG_ERROR.SANITIZED_VALUE(result.object, row.geom, replaced_tags, 'off_street_parking_points')
    db_table:insert(row)
  end
end

return off_street_parking_points
