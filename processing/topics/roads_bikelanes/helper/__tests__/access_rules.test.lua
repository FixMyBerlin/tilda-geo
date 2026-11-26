-- Decision table for access tags in roads_bikelanes: which public tables a way ends up in.
--
-- This is the spec, not a test of one helper. A refactor of the access helpers changes only
-- `outcome()` below and must keep every row green. Changing a row is a product decision: give the
-- reason in the commit message.
--
-- Columns:
-- - `bikelanes`: the way is in `bikelanes` (`in_bikelanes`): bikelane rows, todos, presence,
--   bikelane routing edges
-- - `roads`: the way also gets a `roads` / `roadsPathClasses` row
-- - `routing`: the way also gets its carriageway or path routing edge
--
-- Rules:
-- - Values are mapped first (`transform_access_values`): `unknown` and `optional_sidepath` read as no
--   tag, `official` as `designated`, `military` as `no`, `residents` as `private`, a list as its most
--   open value.
-- - `access` (or `foot` on a footway) in `no|private|delivery|permit` drops the way,
--   `destination|customers` drops only the `roads` row.
-- - `bicycle=designated` (resolved via `bicycle`, `vehicle`, `access`) lifts every one of these values.
-- - On a bicycle road (`bicycle_road=yes`, or `traffic_sign=DE:244*` unless `bicycle_road=no`) without a `bicycle` tag,
--   `bicycle` is `designated`: `access=destination` or `vehicle=destination` there is „Anlieger frei“
--   for motor vehicles. An explicit `bicycle=*` wins.
-- - `yes`, `permissive`, `discouraged` and `dismount` lift `no`, `destination` and `customers`, not
--   `private|delivery|permit`.
-- - `use_sidepath` lifts nothing: like `cycleway=separate` it points to a
--   path next to the way.
-- - `bicycle=no` on a cycleway always drops the way; nothing lifts it.
-- - `bicycle=mtb` (mountain bike trail, not everyday cycling) always drops the way.
-- - `vehicle`, `motor_vehicle` and `bicycle` on other ways never drop a way or its `roads` row:
--   `access=private` drops the way, `vehicle=private` keeps it with `access_bicycle=private`.
-- - `service` (except `alley`), `indoor=yes` and `informal=yes` are lifted by bike infrastructure of the
--   way itself after the categorisation; see `access_restriction.test.lua`.
-- - `motorroad=yes` (Kraftfahrstraße) and motorway/trunk keep their `roads` row but get no
--   carriageway routing edge, whatever `bicycle` says. Bike infrastructure tagged on the way
--   (`cycleway:*=track|lane`) keeps its own lane edge; see `inclusion_rules.test.lua`.
-- - Temporary closures (`access=no` with Baustelle/Sperrung text) are lifecycle, not access:
--   `transform_lifecycle_tags` runs first, see `exit_processing.test.lua`.

local exit_processing = require('topics.roads_bikelanes.helper.exit_processing')
local transform_access_values = require('topics.roads_bikelanes.helper.transform_tags.transform_access_values')
local ACCESS = require('topics.roads_bikelanes.helper.access_restriction')
local inclusion_rules = require('topics.roads_bikelanes.routing_infra.inclusion_rules')

---@param tags OsmTags
---@return { bikelanes: boolean, roads: boolean, routing: boolean }
local function outcome(tags)
  if exit_processing(tags) then return { bikelanes = false, roads = false, routing = false } end
  transform_access_values(tags)
  local access = ACCESS.decide(tags)
  return {
    bikelanes = access.in_bikelanes,
    roads = access.in_roads,
    routing = access.in_roads and not inclusion_rules.cycling_prohibited_road(tags),
  }
end

local ALL = { bikelanes = true, roads = true, routing = true }
local NOT_ROUTED = { bikelanes = true, roads = true, routing = false }
local BIKELANES_ONLY = { bikelanes = true, roads = false, routing = false }
local NONE = { bikelanes = false, roads = false, routing = false }

local rows = {
  -- No access tags
  { 'plain residential', { highway = 'residential' }, ALL },
  { 'plain path', { highway = 'path' }, ALL },

  -- access=no
  { 'access=no', { highway = 'residential', access = 'no' }, NONE },
  { 'access=no + motor_vehicle=yes (bicycle resolves to no)', { highway = 'residential', access = 'no', motor_vehicle = 'yes' }, NONE },
  { 'access=no + bicycle=no', { highway = 'residential', access = 'no', bicycle = 'no' }, NONE },
  { 'access=no + vehicle=no', { highway = 'residential', access = 'no', vehicle = 'no' }, NONE },
  { 'access=no + bicycle=unknown', { highway = 'residential', access = 'no', bicycle = 'unknown' }, NONE },
  { 'access=no + bicycle=unknown (read as no tag)', { highway = 'track', access = 'no', bicycle = 'unknown' }, NONE },
  { 'bicycle=mtb trail', { highway = 'path', bicycle = 'mtb', foot = 'yes' }, NONE },
  { 'bicycle=mtb on a track with access=yes', { highway = 'track', access = 'yes', bicycle = 'mtb' }, NONE },
  { 'access=unknown (read as no tag)', { highway = 'track', access = 'unknown' }, ALL },
  { 'access=military (read as no)', { highway = 'track', access = 'military' }, NONE },
  { 'access=military + bicycle=yes', { highway = 'track', access = 'military', bicycle = 'yes' }, ALL },
  { 'access=residents (read as private)', { highway = 'service', access = 'residents' }, NONE },
  { 'access=residents + bicycle=designated', { highway = 'residential', access = 'residents', bicycle = 'designated' }, ALL },
  { 'vehicle=private keeps the way', { highway = 'residential', vehicle = 'private' }, ALL },
  { 'access=no + bicycle=private', { highway = 'residential', access = 'no', bicycle = 'private' }, NONE },
  { 'Fahrradstraße access=no + bicycle=designated', { highway = 'residential', bicycle_road = 'yes', access = 'no', bicycle = 'designated', foot = 'yes', motor_vehicle = 'yes' }, ALL },
  { 'path access=no + bicycle=designated + foot=designated (radinfra#15)', { highway = 'path', access = 'no', bicycle = 'designated', foot = 'designated' }, ALL },
  { 'track access=no + bicycle=yes', { highway = 'track', access = 'no', bicycle = 'yes', foot = 'yes' }, ALL },
  { 'access=no + vehicle=yes', { highway = 'unclassified', access = 'no', vehicle = 'yes' }, ALL },
  { 'access=no + bicycle=permissive', { highway = 'track', access = 'no', bicycle = 'permissive' }, ALL },
  { 'access=no + bicycle=dismount', { highway = 'footway', access = 'no', bicycle = 'dismount' }, ALL },
  { 'access=no + bicycle=use_sidepath (closed road at a construction site)', { highway = 'tertiary', access = 'no', bicycle = 'use_sidepath', foot = 'use_sidepath' }, NONE },
  { 'access=no + bicycle=optional_sidepath (read as no tag)', { highway = 'secondary', access = 'no', bicycle = 'optional_sidepath' }, NONE },

  -- foot on footways
  { 'footway foot=no', { highway = 'footway', foot = 'no' }, NONE },
  { 'footway foot=no + bicycle=designated', { highway = 'footway', foot = 'no', bicycle = 'designated' }, ALL },
  { 'footway foot=no + bicycle=yes', { highway = 'footway', foot = 'no', bicycle = 'yes' }, ALL },
  { 'footway foot=private + bicycle=designated', { highway = 'footway', foot = 'private', bicycle = 'designated' }, ALL },
  { 'footway foot=private + bicycle=yes', { highway = 'footway', foot = 'private', bicycle = 'yes' }, NONE },
  { 'footway foot=destination', { highway = 'footway', foot = 'destination' }, BIKELANES_ONLY },
  { 'footway foot=destination + bicycle=dismount', { highway = 'footway', foot = 'destination', bicycle = 'dismount' }, ALL },

  -- bicycle on cycleways
  { 'cycleway bicycle=no', { highway = 'cycleway', bicycle = 'no' }, NONE },
  { 'cycleway access=no + bicycle=no', { highway = 'cycleway', access = 'no', bicycle = 'no' }, NONE },
  { 'cycleway access=no + bicycle=designated', { highway = 'cycleway', access = 'no', bicycle = 'designated' }, ALL },
  { 'cycleway bicycle=private', { highway = 'cycleway', bicycle = 'private' }, NONE },

  -- private / delivery / permit: only bicycle=designated lifts them
  { 'access=private', { highway = 'service', access = 'private' }, NONE },
  { 'access=private + bicycle=yes (private service way)', { highway = 'service', access = 'private', bicycle = 'yes', foot = 'yes' }, NONE },
  { 'access=private + bicycle=permissive', { highway = 'track', access = 'private', bicycle = 'permissive' }, NONE },
  { 'access=private + bicycle=designated + DE:240', { highway = 'path', access = 'private', bicycle = 'designated', foot = 'designated', traffic_sign = 'DE:240' }, ALL },
  { 'access=delivery + bicycle=yes', { highway = 'residential', access = 'delivery', bicycle = 'yes' }, NONE },
  { 'access=delivery + bicycle=designated + DE:240', { highway = 'path', access = 'delivery', bicycle = 'designated', foot = 'designated', traffic_sign = 'DE:240' }, ALL },
  { 'access=permit + bicycle=yes', { highway = 'service', access = 'permit', bicycle = 'yes' }, NONE },
  { 'access=permit + bicycle=designated', { highway = 'track', access = 'permit', bicycle = 'designated' }, ALL },
  { 'access=private + vehicle=designated', { highway = 'path', access = 'private', vehicle = 'designated' }, ALL },

  -- destination / customers: drop only the roads row, any cycling permission lifts them
  { 'access=destination', { highway = 'residential', access = 'destination' }, BIKELANES_ONLY },
  { 'access=customers', { highway = 'service', access = 'customers' }, BIKELANES_ONLY },
  { 'access=destination + bicycle=yes', { highway = 'residential', access = 'destination', bicycle = 'yes' }, ALL },
  { 'access=destination + bicycle=designated + DE:240', { highway = 'path', access = 'destination', bicycle = 'designated', foot = 'designated', traffic_sign = 'DE:240' }, ALL },
  { 'access=customers + bicycle=permissive', { highway = 'service', access = 'customers', bicycle = 'permissive' }, ALL },
  { 'access=destination + bicycle=no', { highway = 'residential', access = 'destination', bicycle = 'no' }, BIKELANES_ONLY },
  { 'access=destination + bicycle=use_sidepath', { highway = 'residential', access = 'destination', bicycle = 'use_sidepath' }, BIKELANES_ONLY },

  -- Bicycle roads: no `bicycle` tag reads as `bicycle=designated`
  { 'Fahrradstraße access=destination (Anlieger frei)', { highway = 'residential', bicycle_road = 'yes', access = 'destination' }, ALL },
  { 'Fahrradstraße access=no', { highway = 'residential', bicycle_road = 'yes', access = 'no' }, ALL },
  { 'Fahrradstraße access=agricultural', { highway = 'track', bicycle_road = 'yes', access = 'agricultural' }, ALL },
  { 'traffic_sign=DE:244.1,1020-30 + access=destination, no bicycle_road', { highway = 'residential', traffic_sign = 'DE:244.1,1020-30', access = 'destination' }, ALL },
  { 'Fahrradzone DE:244.3 + access=destination', { highway = 'residential', traffic_sign = 'DE:244.3', access = 'destination' }, ALL },
  { 'bicycle_road=no + DE:244.1 + access=destination (explicit no wins over the sign)', { highway = 'residential', bicycle_road = 'no', traffic_sign = 'DE:244.1', access = 'destination' }, BIKELANES_ONLY },
  { 'Fahrradstraße access=destination + bicycle=no (explicit tag wins)', { highway = 'residential', bicycle_road = 'yes', access = 'destination', bicycle = 'no' }, BIKELANES_ONLY },

  -- Motor roads: no carriageway edge in routing
  { 'motorway', { highway = 'motorway' }, NOT_ROUTED },
  { 'trunk', { highway = 'trunk', motorroad = 'yes' }, NOT_ROUTED },
  { 'primary motorroad=yes (Kraftfahrstraße)', { highway = 'primary', motorroad = 'yes' }, NOT_ROUTED },
  { 'primary motorroad=yes + bicycle=yes (mapping error)', { highway = 'primary', motorroad = 'yes', bicycle = 'yes' }, NOT_ROUTED },
  { 'primary motorroad=yes + cycleway:right=track (the lane keeps its edge)', { highway = 'primary', motorroad = 'yes', ['cycleway:right'] = 'track' }, NOT_ROUTED },
}

describe('access rules (decision table)', function()
  for _, row in ipairs(rows) do
    local name, tags, expected = row[1], row[2], row[3]
    it(name, function()
      assert.are.same(expected, outcome(tags))
    end)
  end
end)
