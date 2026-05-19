local landuse_ways = require('topics.landuse.landuse_ways')
local landuse_relations = require('topics.landuse.landuse_relations')

-- No process_node for landuse: this topic has no point output contract.

function osm2pgsql.process_way(object)
  landuse_ways(object)
end

function osm2pgsql.process_relation(object)
  landuse_relations(object)
end
