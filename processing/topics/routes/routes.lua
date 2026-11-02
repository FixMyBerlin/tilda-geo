local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local ROUTE_TYPES = require('topics.helper.route_types')
local LOG_ERROR = require('topics.routes.routes_errors')
local bikeroute_result_tags = require('topics.routes.helper.bikeroute_result_tags')
local bikeroute_minzoom = require('topics.routes.helper.bikeroute_minzoom')
local route_result_tags = require('topics.routes.helper.route_result_tags')

-- No process_node/process_way: this topic only outputs route relations, one table per route type.
local tables = {}
for route, table_name in pairs(ROUTE_TYPES.TABLE_BY_ROUTE) do
  tables[route] = osm2pgsql.define_table({
    name = table_name,
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
      { column = 'id', method = 'btree', unique = true },
    },
  })
end

function osm2pgsql.process_relation(object)
  local route = ROUTE_TYPES.route_type(object.tags)
  if route == nil then return end

  -- `bikeroutes` has a map layer styled by bike-network tags and zooms; the other types have none yet.
  local is_bicycle = route == 'bicycle'
  local result_tags = is_bicycle and bikeroute_result_tags or route_result_tags
  local cleaned_tags, replaced_tags = result_tags(object)
  local geom = object:as_multilinestring()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, ROUTE_TYPES.TABLE_BY_ROUTE[route])

  tables[route]:insert({
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = is_bicycle and bikeroute_minzoom(cleaned_tags) or 10,
    id = default_id(object),
  })
end
