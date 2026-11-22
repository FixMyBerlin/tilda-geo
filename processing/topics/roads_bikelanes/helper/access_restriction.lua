local SET = require('topics.helper.sets')
local contains_substring = require('topics.helper.contains_substring')
local has_prefix = require('topics.helper.has_prefix')
local has_tag_with_prefix = require('topics.helper.has_tag_with_prefix')
local sanitize_access_tags = require('topics.roads_bikelanes.helper.sanitize_access_tags')

-- The one place that decides in which tables a way is, and why. Tags only, no geometry: this
-- runs for every `highway` way, so keep it cheap and allocation-free for public ways. Do not copy
-- these value lists anywhere else. Access values are already mapped by `transform_access_values`
-- (`unknown` = no tag, `military` = `no`, `residents` = `private`).
--
-- The decision (`AccessDecision`) has one of three shapes:
-- - in all tables: the normal case.
-- - only in `bikelanes`: its bikelane rows and their `routing` edges stay; no `roads` /
--   `roadsPathClasses` row and no carriageway / path edge in `routing` (it would have no row to join).
-- - in no table: like `exit_processing`, only decided later. No row in `bikelanes`, `roads`,
--   `roadsPathClasses`, `routing`, `highway_areas`, no sidepath source path, todo, presence or error.
--
-- Which key restricts: `access` (all modes, pedestrians included) on every way, plus the key of the
-- mode the way is built for: `foot` on a footway, `bicycle` on a cycleway. `vehicle`, `motor_vehicle`
-- and `bicycle` on other ways never restrict the way: they only say who may drive there, the way
-- stays in all tables. So `access=private` puts the way in no table, `vehicle=private` keeps all its rows and edges with
-- `access_bicycle=private`, and routers read `access_bicycle` on the edge.

---@class AccessDecision
---@field in_any_table boolean false: the way is written to no table at all
---@field in_bikelanes boolean `bikelanes` rows and their `routing` edges
---@field in_roads boolean the `roads` / `roadsPathClasses` row and the carriageway / path edge in `routing`
---@field reason string|nil the tag that took the way out of a table, e.g. `access=destination`; nil when it is in all tables
---@field may_change_with_bike_infra boolean own bike infrastructure can still put the way in all tables (`decide_after_categorisation`): the reason is `service`, `indoor` or `informal` and the tags hint at bike infrastructure (`may_have_bike_infra`). Always false for access tags.

--- Shared and read-only: public ways allocate nothing.
---@type AccessDecision
local IN_ALL_TABLES = {
  in_any_table = true,
  in_bikelanes = true,
  in_roads = true,
  reason = nil,
  may_change_with_bike_infra = false,
}

---@param reason string
---@param may_change_with_bike_infra boolean
---@return AccessDecision
local function in_bikelanes_only(reason, may_change_with_bike_infra)
  return {
    in_any_table = true,
    in_bikelanes = true,
    in_roads = false,
    reason = reason,
    may_change_with_bike_infra = may_change_with_bike_infra,
  }
end

---@param reason string
---@param may_change_with_bike_infra boolean
---@return AccessDecision
local function in_no_table(reason, may_change_with_bike_infra)
  return {
    in_any_table = false,
    in_bikelanes = false,
    in_roads = false,
    reason = reason,
    may_change_with_bike_infra = may_change_with_bike_infra,
  }
end

-- Values of the restricting key that put the way in no table. `no` is lifted when
-- cycling is explicitly allowed (`access=no + bicycle=yes`, a Fahrradstraße with `access=no +
-- bicycle=designated`); temporary closures are already turned into `lifecycle` by
-- `transform_lifecycle_tags`. `bicycle=no` on a cycleway always closes it.
local closed_access = SET.set({ 'no' })

-- Values that put the way in no table unless it is a signposted cycle route
-- (`bicycle=designated`). `bicycle=yes` does not lift them: `access=private + bicycle=yes` is mostly
-- a private service way.
local way_access = SET.set({ 'private', 'delivery', 'permit' })

-- `bicycle=mtb`: a mountain bike trail (mostly `path` / `track` with `mtb:scale`). TILDA looks at
-- everyday cycling, so the way is in no table; nothing lifts it.
local LEISURE_BICYCLE_ACCESS = 'mtb'

-- Values that put the way only in `bikelanes`, unless bicycle is explicitly allowed.
local roads_access = SET.set({ 'destination', 'customers' })

-- The mode a highway class is built for: its access key restricts the way like `access` does.
local mode_access_key = { footway = 'foot', cycleway = 'bicycle' }

--- The keys whose value restricts the way: `access`, and the mode key of footways / cycleways.
---@param highway string|nil
---@return string access_key always `access`
---@return string|nil mode_key `foot` / `bicycle` or nil
local function restricting_access_keys(highway)
  return 'access', mode_access_key[highway]
end

---@param tags OsmTags
---@param values table<string, boolean>
---@return string|nil key
---@return string|nil value
local function find_access_value(tags, values)
  local value = tags.access
  if value and values[value] then return 'access', value end
  local mode_key = mode_access_key[tags.highway]
  if mode_key then
    value = tags[mode_key]
    if value and values[value] then return mode_key, value end
  end
  return nil, nil
end

--- Decision from the access tags only (`restricting_access_keys`). Bike infrastructure never
--- changes it.
---@param tags OsmTags
---@return AccessDecision
local function decide_by_access_tags(tags)
  if tags.bicycle == LEISURE_BICYCLE_ACCESS then
    return in_no_table('bicycle=' .. LEISURE_BICYCLE_ACCESS, false)
  end

  local key, value = find_access_value(tags, closed_access)
  if key and not sanitize_access_tags.bicycle_explicitly_allowed(tags) then
    return in_no_table(key .. '=' .. value, false)
  end

  key, value = find_access_value(tags, way_access)
  if key and not sanitize_access_tags.bicycle_designated(tags) then
    return in_no_table(key .. '=' .. value, false)
  end

  key, value = find_access_value(tags, roads_access)
  if key then
    -- `bicycle=yes` & co. on an `access=destination` way: cycling is explicitly allowed, so the
    -- way is in all tables (and has a `roads` row for the routing edge to join).
    if sanitize_access_tags.bicycle_explicitly_allowed(tags) then
      return IN_ALL_TABLES
    end
    return in_bikelanes_only(key .. '=' .. value, false)
  end

  return IN_ALL_TABLES
end

-- `highway=service + service=<value>`: every value except `alley` puts the way in no table. Mainly:
-- - `driveway`: implicitly private
-- - `parking_aisle`: not part of the road network (a connecting road needs a plain `highway=service`)
-- - `emergency_access`: a special kind of driveway
-- - `drive-through`: not part of the road network, and false positives in the oneway layer
--
-- Exception: a signposted cycle route (`bicycle=designated`) is part of the bicycle network even
-- without a bikelane category. Any other bike infrastructure puts the way in all tables in stage 3
-- (`decide_after_categorisation`).
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

--- Decision from `service`, `indoor` and `informal`, which bike infrastructure of the way itself
--- can change.
---@param tags OsmTags
---@return AccessDecision
local function decide_by_way_kind(tags)
  if is_restricted_service(tags) then
    return in_no_table('service=' .. tags.service, may_have_bike_infra(tags))
  end
  if tags.indoor == 'yes' then
    return in_bikelanes_only('indoor=yes', may_have_bike_infra(tags))
  end
  if tags.informal == 'yes' then
    return in_bikelanes_only('informal=yes', may_have_bike_infra(tags))
  end
  return IN_ALL_TABLES
end

--- Stage 2: in which tables is the way? The decision with fewer tables wins, its reason is kept.
--- With the same tables, the access tags win because bike infrastructure cannot change them.
---@param object_tags OsmTags
---@return AccessDecision
local function decide(object_tags)
  local by_access_tags = decide_by_access_tags(object_tags)
  if not by_access_tags.in_any_table then return by_access_tags end

  local by_way_kind = decide_by_way_kind(object_tags)
  if not by_way_kind.in_any_table then return by_way_kind end

  if not by_access_tags.in_roads then return by_access_tags end
  return by_way_kind
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

--- Stage 3: after the bikelane categorisation, bike infrastructure of the way itself puts a
--- `service` / `indoor` / `informal` way in all tables. What is left is the decision of the access
--- tags alone (e.g. `access=destination` on a service way keeps it only in `bikelanes`).
---@param decision AccessDecision
---@param object_tags OsmTags
---@param cycleways table[]
---@return AccessDecision
local function decide_after_categorisation(decision, object_tags, cycleways)
  if not decision.may_change_with_bike_infra then return decision end
  if not has_own_bike_infra(cycleways) then return decision end
  return decide_by_access_tags(object_tags)
end

return {
  IN_ALL_TABLES = IN_ALL_TABLES,
  in_bikelanes_only = in_bikelanes_only,
  in_no_table = in_no_table,
  decide = decide,
  restricting_access_keys = restricting_access_keys,
  may_have_bike_infra = may_have_bike_infra,
  has_own_bike_infra = has_own_bike_infra,
  decide_after_categorisation = decide_after_categorisation,
}
