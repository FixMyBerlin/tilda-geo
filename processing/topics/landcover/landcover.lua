-- Entrypoint for the `landcover` topic (a weekend topic — see README.md).
-- One osm2pgsql pass that delegates to per-dataset area handlers, so the topic can produce
-- several tables from one pass:
--   - landuse           -> `landuse` (land use display table)
--   - settlement_source -> `_settlement_source_areas` (settlement_areas/dissolve.sql dissolves it)
--   - buildings         -> `_buildings` (processing-only; buildings/filter.sql filters it)
--   - buildings_train_station -> `_buildings_train_station` (processing-only; ÖPNV score input)
local landuse = require('topics.landcover.landuse.landuse')
local settlement_source = require('topics.landcover.settlement_areas.settlement_source')
local buildings = require('topics.landcover.buildings.buildings')
local buildings_train_station = require('topics.landcover.buildings.buildings_train_station')

-- No process_node for landcover: this topic has no point output contract.

-- The entrypoint owns geometry eligibility (which objects are areas): closed ways and
-- multipolygon relations. Each handler does only its own tag filter + insert.
function osm2pgsql.process_way(object)
  if object.is_closed then
    landuse(object)
    settlement_source(object)
    buildings(object)
    buildings_train_station(object)
  end
end

function osm2pgsql.process_relation(object)
  if object.tags.type == 'multipolygon' then
    landuse(object)
    settlement_source(object)
    buildings(object)
    buildings_train_station(object)
  end
end
