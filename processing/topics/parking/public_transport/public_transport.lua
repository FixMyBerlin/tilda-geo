require('init')
local parking_public_transport_stops = require('parking_public_transport_stops')
local parking_platform_lines = require('parking_platform_lines')

-- NOTE ON PROJECTIONS:
-- All `_parking_*` tables use EPSG:5243
--  which is optimized for Germany and uses Meters
--  https://spatialreference.org/ref/epsg/5243/

local db_table = osm2pgsql.define_table({
  name = '_parking_public_transport',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type', index='always' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'geometry', projection = 5243 },
  },
})

local function parking_public_transport_stops_wrapper(object)
  parking_public_transport_stops(object, db_table)
end

local function parking_platform_lines_wrapper(object)
  parking_platform_lines(object, db_table)
end

return {
  parking_public_transport_stops = parking_public_transport_stops_wrapper,
  parking_platform_lines = parking_platform_lines_wrapper,
}
