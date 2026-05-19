local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.boundaries.boundaries_errors')
local result_tags = require('topics.boundaries.helper.result_tags')

local table = osm2pgsql.define_table({
  name = 'boundaries',
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
    { column = 'id', method = 'btree', unique = true }
  }
})

local labelTable = osm2pgsql.define_table({
  name = 'boundaryLabels',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true }
  }
})

local function boundaries_relations(object)
  local tags = object.tags
  if not (tags.type == 'boundary' and tags.boundary == 'administrative') then
    return
  end

  -- Make sure we only include boundaries with a geometry
  -- https://osm2pgsql.org/doc/manual.html#processing-callbacks
  -- https://osm2pgsql.org/doc/manual.html#geometry-objects-in-lua
  if object:as_multipolygon():is_null() then return end

  local cleaned_tags, replaced_tags = result_tags(tags)
  local geom = object:as_multipolygon()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'boundaries_relation')

  table:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = 0,
    id = default_id(object)
  })
  labelTable:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom:pole_of_inaccessibility(),
    minzoom = 0,
    id = default_id(object)
  })
end

return boundaries_relations
