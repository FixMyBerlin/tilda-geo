local nodes = require('topics.trafficSigns.nodes')
local ways = require('topics.trafficSigns.ways')

function osm2pgsql.process_node(object)
  nodes(object)
end

function osm2pgsql.process_way(object)
  ways(object)
end
