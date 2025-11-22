require('init')
require("ContainsSubstring")
require("IsSidepath")
require("CreateSubcategoriesAdjoiningOrIsolated")
require("SanitizeTrafficSign")
require("DeriveTrafficSigns")
require("DeriveSmoothness")
require("HighwayClasses")
local has_tag_with_prefix = require('has_tag_with_prefix')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')
local inspect = require("inspect")
local to_semicolon_list = require('to_semicolon_list')
local extractFromLanes = require('extractValueFromLanes')

---Helper function to check this object is also a `cyclewayOnHighwayBetweenLanes`
---@param tags table The tags to check
local function hasCyclewayOnHighwayBetweenLanesConditions(tags)
  if tags._side == 'left' or tags._side == 'right' then
    -- Check Untransformed tags
    if ContainsSubstring(tags['cycleway:lanes'], "|lane|") then return true end
    if ContainsSubstring(tags['bicycle:lanes'], "|designated|") then return true end
    -- `cycleway:lanes=*|lane|*` gets unnested to `tags.lanes`
    if ContainsSubstring(tags.lanes, '|lane|') then return true end
    -- `bicycle:lanes=*|designated|*` does not get copied during transformation, so we need to look at the `_parent`
    if tags._parent and ContainsSubstring(tags._parent['bicycle:lanes'], "|designated|") then return true end
  end
  return false
end

---@meta
---@class BikelaneCategory
BikelaneCategory = {}
BikelaneCategory.__index = BikelaneCategory

---@param args {
--- id: string,
--- desc: string,
--- infrastructureExists: boolean,
--- implicitOneWay: boolean,
--- implicitOneWayConfidence: 'high'|'medium'|'low'|'not_applicable',
--- copySurfaceSmoothnessFromParent: boolean, -- Whether this category should copy surface/smoothness values from parent highway
--- condition: fun(tags: table): (boolean|nil),
--- process: fun(tags: table): (table|nil)|nil, -- Optional function to process tags after categorization
--- }
---@return BikelaneCategory
function BikelaneCategory.new(args)
  ---@class BikelaneCategory
  local self = setmetatable({}, BikelaneCategory)
  self.id = args.id
  self.desc = args.desc
  self.infrastructureExists = args.infrastructureExists
  self.implicitOneWay = args.implicitOneWay
  self.implicitOneWayConfidence = args.implicitOneWayConfidence
  self.copySurfaceSmoothnessFromParent = args.copySurfaceSmoothnessFromParent
  self.condition = args.condition
  self.process = args.process
  return self
end

---@param tags table
---@return boolean|nil
function BikelaneCategory:__call(tags)
  return self.condition(tags)
end

local dataNo = BikelaneCategory.new({
  id = 'data_no',
  desc = 'The explicit absence of bike infrastrucute',
  infrastructureExists = false,
  implicitOneWay = false, -- explicit absence category
  implicitOneWayConfidence = 'not_applicable',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    local nos = Set({ 'no', 'none' })
    if nos[tags.cycleway] then
      return true
    end
  end
})

local isSeparate = BikelaneCategory.new({
  id = 'separate_geometry',
  desc = '',
  infrastructureExists = false,
  implicitOneWay = false, -- explicit absence category
  implicitOneWayConfidence = 'not_applicable',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    if tags.cycleway == 'separate' then
      return true
    end
  end
})

-- for oneways we assume that the tag `cycleway=*` significates that there's one bike line on the right
-- TODO: this assumes right hand traffic (would be nice to specify this as an option)
local implicitOneWay = BikelaneCategory.new({
  id = 'not_expected',
  desc = '',
  infrastructureExists = false,
  implicitOneWay = false, -- explicit absence category
  implicitOneWayConfidence = 'not_applicable',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    local result = tags._prefix == 'cycleway' and tags._infix == '' -- object is created from implicit case
    result = result and tags._parent.oneway == 'yes' and
        tags._parent['oneway:bicycle'] ~= 'no'                      -- is oneway w/o bike exception
    result = result and tags._side == "left"                        -- is the left side object
    if result then
      return true
    end
  end
})

-- https://wiki.openstreetmap.org/wiki/DE:Tag:highway=pedestrian
local pedestrianAreaBicycleYes = BikelaneCategory.new({
  id = "pedestrianAreaBicycleYes",
  desc = 'Pedestrian area (DE:"Fußgängerzonen") with' ..
      ' explicit allowance for bicycles (`bicycle=yes`). `dismount` counts as `no`.' ..
      ' (We only process the ways, not the `area=yes` Polygon.)',
  infrastructureExists = true,
  implicitOneWay = false, -- 'oneway=assumed_no' because road is shared
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    if tags.highway == "pedestrian" and (tags.bicycle == "yes" or tags.bicycle == "designated") then
      return true
    end
  end
})

-- https://wiki.openstreetmap.org/wiki/DE:Key:bicycle%20road
-- traffic_sign=DE:244, https://wiki.openstreetmap.org/wiki/DE:Tag:traffic_sign=DE:244
local bicycleRoad = BikelaneCategory.new({
  id = 'bicycleRoad',
  desc = 'Bicycle road (DE: "Fahrradstraße")',
  infrastructureExists = true,
  implicitOneWay = false, -- 'oneway=assumed_no' because road is shared
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if tags.bicycle_road == "yes" then
      return true
    end
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    if osm2pgsql.has_prefix(trafficSign, 'DE:244') then
      return true
    end
  end
})

-- https://wiki.openstreetmap.org/wiki/DE:Key:bicycle%20road
-- traffic_sign=DE:244,1020-30, https://wiki.openstreetmap.org/wiki/DE:Tag:traffic_sign=DE:244
-- Also "Kfz frei", https://commons.wikimedia.org/wiki/File:Zusatzzeichen_KFZ_frei.svg
local bicycleRoad_vehicleDestination = BikelaneCategory.new({
  id = 'bicycleRoad_vehicleDestination',
  desc = 'Bicycle road (DE: "Fahrradstraße mit Anlieger/Kfz frei")' ..
      ' with vehicle access `destination`.',
  infrastructureExists = true,
  implicitOneWay = false, -- 'oneway=assumed_no' because road is shared
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    -- Subcategory when bicycle road allows vehicle traffic
    if bicycleRoad(tags) then
      local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
      if ContainsSubstring(trafficSign, "1020-30") then
        return true
      end
      -- https://github.com/osmberlin/osm-traffic-sign-tool/issues/51#issuecomment-2969387929
      if ContainsSubstring(trafficSign, "Kraftfahrzeuge-frei") or
        ContainsSubstring(trafficSign, "Kfz-Verkehr frei") or
        ContainsSubstring(trafficSign, "KFZ frei")
      then
        return true
      end
      if tags.vehicle == 'destination' or tags.motor_vehicle == 'destination' or
        tags.vehicle == 'yes' or tags.motor_vehicle == 'yes'
      then
        return true
      end
    end
  end
})

-- Case: "Gemeinsamer Geh- und Radweg"
-- traffic_sign=DE:240, https://wiki.openstreetmap.org/wiki/DE:Tag:traffic_sign=DE:240
local footAndCyclewayShared = BikelaneCategory.new({
  id = 'footAndCyclewayShared',
  desc = 'Shared bike and foot path (DE: "Gemeinsamer Geh- und Radweg")',
  infrastructureExists = true,
  -- TODO: Find a way to have different defaults per variation…
  -- footAndCyclewayShared_adjoining           in landuse=residential 'implicit_yes' vs. outside 'implicit_yes'
  -- footAndCyclewayShared_isolated            in landuse=residential 'assumed_no'   vs. outside 'assumed_no'
  -- footAndCyclewayShared_adjoiningOrIsolated in landuse=residential 'implicit_yes' vs. outside 'implicit_yes'
  implicitOneWay = true, -- 'oneway=implicit_yes' because its "shared lane"-like
  implicitOneWayConfidence = 'low',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)

    -- Handle cycleway:SIDE=track (which becomes highway=cycleway)
    if tags.highway == "cycleway" and tags.cycleway == "track" and (tags.segregated == "no" or ContainsSubstring(trafficSign, "240")) then
      return true
    end

    -- Only apply the following conditions on cycleway-like highways.
    -- This makes sure 'living_street' is not included in this category https://www.openstreetmap.org/way/25219816
    -- Example highway=service https://www.openstreetmap.org/way/440072364, https://www.openstreetmap.org/way/1154311563, https://www.openstreetmap.org/way/37760785, https://www.openstreetmap.org/way/201687946
    -- Example highway=track https://github.com/FixMyBerlin/radinfra.de/issues/13#issuecomment-3347262698
    -- REMINDER: Also check `CreateSubcategoriesAdjoiningOrIsolated`; `service|track` required special treatment
    -- REMINDER: Also check `DeriveOneway`; `service|track` required special treatment
    local allowed_highways = Set({ 'cycleway', 'path', 'footway', 'service', 'track' })
    if allowed_highways[tags.highway] then
      if tags.segregated == "no" and tags.bicycle == "designated" and tags.foot == "designated"  then
        return true
      end
      if tags.segregated == "no" and tags.bicycle == "yes" and tags.foot == "yes"  then
        return true
      end
      if ContainsSubstring(trafficSign, "240") then
        return true
      end
    end
  end,
  process = function(tags)
    if tags.highway == 'service' then
      tags.description = to_semicolon_list({ tags.description, 'TILDA-Hinweis: Radinfrastruktur auf einem Zufahrtsweg.' })
    end
    -- https://trafficsigns.osm-verkehrswende.org/DE?signs=DE:1026-38 "Land- und forstwirtschaftlicher Verkehr frei"
    -- See also https://github.com/FixMyBerlin/radinfra.de/issues/13#issuecomment-3352120626
    if tags.highway == 'track' or
      ContainsSubstring(tags.traffic_sign, '1026-36') or ContainsSubstring(tags.traffic_sign, '1026-37') or ContainsSubstring(tags.traffic_sign, '1026-38') or
      ContainsSubstring(tags.access, 'agricultural') or ContainsSubstring(tags.motor_vehicle, 'agricultural') or ContainsSubstring(tags.vehicle, 'agricultural') or
      ContainsSubstring(tags.access, 'forestry') or ContainsSubstring(tags.motor_vehicle, 'forestry') or ContainsSubstring(tags.vehicle, 'forestry')
    then
      tags.description = to_semicolon_list({ tags.description, 'TILDA-Hinweis: Radinfrastruktur geteilt mit land- und/oder forstwirtschaftlichem Verkehr.' })
    end
    return tags
  end
})
local footAndCyclewayShared_adjoining, footAndCyclewayShared_isolated, footAndCyclewayShared_adjoiningOrIsolated = CreateSubcategoriesAdjoiningOrIsolated(footAndCyclewayShared)

-- Case: "Getrennter Rad- und Gehweg"
-- traffic_sign=DE:241-30, https://wiki.openstreetmap.org/wiki/DE:Tag:traffic_sign=DE:241-30
-- traffic_sign=DE:241-31, https://wiki.openstreetmap.org/wiki/DE:Tag:traffic_sign=DE:241-31
local footAndCyclewaySegregated = BikelaneCategory.new({
  id = 'footAndCyclewaySegregated',
  desc = 'Shared bike and foot path (DE: "Getrennter Geh- und Radweg")',
  infrastructureExists = true,
  -- TODO: Find a way to have different defaults per variation and by location…
  -- footAndCyclewaySegregated_adjoining           in landuse=residential 'implicit_yes' vs. outside 'assumed_no' (Landstraße)
  -- footAndCyclewaySegregated_isolated            in landuse=residential 'assumed_no'   vs. outside 'assumed_no'
  -- footAndCyclewaySegregated_adjoiningOrIsolated in landuse=residential 'implicit_yes' vs. outside 'assumed_no'
  implicitOneWay = true, -- 'oneway=implicit_yes' because its "shared lane"-like
  implicitOneWayConfidence = 'low',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)

    -- Handle cycleway:SIDE=track (which becomes highway=cycleway)
    if tags.highway == "cycleway" and tags.cycleway == "track" and (tags.segregated == "yes" or ContainsSubstring(trafficSign, "241")) then
      return true
    end

    -- Only apply the following conditions on cycleway-like highways.
    -- This makes sure direct tagging on other highways classes does not match this category.
    if tags.highway == 'cycleway' or tags.highway == 'path' or tags.highway == 'footway' then
      if tags.segregated == "yes" and tags.bicycle == "designated" and tags.foot == "designated" then
          return true
      end
      if tags.segregated == "yes" and tags.bicycle == "yes" and tags.foot == "yes"  then
        return true
      end

      if ContainsSubstring(trafficSign, "241") and tags.highway ~= "footway" then
        return true
      end
    end

    -- Edge case: https://www.openstreetmap.org/way/1319011143#map=18/52.512226/13.288552
    -- No traffic_sign but mapper decided to map foot- and bike lane as separate geometry
    -- We check for traffic_mode:right=foot
    -- But in some cases, it is OK to map traffic_mode:right=foot but there is a separation.
    -- Those cases are not `footAndCyclewaySegregated`. So if a separation is given, this has to be "no".
    -- Eg. https://www.openstreetmap.org/way/244549219
    local separation_right = SANITIZE_ROAD_TAGS.separation(tags, 'right')
    local separation_condition = true
    if(separation_right ~= nil) then separation_condition = separation_right == 'no' end

    local traffic_mode_right = SANITIZE_ROAD_TAGS.traffic_mode(tags, 'right')
    local traffic_mode_condition = traffic_mode_right == 'foot'

    if tags.highway == "cycleway" and traffic_mode_condition and separation_condition then
      return true
    end
  end
})
local footAndCyclewaySegregated_adjoining, footAndCyclewaySegregated_isolated, footAndCyclewaySegregated_adjoiningOrIsolated = CreateSubcategoriesAdjoiningOrIsolated(footAndCyclewaySegregated)

-- Case: "Gehweg, Fahrrad frei"
-- traffic_sign=DE:1022-10 "Fahrrad frei", https://wiki.openstreetmap.org/wiki/DE:Tag:traffic_sign=DE:239
local footwayBicycleYes = BikelaneCategory.new({
  id = 'footwayBicycleYes',
  desc = 'Footway / Sidewalk with explicit allowance for bicycles (`bicycle=yes`) (DE: "Gehweg, Fahrrad frei")',
  infrastructureExists = true,
  -- TODO: Find a way to have different defaults per variation and by location…
  -- footwayBicycleYes_adjoining           in landuse=residential 'implicit_yes' vs. outside 'assumed_no' (Landstraße)
  -- footwayBicycleYes_isolated            in landuse=residential 'assumed_no'   vs. outside 'assumed_no'
  -- footwayBicycleYes_adjoiningOrIsolated in landuse=residential 'implicit_yes' vs. outside 'assumed_no'
  implicitOneWay = true, -- 'oneway=implicit_yes' because its "shared lane"-like
  implicitOneWayConfidence = 'low',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    -- 1. Check highway type: has to be footway or path
    if tags.highway ~= "footway" and tags.highway ~= "path" then
      return
    end

    -- 2. Check bicycle access: has to have bicycle=yes or the right traffic sign
    local has_bicycle_access = tags.bicycle == 'yes' or ContainsSubstring(SanitizeTrafficSign(tags.traffic_sign), '1022-10')
    if not has_bicycle_access then
      return
    end

    -- 3. Handle mtb:scale conditions
    if tags['mtb:scale'] ~= nil then
      -- Clean up the value by removing +, -, and spaces
      local cleanedValue = string.gsub(tags['mtb:scale'], "[%+%-%s]", "")
      local numericValue = tonumber(cleanedValue)

      -- If conversion fails (e.g., "unknown", "not_string"), exit the category
      if numericValue == nil then
        return
      end

      -- mtb:scale > 1 is a strong indicator for path' that we do not want to show.
      -- We do allow '0', '1' though, because those are OKish to use and sometimes mapped on "regular" footways.
      if numericValue > 1 then
        return
      end

      -- When mtb:scale is present, we need either traffic_sign or is_sidepath
      if tags.traffic_sign == nil and tags.is_sidepath == nil then
        return
      end
    end

    return true
  end
})
local footwayBicycleYes_adjoining, footwayBicycleYes_isolated, footwayBicycleYes_adjoiningOrIsolated = CreateSubcategoriesAdjoiningOrIsolated(footwayBicycleYes)

-- Handle different cases for separated bikelanes ("baulich abgesetzte Radwege")
-- The sub-tagging specifies if the cycleway is part of a road or a separate way.
-- This part relies heavly on the `is_sidepath` tagging.
local cyclewaySeparated = BikelaneCategory.new({
  id = 'cycleway',
  desc = '',
  infrastructureExists = true,
  -- TODO: Find a way to have different defaults per variation and by location…
  -- cyclewaySeparated_adjoining           in landuse=residential 'implicit_yes' vs. outside 'assumed_no' (Landstraße)
  -- cyclewaySeparated_isolated            in landuse=residential 'assumed_no'   vs. outside 'assumed_no'
  -- cyclewaySeparated_adjoiningOrIsolated in landuse=residential 'implicit_yes' vs. outside 'assumed_no'
  implicitOneWay = false, -- 'oneway=assumed_no' because its "track"-like and `oneway=yes` (more commonly tagged in cities) is usually explicit
  implicitOneWayConfidence = 'low',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    -- CASE: GUARD Centerline "lane"
    -- Needed for places like https://www.openstreetmap.org/way/964589554 which have the traffic sign but are not separated.
    if tags.cycleway == 'lane' then return false end

    -- CASE: Centerline
    -- traffic_sign=DE:237, "Radweg", https://wiki.openstreetmap.org/wiki/DE:Tag:traffic%20sign=DE:237
    -- cycleway=track, https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=track
    -- cycleway=opposite_track, https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=opposite_track
    if tags.highway == 'cycleway' and (tags.cycleway == 'track' or tags.cycleway == 'opposite_track' or tags.is_sidepath) then
      return true
    end

    -- CASE: Everything that has a traffic sign DE:237
    -- Sometimes users add a `traffic_sign=DE:237` right on the `highway=secondard` but it should be `cycleway:right:traffic_sign`
    -- We only allow the follow highway tags. This will still produce false positives but less so.
    -- And looking at the _parent_highway and left|right|nil|both tags for this is way to complex.
    local allowed_highways = Set({
      'living_street',
      'pedestrian',
      'service',
      'track',
      'bridleway',
      'path',
      'footway',
      'cycleway',
    })
    -- adjoining:
    -- This could be PBLs "Protected Bike Lanes"
    -- Eg https://www.openstreetmap.org/way/964476026
    -- Eg https://www.openstreetmap.org/way/278057274
    -- isolated:
    -- Case: "frei geführte Radwege", dedicated cycleways that are not next to a road
    -- Eg https://www.openstreetmap.org/way/27701956
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    if allowed_highways[tags.highway] and ContainsSubstring(trafficSign, '237') then
      return true
    end
  end
})
local cyclewaySeparated_adjoining, cyclewaySeparated_isolated, cyclewaySeparated_adjoiningOrIsolated = CreateSubcategoriesAdjoiningOrIsolated(cyclewaySeparated)

-- Examples https://github.com/FixMyBerlin/tilda-geo/issues/23
local crossing = BikelaneCategory.new({
  id = 'crossing',
  desc = 'Crossings with relevance for bicycles.' ..
      ' There is no split into more specific infrastrucute categories for now.',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yet' but actually unknown so lets be cautions
  implicitOneWayConfidence = 'low',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if tags.highway == "cycleway" and tags.cycleway == "crossing" then
      return true
    end
    if tags.highway == "path" and tags.path == "crossing"
        and (tags.bicycle == "yes" or tags.bicycle == "designated") then
      return true
    end
    if tags.highway == "footway" and tags.footway == "crossing"
        and (tags.bicycle == "yes" or tags.bicycle == "designated") then
      return true
    end
  end
})

local cyclewayLink = BikelaneCategory.new({
  id = 'cyclewayLink',
  desc = 'A non-infrastrucute category.' ..
      ' `cycleway=link` is used to connect the road network for routing use cases' ..
      ' when no physical infrastructure is present.',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yet' but actually unknown so lets be cautions
  implicitOneWayConfidence = 'low',
  condition = function(tags)
    if tags.highway == "cycleway" and tags.cycleway == "link" then
      return true
    end
  end
})

-- Case: Unkown 'lane' – "Radfahrstreifen" OR "Schutzstreifen"
-- We use this category below to make it more precise checking `advisory` or `exclusive`.
-- https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=lane
-- https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=opposite_lane
-- https://wiki.openstreetmap.org/wiki/Key:cycleway:lane
-- https://wiki.openstreetmap.org/wiki/Lanes#Crossing_with_a_designated_lane_for_bicycles
local cyclewayOnHighway_advisoryOrExclusive = BikelaneCategory.new({
  id = 'cyclewayOnHighway_advisoryOrExclusive',
  desc = 'Bicycle infrastrucute on the highway, right next to motor vehicle traffic.' ..
      ' This category is split into subcategories for "advisory" (DE: "Schutzstreifen")' ..
      ' and "exclusive" lanes (DE: "Radfahrstreifen").',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "lane"-like
  implicitOneWayConfidence = 'medium',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if tags.highway == 'cycleway' then
      -- "Angstweichen" (`cyclewayOnHighwayBetweenLanes`) are a special case where the cycleway is part of the road which is tagged using one of their `*:lanes` schema.
      -- Those get usually dual(!) tagged as `cycleway:right=lane` to make the "Angstweiche" "visible" to routing.
      -- For this category, we skip the dual tagging BUT still want to capture cases where there is BOTH, an actual `lane` ("Schutzstreifen") as well as a "Angstweiche".
      -- We only acccept double infra when we have both, "|lane|" (the "Angstweiche") as well a a suffix "|lane" (the "Schutzstreifen").
      -- Note: `tags.lanes` is `cycleway:lanes` but unnested whereas `bicycle:lanes` does not get unnested.
      if hasCyclewayOnHighwayBetweenLanesConditions(tags) then
        if ContainsSubstring(tags.lanes, '|lane|') and not osm2pgsql.has_suffix(tags.lanes, '|lane') then
          return false
        end
        if tags._parent ~= nil and ContainsSubstring(tags._parent['bicycle:lanes'], '|designated|') and not osm2pgsql.has_suffix(tags._parent['bicycle:lanes'], '|designated') then
          return false
        end

        -- When both infra are given ("Radfahrstreifen in Mittellage" (RiM)) as well as "Schutzstreifen", we take the `cyclway:SIDE:width` for the "Schutzstreifen".
        -- But if that is missing, we look into the `width:lanes` and take the value from there if present.
        local source_width = tags._parent and extractFromLanes.extractLastValueFromLanes(tags._parent['width:lanes'])
        tags.width = tags.width or source_width
      end

      -- Regular case
      if tags.cycleway == "lane" or tags.cycleway == "opposite_lane" then
        return true
      end
    end
  end
})

-- Case: "Schutzstreifen"
-- https://wiki.openstreetmap.org/wiki/DE:Key:cycleway:lane
local cyclewayOnHighway_advisory = BikelaneCategory.new({
  id = 'cyclewayOnHighway_advisory',
  desc = 'Bicycle infrastructure on the highway, right next to motor vehicle traffic.' ..
      'For "advisory" lanes (DE: "Schutzstreifen")',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "lane"-like
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if cyclewayOnHighway_advisoryOrExclusive(tags) then
      if tags['lane'] == 'advisory' then
        return true -- DE: Schutzstreifen
      end
    end
  end
})

-- Case: "Radfahrstreifen"
-- https://wiki.openstreetmap.org/wiki/DE:Key:cycleway:lane
local cyclewayOnHighway_exclusive = BikelaneCategory.new({
  id = 'cyclewayOnHighway_exclusive',
  desc = 'Bicycle infrastrucute on the highway, right next to motor vehicle traffic.' ..
      ' For "exclusive" lanes (DE: "Radfahrstreifen").',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "lane"-like
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if cyclewayOnHighway_advisoryOrExclusive(tags) then
      if tags['lane'] == 'exclusive' then
        return true -- DE: Radfahrstreifen
      end
    end
  end
})

-- Case: Cycleway identified via "shared_lane"-tagging ("Anteilig genutzten Fahrstreifen")
-- https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=shared_lane
local sharedMotorVehicleLane = BikelaneCategory.new({
  id = 'sharedMotorVehicleLane',
  desc = '', -- TODO desc; Wiki nochmal nachlesen und Conditions prüfen
  infrastructureExists = true,
  implicitOneWay = false, -- 'oneway=assumed_no' the whole road is shared (both lanes); Something like left|right would be `implicit_yes`
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if tags.highway == 'cycleway' and tags.cycleway == "shared_lane" then
      return true
    end
  end
})

-- There are edge cases to be treated here, but the are related to cycleway:SIDE=lane, so the are documented at `cyclewayOnHighway_advisoryOrExclusive`
-- https://wiki.openstreetmap.org/wiki/Forward_&_backward,_left_&_right
-- https://wiki.openstreetmap.org/wiki/Lanes#Crossing_with_a_designated_lane_for_bicycles
local cyclewayOnHighwayBetweenLanes = BikelaneCategory.new({
  id = 'cyclewayOnHighwayBetweenLanes',
  desc = 'Bike lane between motor vehicle lanes, mostly on the left of a right turn lane. (DE: "Radweg in Mittellage")',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "lane"-like
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    if tags._side == 'self' then
      if ContainsSubstring(tags['cycleway:lanes'], "|lane|") then
        return true
      end
      if ContainsSubstring(tags['bicycle:lanes'], "|designated|") then
        return true
      end
    end
  end,
  process = function(tags)
    local width = extractFromLanes.extractValueFromLanes('width:lanes', tags)
    if width then
      tags.width = width
    end

    local surface = extractFromLanes.extractValueFromLanes('surface:lanes', tags)
    if surface then
      tags.surface = surface
    end

    local surface_colour = extractFromLanes.extractValueFromLanes('surface:colour:lanes', tags)
    if surface_colour then
      tags['surface:colour'] = surface_colour
    end

    local smoothness = extractFromLanes.extractValueFromLanes('smoothness:lanes', tags)
    if smoothness then
      tags.smoothness = smoothness
    end

    local source_width = extractFromLanes.extractValueFromLanes('source:width:lanes', tags)
    if source_width then
      tags['source:width'] = source_width
    end

    local traffic_sign = extractFromLanes.extractValueFromLanes('traffic_sign:lanes', tags)
    tags.traffic_sign = traffic_sign or 'never'

    return tags
  end
})

local cyclewayOnHighwayProtected = BikelaneCategory.new({
  id = 'cyclewayOnHighwayProtected',
  desc = 'Protected bikelanes (PBL) e.g. bikelanes with physical separation from motorized traffic.',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its still "lane"-like and wider RVA would likely be tagged explicitly
  implicitOneWayConfidence = 'medium',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    -- Only target sidepath like ways
    if not IsSidepath(tags) then return false end
    -- "Schutzstreifen" cannot be PBLs
    if tags['lane'] == 'advisory' then return false end

    -- We exclude separation that signals that the cycleway is not on the street but on the sidewalk
    local allowed_separation_values = Set({
      'bollard', 'flex_post', 'vertical_panel', 'studs', 'bump', 'planter', 'fence', 'jersey_barrier', 'guard_rail'
    })

    -- Has to have physical separation left
    local traffic_mode_right = SANITIZE_ROAD_TAGS.traffic_mode(tags, 'right')
    local separation_left = SANITIZE_ROAD_TAGS.separation(tags, 'left')
    if allowed_separation_values[separation_left] then
      -- But not in edge cases, when the separation protects a cyclewayOnHighwayBetweenLanes, see https://www.openstreetmap.org/way/80706109/history
      if traffic_mode_right == 'motor_vehicle' then
        return false
      end
      -- But not when `segregated` is present, as it indicates infrastructure that is
      -- not on the road ("Seitenraum"), in which case the separation condition does not apply
      if tags.segregated ~= nil then
        return false
      end
      return true
    end

    -- Parked cars are treated as physical separation when left of the bikelane
    local traffic_mode_left = SANITIZE_ROAD_TAGS.traffic_mode(tags, 'left')
    if traffic_mode_left == 'parking' then
      -- But not when `segregated` is present, as it indicates infrastructure that is
      -- not on the road ("Seitenraum"), in which case the parking condition does not apply
      if tags.segregated ~= nil then
        return false
      end
      return true
    end

    -- For counter flow bikelanes with motorized traffic on the right, has to have physical separation right
    local separation_right = SANITIZE_ROAD_TAGS.separation(tags, 'right')
    if traffic_mode_right == 'motor_vehicle' and allowed_separation_values[separation_right] then
      return true
    end
  end
})

-- Wiki https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=share_busway
-- "Fahrrad frei" traffic_sign=DE:245,1022-10
--   - https://trafficsigns.osm-verkehrswende.org/?signs=DE%3A245%7CDE%3A1022-10
-- "Fahrrad frei, Taxi frei" traffic_sign=DE:245,1022-10,1026-30
--   - https://trafficsigns.osm-verkehrswende.org/?signs=DE%3A245%7CDE%3A1022-10%7CDE%3A1026-30
-- "Fahrrad & Mofa frei" traffic_sign=DE:245,1022-14
-- HISTORY:
-- - Until 2023-03-2: This was `cyclewayAlone`
-- - Until 2024-05-02: This was `sharedBusLane` until we introduced `sharedBusLaneBikeWithBus`
local sharedBusLaneBusWithBike = BikelaneCategory.new({
  id = 'sharedBusLaneBusWithBike',
  desc = 'Bus lane with explicit allowance for bicycles (`cycleway=share_busway`).' ..
      ' (DE: "Bussonderfahrstreifen mit Fahrrad frei")',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "shared lane"-like
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    -- We only apply this category on the transformed geometries, not on `_side=self`
    if tags.highway ~= 'cycleway' then return end

    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    local parentTrafficSign = tags._parent and SanitizeTrafficSign(tags._parent.traffic_sign)
    if tags.cycleway == 'share_busway' or
      tags.cycleway == 'opposite_share_busway' or
      osm2pgsql.has_prefix(trafficSign, "DE:245") and (ContainsSubstring(trafficSign, "1022-10") or ContainsSubstring(trafficSign, "1022-14")) or
      osm2pgsql.has_prefix(parentTrafficSign, "DE:245") and (ContainsSubstring(parentTrafficSign, "1022-10") or ContainsSubstring(parentTrafficSign, "1022-14"))
    then
      return true
    end
  end,
  process = function(tags)
    -- The transformation does not copy the traffic sign but in this case, we want the road traffic sign as part of the bike infra
    local traffic_sign_results = DeriveTrafficSigns(tags._parent)
    tags.traffic_sign = tags.traffic_sign or traffic_sign_results.traffic_sign
    tags['traffic_sign:forward'] = tags['traffic_sign:forward'] or traffic_sign_results['traffic_sign:forward']
    tags['traffic_sign:backward'] = tags['traffic_sign:backward'] or traffic_sign_results['traffic_sign:backward']
    return tags
  end
})

-- Traffic sign traffic_sign=DE:237,1024-14
--   - https://trafficsigns.osm-verkehrswende.org/?signs=DE%3A237%7CDE%3A1024-14
-- OSM Verkehrswende Recommended Tagging is too complex for now, we mainly look at the traffic_sign
-- and the few uses of `cycleway:right:lane=share_busway`.
--   - 81 in DE https://taginfo.geofabrik.de/europe:germany/tags/cycleway%3Aright%3Alane=share_busway#overview
--   - 87 overall https://taginfo.openstreetmap.org/tags/cycleway%3Aright%3Alane=share_busway#overview
--   - 1 overall for left https://taginfo.openstreetmap.org/tags/cycleway%3Aleft%3Alane=share_busway#overview
local sharedBusLaneBikeWithBus = BikelaneCategory.new({
  id = 'sharedBusLaneBikeWithBus',
  desc = 'Bicycle lane with explicit allowance for buses.' ..
      ' (DE: "Radfahrstreifen mit Freigabe Busverkehr")',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "shared lane"-like
  implicitOneWayConfidence = 'high',
  copySurfaceSmoothnessFromParent = true,
  condition = function(tags)
    -- We only apply this category on the transformed geometries, not on `_side=self`
    if tags.highway ~= 'cycleway' then return end

    -- We check for the traffic sign "1024-14 Bus frei" or "1026-32 Linienverkehr frei"
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    local parentTrafficSign = tags._parent and SanitizeTrafficSign(tags._parent.traffic_sign)
    if tags.lane == "share_busway" or
      osm2pgsql.has_prefix(trafficSign, "DE:237") and (ContainsSubstring(trafficSign, "1024-14") or ContainsSubstring(trafficSign, "1026-32")) or
      osm2pgsql.has_prefix(parentTrafficSign, "DE:237") and (ContainsSubstring(parentTrafficSign, "1024-14") or ContainsSubstring(parentTrafficSign, "1026-32"))
    then
      return true
    end
  end,
  process = function(tags)
    -- The transformation does not copy the traffic sign but in this case, we want the road traffic sign as part of the bike infra
    tags.traffic_sign = tags.traffic_sign or (tags._parent and tags._parent.traffic_sign)
    return tags
  end
})

-- This is where we collect bike lanes that do not have sufficient tagging to be categorized well.
-- They are in OSM, but they need to be improved, which we show in the UI.
-- GOTCHA:
-- This category will also collect all transformed geometries that had any `cycleway:*` tag.
-- This can include false translformations like when someone tagged `cycleway:separation:right=foo` which will create a transformed object
-- (which we "see" as an `highway=cycleway`) for both sides (based on `cycleway:NIL` being recognized as `cycleway:both`).
local needsClarification = BikelaneCategory.new({
  id = 'needsClarification',
  desc = 'Bike infrastructure that we cannot categories properly due to missing or ambiguous tagging.' ..
      ' Check the `todos` property on hints on how to improve the tagging.',
  infrastructureExists = true,
  implicitOneWay = false, -- 'oneway=assumed_no' when it is actually unknown, but `oneway=yes` is more likely explictly tagged that `oneway=no`
  implicitOneWayConfidence = 'low',
  copySurfaceSmoothnessFromParent = false,
  condition = function(tags)
    -- HACK: because `cyclewayOnHighwayBetweenLanes` is now detected on the `self` object we need to filter out the sides here
    -- The fix this properly we would need to double classify objects
    if hasCyclewayOnHighwayBetweenLanesConditions(tags) then
      return false
    end

    if tags.cycleway == "shared" then
      -- We handle this as a campaign now because it is very likely not infrastructure
      return false
    end

    if tags.highway == "cycleway" then
      return true
    end

    if tags.highway == "path" and tags.bicycle == "designated" then
      -- Handle exclusive cycleways that are misstagged as path.
      -- But exclude those MTB path that are not relevant for a everyday cycle network.
      -- NOTE: We could allow some cases later (if needed) when certain traffic_sigsn are present.
      -- See https://github.com/FixMyBerlin/radinfra.de/issues/14
      --
      -- REMINDER: Also update `BikelaneTodos.lua` > `unexpected_highway_path`
      if tags.foot == 'no' then
        local excluded_surfaces = Set({ 'ground', 'dirt', 'fine_gravel', 'gravel', 'pebblestone', 'earth' })
        if has_tag_with_prefix(tags, 'mtb:') or
          tags.mtb == 'yes' or
          excluded_surfaces[tags.surface]
        then
          return false
        end

        return true
      end
      return true
    end

    if tags.highway == 'footway' and tags.bicycle == 'designated' then
      return true
    end
  end
})

-- The order specifies the precedence; first one with a result win.
local categoryDefinitions = {
  dataNo,
  isSeparate,
  implicitOneWay,
  cyclewayOnHighwayProtected,
  cyclewayLink,
  crossing,
  bicycleRoad_vehicleDestination,
  bicycleRoad, -- has to come after `bicycleRoad_vehicleDestination`
  sharedBusLaneBikeWithBus,
  sharedBusLaneBusWithBike,
  pedestrianAreaBicycleYes,
  sharedMotorVehicleLane,
  -- Detailed tagging cases
  cyclewayOnHighwayBetweenLanes,
  footAndCyclewayShared_adjoining,
  footAndCyclewayShared_isolated,
  footAndCyclewayShared_adjoiningOrIsolated,
  footAndCyclewaySegregated_adjoining,
  footAndCyclewaySegregated_isolated,
  footAndCyclewaySegregated_adjoiningOrIsolated,
  cyclewaySeparated_adjoining,
  cyclewaySeparated_isolated,
  cyclewaySeparated_adjoiningOrIsolated,
  cyclewayOnHighway_advisory,
  cyclewayOnHighway_exclusive,
  cyclewayOnHighway_advisoryOrExclusive,
  footwayBicycleYes_adjoining, -- after `cyclewaySeparated_*`
  footwayBicycleYes_isolated,
  footwayBicycleYes_adjoiningOrIsolated,
  -- Needs to be last
  needsClarification
}

---@param tags table
---@return BikelaneCategory|nil
function CategorizeBikelane(tags)
  for _, category in pairs(categoryDefinitions) do
    if category(tags) then
      if category.process then
        category.process(tags)
      end
      return category
    end
  end
  return nil
end
