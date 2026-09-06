local is_highway_area = require('topics.roads_bikelanes.highway_areas.is_highway_area')
local process_highway_area = require('topics.roads_bikelanes.roads_bikelanes_highway_areas')
local process_roads_bikelanes_way = require('topics.roads_bikelanes.roads_bikelanes_ways')

function osm2pgsql.process_way(object)
  if is_highway_area(object) then
    process_highway_area(object)
    return
  end
  process_roads_bikelanes_way(object)
end

function osm2pgsql.process_relation(object)
  process_highway_area(object)
end
