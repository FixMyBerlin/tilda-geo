require('init')
local public_transport_nodes = require('public_transport_nodes')
local public_transport_ways = require('public_transport_ways')
local public_transport_relations = require('public_transport_relations')

function osm2pgsql.process_node(object)
  public_transport_nodes(object)
end

function osm2pgsql.process_way(object)
  public_transport_ways(object)
end

function osm2pgsql.process_relation(object)
  public_transport_relations(object)
end
