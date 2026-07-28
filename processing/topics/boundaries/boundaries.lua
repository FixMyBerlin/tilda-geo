local boundaries_relations = require('topics.boundaries.boundaries_relations')

-- No process_node/process_way for boundaries: this topic only outputs administrative boundary relations.

function osm2pgsql.process_relation(object)
  boundaries_relations(object)
end
