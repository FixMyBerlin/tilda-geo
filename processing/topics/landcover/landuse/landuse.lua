local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.landcover.landuse.landuse_errors')
local exit_processing = require('topics.landcover.landuse.helper.exit_processing')
local result_tags = require('topics.landcover.landuse.helper.result_tags')
local minzoom = require('topics.landcover.landuse.helper.minzoom')

-- The `landuse` display table: land use polygons (the allowed landuse/amenity/leisure values
-- defined in helper/allowed_values.lua) with the standard topic shape (id/tags/meta/geom/minzoom).
-- Nested overlaps are pruned afterwards by cleanup.sql (the larger polygon wins). See ../README.md.
local db_table = osm2pgsql.define_table({
  name = 'landuse',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multipolygon' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true },
  },
})

--- Area handler for the `landuse` table. The entrypoint routes area-eligible objects (closed
--- ways, multipolygon relations) here; object:as_multipolygon() works for both (same pattern as
--- barriers). The tag filter (exit_processing) decides which land use we keep.
---@param object table
local function landuse(object)
  if exit_processing(object) then
    return
  end

  local cleaned_tags, replaced_tags = result_tags(object.tags)
  local geom = object:as_multipolygon()
  local caller_name = object.type == 'relation' and 'landuse_relation' or 'landuse_way'
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, caller_name)

  db_table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = default_id(object),
  })
end

return landuse
