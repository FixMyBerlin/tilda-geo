local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.bikeroutes.bikeroutes_errors')
local result_tags = require('topics.bikeroutes.helper.result_tags')
local minzoom = require('topics.bikeroutes.helper.minzoom')

local bikeroutesTable = osm2pgsql.define_table({
  name = 'bikeroutes',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multilinestring' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true }
  }
})

local function bikeroutes_relations(object)
  local tags = object.tags
  if tags.type ~= 'route' or tags.route ~= 'bicycle' then return end

  local cleaned_tags, replaced_tags = result_tags(object)
  local geom = object:as_multilinestring()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'bikeroutes')

  bikeroutesTable:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = minzoom(cleaned_tags),
    id = default_id(object),
  })
end

return bikeroutes_relations
