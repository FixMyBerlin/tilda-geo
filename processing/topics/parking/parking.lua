require('init')
local parking_separate_parking_areas = require('parking_separate_parking_areas')
local parking_obstacle_areas = require('parking_obstacle_areas')
local parking_obstacle_lines = require('parking_obstacle_lines')
local parking_separate_parking_points = require('parking_separate_parking_points')
local parking_obstacle_points = require('parking_obstacle_points')
local parking_crossing_points = require('parking_crossing_points')
local parking_crossing_lines = require('parking_crossing_lines')
local off_street_parking_points = require('off_street_parking_points')
local off_street_parking_areas = require('off_street_parking_areas')
require('parking_parkings')
require('parking_node_road_mapping')
require('parking_roads')
require('Log')


osm2pgsql.define_table({
  name = 'parkings',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'linestring', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

osm2pgsql.define_table({
  name = 'parkings_no',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multilinestring', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

osm2pgsql.define_table({
  name = 'parkings_separate',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'polygon', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

osm2pgsql.define_table({
  name = 'parkings_cutouts',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    -- 'geometry' means 'polygon' and 'multipolygon'
    { column = 'geom', type = 'geometry', projection = 3857 },
    { column = 'minzoom', type = 'integer' },
  },
})

-- NOTE ON PROJECTIONS:
-- All `paring_*` tables use EPSG:5243
--  which is optimized for Germany and uses Meters
--  https://spatialreference.org/ref/epsg/5243/

function osm2pgsql.process_node(object)
  parking_crossing_points(object)
  parking_separate_parking_points(object)
  parking_obstacle_points(object)

  off_street_parking_points(object)
end

function osm2pgsql.process_way(object)
  parking_separate_parking_areas(object)
  parking_obstacle_areas(object)
  off_street_parking_areas(object)

  parking_crossing_lines(object)
  parking_obstacle_lines(object)

  parking_node_road_mapping(object)
  parking_roads(object)

  parking_parkings(object)
end

function osm2pgsql.process_relation(object)
  parking_separate_parking_areas(object)
  parking_obstacle_areas(object)
  off_street_parking_areas(object)
end
