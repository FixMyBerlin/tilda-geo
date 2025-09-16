require('init')
require("ContainsSubstring")
require("IsSidepath")
require("CreateSubcategoriesAdjoiningOrIsolated")
require("SanitizeTrafficSign")
require("DeriveSmoothness")
require("HighwayClasses")
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')
local inspect = require("inspect")
BikelaneCategory = {}
BikelaneCategory.__index = BikelaneCategory

-- @param args table
-- @param args.desc string
-- @param args.insfrastructureExists boolean
-- @param args.implicitOneWay boolean
-- @param args.implicitOneWayConfidence 'high' | 'medium' | 'low' | 'not_applicable'
-- @param args.condition function
function BikelaneCategory.new(args)
  local self = setmetatable({}, BikelaneCategory)
  self.id = args.id
  self.desc = args.desc
  self.infrastructureExists = args.infrastructureExists
  self.implicitOneWay = args.implicitOneWay
  self.implicitOneWayConfidence = args.implicitOneWayConfidence
  self.condition = args.condition
  return self
end

function BikelaneCategory:__call(tags)
  return self.condition(tags)
end

local dataNo = BikelaneCategory.new({
  id = 'data_no',
  desc = 'The explicit absence of bike infrastrucute',
  infrastructureExists = false,
  implicitOneWay = false, -- explicit absence category
  implicitOneWayConfidence = 'not_applicable',
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
  desc = 'Bicycle road (DE: "Fahrradstraße mit Anlieger frei")' ..
      ' with vehicle access `destination`.',
  infrastructureExists = true,
  implicitOneWay = false, -- 'oneway=assumed_no' because road is shared
  implicitOneWayConfidence = 'high',
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
      if tags.vehicle == 'destination' or tags.motor_vehicle == 'destination' then
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
  condition = function(tags)
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)

    -- Handle cycleway:SIDE=track (which becomes highway=cycleway)
    if tags.highway == "cycleway" and tags.cycleway == "track" and (tags.segregated == "no" or ContainsSubstring(trafficSign, "240")) then
      return true
    end

    -- Only apply the following conditions on cycleway-like highways.
    -- This makes sure 'living_street' is not included in this category https://www.openstreetmap.org/way/25219816
    -- `highway=service` includes ways like https://www.openstreetmap.org/way/1154311563, https://www.openstreetmap.org/way/37760785, https://www.openstreetmap.org/way/201687946
    if (tags.highway == 'cycleway' or tags.highway == 'path' or tags.highway == 'footway' or tags.highway == 'service') then
      -- https://www.openstreetmap.org/way/440072364 highway=service
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
  condition = function(tags)
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)

    -- Handle cycleway:SIDE=track (which becomes highway=cycleway)
    if tags.highway == "cycleway" and tags.cycleway == "track" and (tags.segregated == "yes" or ContainsSubstring(trafficSign, "241")) then
      return true
    end

    -- Only apply the following conditions on cycleway-like highways.
    -- This makes sure direct tagging on other highways classes does not match this category.
    if (tags.highway == 'cycleway' or tags.highway == 'path' or tags.highway == 'footway') then
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
  condition = function(tags)
    -- 1. Check highway type: has to be footway or path
    if tags.highway ~= "footway" and tags.highway ~= "path" then
      return
    end

    -- 2. Check bicycle access: has to have bicycle=yes or the right traffic sign
    if tags.bicycle ~= "yes" and not ContainsSubstring(SanitizeTrafficSign(tags.traffic_sign), "1022-10") then
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
  condition = function(tags)
    -- CASE: GUARD Centerline "lane"
    -- Needed for places like https://www.openstreetmap.org/way/964589554 which have the traffic sign but are not separated.
    if (tags.cycleway == "lane") then return false end

    -- CASE: Centerline
    -- traffic_sign=DE:237, "Radweg", https://wiki.openstreetmap.org/wiki/DE:Tag:traffic%20sign=DE:237
    -- cycleway=track, https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=track
    -- cycleway=opposite_track, https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=opposite_track
    if tags.highway == "cycleway" and (tags.cycleway == "track" or tags.cycleway == "opposite_track" or tags.is_sidepath) then
      return true
    end

    -- CASE: Everything that has a traffic sign DE:237
    -- Sometimes users add a `traffic_sign=DE:237` right on the `highway=secondard` but it should be `cycleway:right:traffic_sign`
    -- We only allow the follow highway tags. This will still produce false positives but less so.
    -- And looking at the _parent_highway and left|right|nil|both tags for this is way to complex.
    local allowedHighways = Set({
      "living_street",
      "pedestrian",
      "service",
      "track",
      "bridleway",
      "path",
      "footway",
      "cycleway",
    })
    -- adjoining:
    -- This could be PBLs "Protected Bike Lanes"
    -- Eg https://www.openstreetmap.org/way/964476026
    -- Eg https://www.openstreetmap.org/way/278057274
    -- isolated:
    -- Case: "frei geführte Radwege", dedicated cycleways that are not next to a road
    -- Eg https://www.openstreetmap.org/way/27701956
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    if allowedHighways[tags.highway] and ContainsSubstring(trafficSign, "237") then
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
-- https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=lane
-- https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway=opposite_lane
-- https://wiki.openstreetmap.org/wiki/Key:cycleway:lane
local cyclewayOnHighway_advisoryOrExclusive = BikelaneCategory.new({
  id = 'cyclewayOnHighway_advisoryOrExclusive',
  desc = 'Bicycle infrastrucute on the highway, right next to motor vehicle traffic.' ..
      ' This category is split into subcategories for "advisory" (DE: "Schutzstreifen")' ..
      ' and "exclusive" lanes (DE: "Radfahrstreifen").',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "lane"-like
  implicitOneWayConfidence = 'medium',
  condition = function(tags)
    if tags.highway == 'cycleway' then
      if tags._side ~= 'self' then
        -- "Angstweichen" are a special case where the cycleway is part of the road which is tagged using one of their `*:lanes` schema.
        -- Those get usually dual tagged as `cycleway:right=lane` to make the "Angstweiche" "visible" to routing.
        -- For this category, we skip the dual tagging but still want to capture cases where there is an actual `lane` ("Schutzstreifen") as well as a "Angstweiche".
        -- The actual double infra is present when the lanes have both "|lane|" (the "Angstweiche") as well a a suffix "|lane" (the "Schutzstreifen").
        -- Note: `tags.lanes` is `cycleway:lanes` but unnested whereas `bicycle:lanes` does not get unnested.
        if ContainsSubstring(tags.lanes,'|lane|') then
          if not osm2pgsql.has_suffix(tags.lanes, '|lane') then
            return false
          end
        end
        if tags._parent ~= nil and ContainsSubstring(tags._parent['bicycle:lanes'], '|designated|') then
          if not osm2pgsql.has_suffix(tags._parent['bicycle:lanes'], '|designated') then
            return false
          end
        end
      end
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
  condition = function(tags)
    if tags.highway == 'cycleway' and tags.cycleway == "shared_lane" then
      return true
    end
  end
})

-- https://wiki.openstreetmap.org/wiki/Forward_&_backward,_left_&_right
-- https://wiki.openstreetmap.org/wiki/Lanes#Crossing_with_a_designated_lane_for_bicycles
local cyclewayOnHighwayBetweenLanes = BikelaneCategory.new({
  id = 'cyclewayOnHighwayBetweenLanes',
  desc = 'Bike lane between motor vehicle lanes,' ..
      ' mostly on the left of a right turn lane. (DE: "Radweg in Mittellage")',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "lane"-like
  implicitOneWayConfidence = 'high',
  condition = function(tags)
    if tags._side == 'self' then
      if ContainsSubstring(tags['cycleway:lanes'], "|lane|") then
        return true
      end
      if ContainsSubstring(tags['bicycle:lanes'], "|designated|") then
        return true
      end
    end
  end
})

local cyclewayOnHighwayProtected = BikelaneCategory.new({
  id = 'cyclewayOnHighwayProtected',
  desc = 'Protected bikelanes (PBL) e.g. bikelanes with physical separation from motorized traffic.',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its still "lane"-like and wider RVA would likely be tagged explicitly
  implicitOneWayConfidence = 'medium',
  condition = function(tags)
    -- Only target sidepath like ways
    if not IsSidepath(tags) then return false end

    -- We exclude separation that signals that the cycleway is not on the street but on the sidewalk
    local allowed_separation_values = Set({
      'bollard', 'flex_post', 'vertical_panel', 'studs', 'bump', 'planter', 'fence', 'jersey_barrier', 'guard_rail'
    })

    -- Has to have physical separation left
    -- All separation values are physical separations except for 'no'
    local separation_left = SANITIZE_ROAD_TAGS.separation(tags, 'left')
    local has_separation_left = allowed_separation_values[separation_left] ~= nil
    -- OR, for counter flow bikelanes with motorized traffic on the right, has to have physical separation right
    local separation_right = SANITIZE_ROAD_TAGS.separation(tags, 'right')
    local has_separation_right = allowed_separation_values[separation_right] ~= nil
    local traffic_mode_right = SANITIZE_ROAD_TAGS.traffic_mode(tags, 'right')
    if has_separation_left or (traffic_mode_right == 'motor_vehicle' and has_separation_right) then
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
-- (History: Until 2023-03-2: cyclewayAlone)
local sharedBusLaneBusWithBike = BikelaneCategory.new({
  -- Note: Was `sharedBusLane` until 2024-05-02 when we introduced `sharedBusLaneBikeWithBus`
  id = 'sharedBusLaneBusWithBike',
  desc = 'Bus lane with explicit allowance for bicycles (`cycleway=share_busway`).' ..
      ' (DE: "Bussonderfahrstreifen mit Fahrrad frei")',
  infrastructureExists = true,
  implicitOneWay = true, -- 'oneway=implicit_yes', its "shared lane"-like
  implicitOneWayConfidence = 'high',
  condition = function(tags)
    if tags.highway == "cycleway" and
        (tags.cycleway == "share_busway" or tags.cycleway == "opposite_share_busway") then
      return true
    end
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    if osm2pgsql.has_prefix(trafficSign, "DE:245") and
        (ContainsSubstring(trafficSign, "1022-10") or ContainsSubstring(trafficSign, "1022-14")) then
      return true
    end
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
  condition = function(tags)
    if tags.highway == "cycleway" and tags.lane == "share_busway" then
      return true
    end
    local trafficSign = SanitizeTrafficSign(tags.traffic_sign)
    if osm2pgsql.has_prefix(trafficSign, "DE:237") and (
        ContainsSubstring(trafficSign, "1024-14") or  -- Bus frei
        ContainsSubstring(trafficSign, '1026-32') -- Linienverkehr frei
      ) then
      return true
    end
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
  condition = function(tags)
    -- hack: because `cyclewayBetweenLanes` is now detected on the `self` object we need to filter out the right side here
    -- to fix this we would need to double classify objects
    if tags._side == 'right' then
      if (ContainsSubstring(tags['cycleway:lanes'], "|lane|") or
        ContainsSubstring(tags['bicycle:lanes'], "|designated|")) then
        return false
      end
    end

    if tags.cycleway == "shared" then
      -- We handle this as a campaign now because it is very likely not infrastructure
      return false
    end

    if tags.highway == "cycleway"
        or (tags.highway == "path" and tags.bicycle == "designated") then
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

function CategorizeBikelane(tags)
  for _, category in pairs(categoryDefinitions) do
    if category(tags) then
      return category
    end
  end
  return nil
end
