local places_nodes = require('topics.places.places_nodes')
local places_ways = require('topics.places.places_ways')
local places_relations = require('topics.places.places_relations')

function osm2pgsql.process_node(object)
  places_nodes(object)
end

function osm2pgsql.process_way(object)
  places_ways(object)
end

function osm2pgsql.process_relation(object)
  places_relations(object)
end
