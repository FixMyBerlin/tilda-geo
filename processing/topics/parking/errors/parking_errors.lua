require('init')
require('DefaultId')

local db_table = osm2pgsql.define_table({
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
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'serial_id', method = 'btree', unique = true  },
    { column = 'id', method = 'btree', unique = false  },
  }
})

-- Called right before other tables are inserted.
-- Handles point, line and area data but stores them as points (centroid)
-- `tags` are based on sanitize_for_logging.lua and sanitize_cleaner.lua
local function parking_errors(object, geom, tags, caller_name, error_type, instruction)
  local point_geom = nil
  if(object.type == 'node') then point_geom = geom end
  if(object.type == 'way') then point_geom = geom:centroid() end
  if(object.type == 'relation') then point_geom = geom:centroid() end

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
    geom = point_geom,
    tags = error_tags,
    meta = {},
    minzoom = 0
  }
  db_table:insert(row)
end

local LOG_ERROR = {
  SANITIZED_VALUE = function(object, geom, tags, caller_name)
    parking_errors(object, geom, tags, caller_name, 'SANITIZED_VALUE',
      'These tags have values that were not accepted by our sanitization. Please review the values, fix the data, or update the sanitization.')
  end,
  RELATION = function(object, geom, caller_name)
    parking_errors(object, geom, {}, caller_name, 'RELATION',
      'This is a relation that would be processed as a multipolygon. Multipolygons are not supported in our processing. Please restructuring the data to use separate areas instead.')
  end
}

return LOG_ERROR
