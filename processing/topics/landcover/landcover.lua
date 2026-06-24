-- Entrypoint for the `landcover` topic (a weekend topic — see README.md).
-- One osm2pgsql pass that delegates to per-dataset area handlers, so the topic can produce
-- several tables from one pass:
--   - settlement_source -> `_settlement_source_areas` (settlement_areas/dissolve.sql dissolves it)
local settlement_source = require('topics.landcover.settlement_areas.settlement_source')

-- No process_node for landcover: this topic has no point output contract.

-- The entrypoint owns geometry eligibility (which objects are areas): closed ways and
-- multipolygon relations. Each handler does only its own tag filter + insert.
function osm2pgsql.process_way(object)
  if object.is_closed then
    settlement_source(object)
  end
end

function osm2pgsql.process_relation(object)
  if object.tags.type == 'multipolygon' then
    settlement_source(object)
  end
end
