require('init')
local bikeroutes_relations = require('bikeroutes_relations')

-- No process_node/process_way for bikeroutes: this topic only outputs bicycle route relations.

function osm2pgsql.process_relation(object)
  bikeroutes_relations(object)
end
