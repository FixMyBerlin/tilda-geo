local barrier_lines = require('topics.barriers.barrier_lines')
local barrier_areas = require('topics.barriers.barrier_areas')

-- No process_node for barriers: this topic has no point output contract, so no noop helper file is used.

function osm2pgsql.process_way(object)
  if object.is_closed then
    barrier_areas(object)
    return
  end
  barrier_lines(object)
end

function osm2pgsql.process_relation(object)
  barrier_areas(object)
end
