require('init')
local traffic_signs_nodes = require('traffic_signs_nodes')
local traffic_signs_ways = require('traffic_signs_ways')

function osm2pgsql.process_node(object)
  traffic_signs_nodes(object)
end

function osm2pgsql.process_way(object)
  traffic_signs_ways(object)
end
