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
    { column = 'minzoom', type = 'integer' },
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
function parking_errors(object, tags, caller_name)
  if next(tags) == nil then return end

  local geom = nil
  if(object.type == 'node') then geom = object:as_point() end
  if(object.type == 'way') then geom = object:as_multilinestring():centroid() end
  if(object.type == 'relation') then geom = object:as_multilinestring():centroid() end

  tags._caller_name = caller_name
  tags._instruction = 'These tags have values that were not accepted by our sanitization. Please review the values, fix the data, or update the sanitization.'
  local row = {
    id = DefaultId(object),
    geom = geom,
    tags = tags,
    meta = {},
    minzoom = 0
  }
  db_table:insert(row)
end
