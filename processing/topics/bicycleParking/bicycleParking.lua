local bicycle_parking_nodes = require('topics.bicycleParking.bicycle_parking_nodes')
local bicycle_parking_ways = require('topics.bicycleParking.bicycle_parking_ways')
local bicycle_parking_relations = require('topics.bicycleParking.bicycle_parking_relations')

function osm2pgsql.process_node(object)
  bicycle_parking_nodes(object)
end

function osm2pgsql.process_way(object)
  bicycle_parking_ways(object)
end

function osm2pgsql.process_relation(object)
  bicycle_parking_relations(object)
end
