-- Decision table for access tags in roads_bikelanes: which public tables a way ends up in.
--
-- This is the spec, not a test of one helper. A refactor of the access helpers (e.g.
-- `priv/routing-restricted` with `access_restriction.lua`) changes only `outcome()` below and
-- must keep every row green. Changing a row is a product decision: link the issue in the row.
--
-- Columns:
-- - `bikelanes`: the way is processed at all (`exit_processing`): bikelanes, todos, presence,
--   bikelane routing edges
-- - `roads`: the way also gets a `roads` / `roadsPathClasses` row and its carriageway or path
--   routing edge
--
-- Rules (https://github.com/FixMyBerlin/tilda-geo/issues/409,
-- https://github.com/FixMyBerlin/radinfra.de/issues/15):
-- - `access` (or `foot` on a footway) in `no|private|delivery|permit` drops the way,
--   `destination|customers` drops only the `roads` row.
-- - `bicycle=designated` (resolved via `bicycle`, `vehicle`) lifts every one of these values.
-- - Any other value that allows cycling (`yes`, `permissive`, `dismount`, `use_sidepath`, …) lifts
--   `no`, `destination` and `customers`, not `private|delivery|permit`.
-- - `bicycle=no` on a cycleway always drops the way; nothing lifts it.
-- - Temporary closures (`access=no` with Baustelle/Sperrung text) are lifecycle, not access:
--   `transform_lifecycle_tags` runs first, see `exit_processing.test.lua`.

local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local ACCESS = require('topics.roads_bikelanes.helper.access_restriction')

---@param tags OsmTags
---@return { bikelanes: boolean, roads: boolean }
local function outcome(tags)
  if EXIT.exit_processing(tags) then return { bikelanes = false, roads = false } end
  local restriction = ACCESS.access_restriction(tags)
  local bikelanes = not (restriction and restriction.level == 'way')
  return { bikelanes = bikelanes, roads = bikelanes and not (restriction and restriction.level == 'roads') }
end

local ALL = { bikelanes = true, roads = true }
local BIKELANES_ONLY = { bikelanes = true, roads = false }
local NONE = { bikelanes = false, roads = false }

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
  { 'access=no + bicycle=private', { highway = 'residential', access = 'no', bicycle = 'private' }, NONE },
  { 'Fahrradstraße access=no + bicycle=designated (#409, way 1212226034)', { highway = 'residential', bicycle_road = 'yes', access = 'no', bicycle = 'designated', foot = 'yes', motor_vehicle = 'yes' }, ALL },
  { 'path access=no + bicycle=designated + foot=designated (radinfra#15)', { highway = 'path', access = 'no', bicycle = 'designated', foot = 'designated' }, ALL },
  { 'track access=no + bicycle=yes', { highway = 'track', access = 'no', bicycle = 'yes', foot = 'yes' }, ALL },
  { 'access=no + vehicle=yes', { highway = 'unclassified', access = 'no', vehicle = 'yes' }, ALL },
  { 'access=no + bicycle=permissive', { highway = 'track', access = 'no', bicycle = 'permissive' }, ALL },
  { 'access=no + bicycle=dismount', { highway = 'footway', access = 'no', bicycle = 'dismount' }, ALL },
  { 'access=no + bicycle=use_sidepath', { highway = 'tertiary', access = 'no', bicycle = 'use_sidepath', motor_vehicle = 'yes' }, ALL },

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
}

describe('access rules (decision table)', function()
  for _, row in ipairs(rows) do
    local name, tags, expected = row[1], row[2], row[3]
    it(name, function()
      assert.are.same(expected, outcome(tags))
    end)
  end
end)
