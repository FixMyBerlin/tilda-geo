local poi_classification_nodes = require('topics.poiClassification.poi_classification_nodes')
local poi_classification_ways = require('topics.poiClassification.poi_classification_ways')
local poi_classification_relations = require('topics.poiClassification.poi_classification_relations')

function osm2pgsql.process_node(object)
  poi_classification_nodes(object)
end

function osm2pgsql.process_way(object)
  poi_classification_ways(object)
end

function osm2pgsql.process_relation(object)
  poi_classification_relations(object)
end
