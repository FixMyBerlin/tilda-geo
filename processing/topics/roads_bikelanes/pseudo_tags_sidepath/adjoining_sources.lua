-- What OSM `is_sidepath:of` says versus what the previous-run sidepath CSV sniffed.
-- Published `adjoining_*` is decided in `adjoining_context.lua`. The conflict todo reads the same
-- sources so it cannot drift from the published value.

local path_is_crossing = require('topics.roads_bikelanes.pseudo_tags_sidepath.path_is_crossing')
local road_classification_road_value = require('topics.roads_bikelanes.roads.road_classification_road_value')
local SET = require('topics.helper.sets')

-- Motor-road classes from `roads.road` that `adjoining_road` may carry (the danger comes from
-- motor traffic). KEEP IN SYNC with topic-docs/roads_bikelanes/roads.yaml `road` values and
-- with the `_sidepath_estimation_roads` IN list in run_is_sidepath_estimation.sql (the CSV
-- side is a subset of this). Path classes are left out on purpose: OSM `is_sidepath:of=cycleway`
-- does not name a motor road. `trunk` / `trunk_link` are dropped (rare next to published bike
-- infra; not in `roads.road`).
local MOTOR_ROAD_VALUES = SET.set({
  'living_street',
  'motorway_link',
  'motorway',
  'pedestrian',
  'primary_link',
  'primary',
  'residential',
  'residential_priority_road',
  'secondary_link',
  'secondary',
  'service_alley',
  'service_driveway',
  'service_emergency_access',
  'service_parking_aisle',
  'service_road',
  'service_uncategorized',
  'tertiary_link',
  'tertiary',
  'unclassified',
  'unspecified_road',
})

--- Map OSM `is_sidepath:of` (a highway class, no sub-tags) onto TILDA `roads.road`.
--- Typos, street names, path classes, and trunk drop to nil.
---@param value string|nil
---@return string|nil
local function sanitize_is_sidepath_of(value)
  if value == nil then
    return nil
  end
  local mapped = road_classification_road_value({ highway = value })
  if mapped and MOTOR_ROAD_VALUES[mapped] then
    return mapped
  end
  return nil
end

---@class AdjoiningSources
---@field of_mapped string|nil usable `is_sidepath:of` as a `roads.road` value
---@field csv_road string|nil previous-run CSV `adjoining_road` (already `roads.road`)
---@field csv_maxspeed number|nil CSV maxspeed for `csv_road` only
---@field is_crossing boolean

--- Read both inputs. Does not choose a winner and does not apply Fahrradstraße skips.
---@param object_tags OsmTags
---@param tags OsmTags
---@return AdjoiningSources
local function read_adjoining_sources(object_tags, tags)
  local csv_road = object_tags._sidepath_adjoining_road
  if not (csv_road and MOTOR_ROAD_VALUES[csv_road]) then
    csv_road = nil
  end

  return {
    of_mapped = sanitize_is_sidepath_of(tags['is_sidepath:of']),
    csv_road = csv_road,
    csv_maxspeed = tonumber(object_tags._sidepath_adjoining_maxspeed),
    is_crossing = path_is_crossing(object_tags) or path_is_crossing(tags),
  }
end

return {
  read_adjoining_sources = read_adjoining_sources,
  sanitize_is_sidepath_of = sanitize_is_sidepath_of,
}
