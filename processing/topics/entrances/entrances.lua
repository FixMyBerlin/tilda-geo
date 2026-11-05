-- Entrypoint for the `entrances` topic: building entrances and public transport entrances as one
-- point table (`entrances`), told apart by `tags.category` (see entrance_nodes.lua).
local entrance_nodes = require('topics.entrances.entrance_nodes')

function osm2pgsql.process_node(object)
  entrance_nodes(object)
end

-- No process_way / process_relation for entrances: entrances are nodes (vertices of building
-- outlines or standalone station entrance nodes).
