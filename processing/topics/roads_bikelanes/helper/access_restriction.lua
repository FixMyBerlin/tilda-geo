local SET = require('topics.helper.sets')
local contains_substring = require('topics.helper.contains_substring')
local has_prefix = require('topics.helper.has_prefix')
local has_tag_with_prefix = require('topics.helper.has_tag_with_prefix')
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')

-- The one place that decides which ways are not public, and why. Tags only, no geometry: this
-- runs for every `highway` way, so keep it cheap and allocation-free for public ways. Do not copy
-- these value lists anywhere else. Only `access=no` is decided earlier, in `exit_processing`.
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

-- `access` / `foot` / `bicycle` values that take the way out of all public tables, unless the way is a
-- signposted cycle route (`bicycle=designated`). `bicycle=yes` does not lift them: `access=private +
-- bicycle=yes` is mostly a private service way.
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

--- Restriction from the access tags only (`access`, and `foot` / `bicycle` on the highway classes
--- named there). These are never lifted by bike infrastructure.
---@param tags OsmTags
---@return AccessRestriction|nil
local function access_tag_restriction(tags)
  local key, value = find_access_value(tags, way_access)
  if key and not sanitize_access_tags.bicycle_designated(tags) then
    return { level = 'way', reason = key .. '=' .. value, may_have_bike_infra = false }
  end

  key, value = find_access_value(tags, roads_access)
  if key then
    -- `bicycle=yes` & co. on an `access=destination` way: cycling is explicitly allowed, so the
    -- way is public (and has a `roads` row for the routing edge to join).
    if sanitize_access_tags.bicycle_explicitly_allowed(tags) then
      return nil
    end
    return { level = 'roads', reason = key .. '=' .. value, may_have_bike_infra = false }
  end

  return nil
end

-- `highway=service + service=<value>`: every value except `alley` is not public. Mainly:
-- - `driveway`: implicitly private
-- - `parking_aisle`: not part of the road network (a connecting road needs a plain `highway=service`)
-- - `emergency_access`: a special kind of driveway
-- - `drive-through`: not part of the road network, and false positives in the oneway layer
--
-- Exception: a signposted cycle route (`bicycle=designated`) is part of the bicycle network even
-- without a bikelane category. Any other bike infrastructure lifts the restriction in stage 3
-- (`after_categorisation`).
local allowed_service = SET.set({ 'alley' })

---@param tags OsmTags
---@return boolean
local function is_restricted_service(tags)
  local service = tags.service
  if not service or allowed_service[service] then return false end
  return not sanitize_access_tags.bicycle_designated(tags)
end

-- Traffic signs of bikelane categories that can match on any `highway` class. Matched as a
-- substring, like the categories do, so `244` also finds `DE:244.1`.
local bike_traffic_signs = {
  '237', -- Zeichen 237 (Radweg) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:237
  '239', -- Zeichen 239 (Gehweg) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:239
  '240', -- Zeichen 240 (Gemeinsamer Geh- und Radweg) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:240
  '241', -- Zeichen 241 (Getrennter Rad- und Gehweg) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:241
  '242', -- Zeichen 242.1 (Beginn Fußgängerzone) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:242.1
  '244', -- Zeichen 244.1 (Beginn Fahrradstraße) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:244.1
  '1022', -- Zeichen 1022-10 (Radfahrer frei) https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:1022-10
}

---@param traffic_sign string|nil
---@return boolean
local function has_bike_traffic_sign(traffic_sign)
  for _, sign in ipairs(bike_traffic_signs) do
    if contains_substring(traffic_sign, sign) then return true end
  end
  return false
end

--- `sidewalk*` is unnested into a footway side object (`bikelanes/transformations.lua`) that only gets
--- a category through its own bicycle or traffic sign value (`sidewalk:both:bicycle`, …).
---@param tags OsmTags
---@return boolean
local function has_sidewalk_bike_tag(tags)
  for key in pairs(tags) do
    if has_prefix(key, 'sidewalk') and (contains_substring(key, ':bicycle') or contains_substring(key, ':traffic_sign')) then
      return true
    end
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
  if has_bike_traffic_sign(tags.traffic_sign)
    or has_bike_traffic_sign(tags['traffic_sign:forward'])
    or has_bike_traffic_sign(tags['traffic_sign:backward'])
  then
    return true
  end
  -- `bicycle:lanes=…|designated|…`: a bike lane between the motor vehicle lanes.
  if tags['bicycle:lanes'] then return true end
  -- Centerline keys of all sides (`cycleway`, `cycleway:right`, `cycleway:left:traffic_sign`, …).
  if has_tag_with_prefix(tags, 'cycleway') then return true end
  return has_sidewalk_bike_tag(tags)
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
