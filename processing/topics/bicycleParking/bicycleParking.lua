local bicycle_parking_nodes = require('topics.bicycleParking.bicycle_parking_nodes')
local bicycle_parking_ways = require('topics.bicycleParking.bicycle_parking_ways')

function osm2pgsql.process_node(object)
  bicycle_parking_nodes(object)
end

function osm2pgsql.process_way(object)
  bicycle_parking_ways(object)
end
