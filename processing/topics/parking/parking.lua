local parking_separate_parking_areas = require('topics.parking.separate_parkings.parking_separate_parking_areas')
local obstacle_areas = require('topics.parking.obstacles.obstacle_areas')
local obstacle_lines = require('topics.parking.obstacles.obstacle_lines')
local parking_separate_parking_points = require('topics.parking.separate_parkings.parking_separate_parking_points')
local obstacle_points = require('topics.parking.obstacles.obstacle_points')
local crossing_points = require('topics.parking.crossings.crossing_points')
local crossing_lines = require('topics.parking.crossings.crossing_lines')
local off_street_parking_points = require('topics.parking.off_street_parking.off_street_parking_points')
local off_street_parking_areas = require('topics.parking.off_street_parking.off_street_parking_areas')
local public_transport = require('topics.parking.public_transport.public_transport')
local parking_parkings = require('topics.parking.parkings.parking_parkings')
local parking_node_road_mapping = require('topics.parking.roads.parking_node_road_mapping')
local parking_roads = require('topics.parking.roads.parking_roads')
local log = require('topics.helper.log')
local parking_scaffold_tables = require('topics.parking.parkings.parking_scaffold_tables')

-- NOTE ON PROJECTIONS:
-- All `_paring_*` tables use EPSG:5243
--  which is optimized for Germany and uses Meters
--  https://spatialreference.org/ref/epsg/5243/

function osm2pgsql.process_node(object)
  crossing_points(object)
  parking_separate_parking_points(object)
  obstacle_points(object)
  public_transport.parking_public_transport_stops(object)

  off_street_parking_points(object)
end

function osm2pgsql.process_way(object)
  parking_separate_parking_areas(object)
  obstacle_areas(object)
  off_street_parking_areas(object)

  crossing_lines(object)
  obstacle_lines(object)
  public_transport.parking_platform_lines(object)

  parking_node_road_mapping(object)
  parking_roads(object)

  parking_parkings(object)
end

function osm2pgsql.process_relation(object)
  parking_separate_parking_areas(object)
  obstacle_areas(object)
  off_street_parking_areas(object)
end
