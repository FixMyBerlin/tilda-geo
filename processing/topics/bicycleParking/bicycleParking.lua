local bicycle_parking_nodes = require('topics.bicycleParking.bicycle_parking_nodes')
local bicycle_parking_ways = require('topics.bicycleParking.bicycle_parking_ways')
local bicycle_rental = require('topics.bicycleParking.bicycle_rental')

function osm2pgsql.process_node(object)
  bicycle_parking_nodes(object)
  bicycle_rental(object)
end

function osm2pgsql.process_way(object)
  bicycle_parking_ways(object)
  bicycle_rental(object)
end

-- Only for bike sharing / rental: bicycle parking has no relation handler.
function osm2pgsql.process_relation(object)
  if object.tags.type == 'multipolygon' then
    bicycle_rental(object)
  end
end
