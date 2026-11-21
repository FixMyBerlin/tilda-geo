local SET = require('topics.helper.sets')
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')

-- The one place that decides which ways are not public, and why. Tags only, no geometry: this
-- runs for every `highway` way, so keep it cheap and allocation-free for public ways.
--
-- Callers:
-- - `roads_bikelanes_ways.lua` / `roads_bikelanes_highway_areas.lua` (right after `exit_processing`)
-- - `roads_bikelanes_roads.lua` and `routing_infra/build_segments.lua` read `context.restriction`
-- Do not copy these value lists anywhere else. `access=no` (and `foot=no` on footways,
-- `bicycle=no` on cycleways) is decided in `exit_processing`: temporary closures are turned into
-- `lifecycle` by `transform_lifecycle_tags` before, what stays is permanent.
--
-- Levels, strongest first:
-- - `way`:     no public row at all (bikelanes, roads, roadsPathClasses, routing, sidepath source
--              paths, todos, presence, errors)
-- - `roads`:   bikelane rows and their routing edges stay; no roads / roadsPathClasses row and no
--              carriageway / path routing edge (it would have no row to join)
--
-- A way whose resolved `bicycle` access does not allow cycling (`bicycle=no`, `vehicle=private`, …) is
-- not restricted here: all its rows and edges are public, routers read `access_bicycle` on the edge.

---@alias RestrictionLevel 'way'|'roads'

---@class AccessRestriction
---@field level RestrictionLevel
---@field reason string the tag that caused it, e.g. `access=destination`
---@field may_have_bike_infra boolean tag hint, only set for reasons that own bike infrastructure can lift (`service`, `indoor`, `informal`)

-- `access` / `foot` / `bicycle` values that take the way out of all public tables.
local way_access = SET.set({ 'private', 'delivery', 'permit' })

-- Values that only take it out of `roads` / `roadsPathClasses`, unless bicycle is explicitly allowed.
local roads_access = SET.set({ 'destination', 'customers' })

---@param tags OsmTags
---@param values table<string, boolean>
---@return string|nil key
---@return string|nil value
local function find_access_value(tags, values)
  local value = tags.access
  if value and values[value] then return 'access', value end
  if tags.highway == 'footway' then
    value = tags.foot
    if value and values[value] then return 'foot', value end
  end
  if tags.highway == 'cycleway' then
    value = tags.bicycle
    if value and values[value] then return 'bicycle', value end
  end
  return nil, nil
end

---@param tags OsmTags
---@return boolean
local function bicycle_explicitly_allowed(tags)
  local value = sanitize_access_tags.normalize((sanitize_access_tags.resolve(tags, 'bicycle')))
  return value ~= nil and sanitize_access_tags.routable_bicycle_access[value] == true
end

--- Restriction from the access tags only (`access`, and `foot` / `bicycle` on the highway classes
--- named there). These are never lifted by bike infrastructure.
---@param tags OsmTags
---@return AccessRestriction|nil
local function access_tag_restriction(tags)
  local key, value = find_access_value(tags, way_access)
  if key then
    return { level = 'way', reason = key .. '=' .. value, may_have_bike_infra = false }
  end

  key, value = find_access_value(tags, roads_access)
  if key then
    -- `bicycle=yes` & co. on an `access=destination` way: cycling is explicitly allowed, so the
    -- way is public (and has a `roads` row for the routing edge to join).
    if bicycle_explicitly_allowed(tags) then
      return nil
    end
    return { level = 'roads', reason = key .. '=' .. value, may_have_bike_infra = false }
  end

  return nil
end

-- `highway=service + service=<value>`: skip all values except `alley`. The key can have random
-- values, we mainly want to skip
-- - 'driveway' which we consider implicitly private
-- - 'parking_aisle' which we do not consider part of the road network (they need a regular service highway if other roads connect)
-- - 'emergency_access' which we consider a special kind of driveway
-- - 'drive-through' which we do not consider part of the road network; and which results in false positives for our oneway-plus layer
--
-- Exception: service highways with explicit bicycle access (`bicycle=designated`,
-- `bicycle:left|right|both` not `no`).
--
-- REMINDER: Keep this in sync with `processing/topics/roads_bikelanes/roads/road_classification_road_value.lua`
local allowed_service = SET.set({ 'alley' })

---@param tags OsmTags
---@return boolean
local function is_restricted_service(tags)
  local service = tags.service
  if not service or allowed_service[service] then return false end
  if tags.bicycle == 'designated' then return false end
  local left, right, both = tags['bicycle:left'], tags['bicycle:right'], tags['bicycle:both']
  if left and left ~= 'no' then return false end
  if right and right ~= 'no' then return false end
  if both and both ~= 'no' then return false end
  return true
end

-- `traffic_sign` values of bikelane categories that can match on any `highway` class.
local bike_traffic_signs = { '237', '239', '240', '241', '242', '244', '1022' }

---@param traffic_sign string|nil
---@return boolean
local function has_bike_traffic_sign(traffic_sign)
  if not traffic_sign then return false end
  for _, sign in ipairs(bike_traffic_signs) do
    if string.find(traffic_sign, sign, 1, true) then return true end
  end
  return false
end

--- Cheap hint that a bikelane category (`bikelanes/bikelane_categories.lua`) could match this
--- way. Generous on purpose: a false positive only costs the categorisation, a false negative
--- loses bike infrastructure. Whoever changes a category condition must keep this in sync; the
--- test in `__tests__/access_restriction.test.lua` fails if a category matches without a hint.
---
--- Not a hint on their own: `segregated` (every category needs a bicycle value or a sign next to
--- it, `segregated` + `cycleway` is covered by the `cycleway*` keys) and `sidewalk*` keys without
--- bicycle or sign info (`sidewalk=no`, `sidewalk:both=yes`, `sidewalk:left:surface`, …). Those
--- are on most driveways and parking aisles.
---@param tags OsmTags
---@return boolean
local function may_have_bike_infra(tags)
  local highway = tags.highway
  if highway == 'cycleway' then return true end
  local bicycle = tags.bicycle
  if bicycle == 'designated' then return true end
  if bicycle == 'yes' and (highway == 'footway' or highway == 'path' or highway == 'pedestrian') then return true end
  if bicycle == 'yes' and tags.segregated ~= nil then return true end -- footAndCyclewayShared / Segregated on any class
  if tags.bicycle_road == 'yes' then return true end
  if has_bike_traffic_sign(tags.traffic_sign) or has_bike_traffic_sign(tags['traffic_sign:forward']) then
    return true
  end
  for key in pairs(tags) do
    local prefix = string.sub(key, 1, 8)
    if prefix == 'cycleway' then return true end
    -- `sidewalk*` is unnested into a footway side object (`bikelanes/transformations.lua`) that only
    -- gets a category through its own bicycle or traffic_sign value (`sidewalk:both:bicycle`, …)
    if prefix == 'sidewalk' and (string.find(key, ':bicycle', 1, true) or string.find(key, ':traffic_sign', 1, true)) then
      return true
    end
    if prefix == 'bicycle:' then
      local rest = string.sub(key, 9)
      if rest == 'left' or rest == 'right' or rest == 'both' or rest == 'lanes' then return true end
    end
  end
  return false
end

--- Restriction that bike infrastructure of the way itself can lift.
---@param tags OsmTags
---@return AccessRestriction|nil
local function structural_restriction(tags)
  if is_restricted_service(tags) then
    return { level = 'way', reason = 'service=' .. tags.service, may_have_bike_infra = may_have_bike_infra(tags) }
  end
  if tags.indoor == 'yes' then
    return { level = 'roads', reason = 'indoor=yes', may_have_bike_infra = may_have_bike_infra(tags) }
  end
  if tags.informal == 'yes' then
    return { level = 'roads', reason = 'informal=yes', may_have_bike_infra = may_have_bike_infra(tags) }
  end
  return nil
end

--- `nil` is public. Precedence `way` > `roads`; the reason of the strongest wins.
--- Within a level, access tags come first because bike infrastructure cannot lift them.
---@param object_tags OsmTags
---@return AccessRestriction|nil
local function access_restriction(object_tags)
  local by_access = access_tag_restriction(object_tags)
  if by_access and by_access.level == 'way' then return by_access end

  local structural = structural_restriction(object_tags)
  if structural and structural.level == 'way' then return structural end

  return by_access or structural
end

--- Stage 3: does the way carry bike infrastructure of its own (any side)?
---@param cycleways table[] result of the bikelane categorisation
---@return boolean
local function has_own_bike_infra(cycleways)
  for _, cycleway in ipairs(cycleways) do
    if cycleway._infrastructureExists and cycleway.category then
      return true
    end
  end
  return false
end

--- Stage 3: after the bikelane categorisation, bike infrastructure lifts a `service` / `indoor` /
--- `informal` restriction. What is left are the restrictions of the access tags alone (e.g.
--- `access=destination` on a service way still drops its carriageway edge).
---@param restriction AccessRestriction|nil
---@param object_tags OsmTags
---@param cycleways table[]
---@return AccessRestriction|nil
local function after_categorisation(restriction, object_tags, cycleways)
  if not restriction or not restriction.may_have_bike_infra then return restriction end
  if not has_own_bike_infra(cycleways) then return restriction end
  return access_tag_restriction(object_tags)
end

return {
  access_restriction = access_restriction,
  may_have_bike_infra = may_have_bike_infra,
  has_own_bike_infra = has_own_bike_infra,
  after_categorisation = after_categorisation,
}
