require('init')
local parking_obstacle_areas = require("parking_obstacle_areas")
local parking_obstacle_lines = require("parking_obstacle_lines")
local parking_obstacle_points = require("parking_obstacle_points")
local parking_crossing_points = require("parking_crossing_points")
local off_street_parking_points = require("off_street_parking_points")
local off_street_parking_areas = require("off_street_parking_areas")
require("parking_parkings")
require("parking_node_road_mapping")
require("parking_roads")
require("Log")

-- NOTE ON PROJECTIONS:
-- All `paring_*` tables use EPSG:5243
--  which is optimized for Germany and uses Meters
--  https://spatialreference.org/ref/epsg/5243/

function osm2pgsql.process_node(object)
  parking_crossing_points(object)
  parking_obstacle_points(object)

  off_street_parking_points(object)
end

function osm2pgsql.process_way(object)
  parking_obstacle_areas(object)

  parking_obstacle_lines(object)

  parking_node_road_mapping(object)
  parking_roads(object)

  parking_parkings(object)

  off_street_parking_areas(object)
end

function osm2pgsql.process_relation(object)
  parking_obstacle_areas(object)
  off_street_parking_areas(object)
end
