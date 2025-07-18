require('init')
require('DefaultId')

local db_table_error = osm2pgsql.define_table({
  name = 'parking_errors',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    -- We cannot use our own id system here because the uniquess index fails.
    -- This is our solution: https://osm2pgsql.org/doc/manual-v1.html#using-an-additional-id-column
    { column = 'serial_id', sql_type = 'serial', create_only = true },
    { column = 'id',   type = 'text', not_null = true }, -- still required to satisfy utils/TableNames.lua
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' }, -- default projection for vector tiles
    { column = 'minzoom', type = 'integer' },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'serial_id', method = 'btree', unique = true  },
    { column = 'id', method = 'btree', unique = false  },
  }
})

-- Local function to log parking errors
local function log_parking_error(object, tags, caller_name, error_type, instruction)
  if next(tags) == nil and error_type ~= 'RELATION' then return end

  local geom = nil
  if(object.type == 'node') then geom = object:as_point() end
  if(object.type == 'way') then geom = object:as_multilinestring():centroid() end
  if(object.type == 'relation') then geom = object:as_multilinestring():centroid() end

  local error_tags = {}
  if tags then
    for k, v in pairs(tags) do
      error_tags[k] = v
    end
  end

  error_tags._caller_name = caller_name
  error_tags._error_type = error_type
  error_tags._instruction = instruction

  local row = {
    id = DefaultId(object),
    geom = geom,
    tags = error_tags,
    meta = {},
    minzoom = 0
  }
  db_table_error:insert(row)
end

local LOG_ERROR = {
  SANITIZED_VALUE = function(object, tags, caller_name)
    log_parking_error(object, tags, caller_name, 'SANITIZED_VALUE',
      'These tags have values that were not accepted by our sanitization. Please review the values, fix the data, or update the sanitization.')
  end,
  RELATION = function(object, caller_name)
    log_parking_error(object, {}, caller_name, 'RELATION',
      object.id .. ' is a Relation what would become a MultiPolygon. We don\'t support MultiPolygons in our processing. Consider reworking the data to separate areas.')
  end
}

return LOG_ERROR
