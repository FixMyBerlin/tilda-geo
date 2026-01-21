require('init')
require('ContainsSubstring')
require('SanitizeTrafficSign')
require('Set')
require('BikelaneCategories')
local has_tag_with_prefix = require('has_tag_with_prefix')
-- local inspect = require('inspect')
BikelaneTodo = {}
BikelaneTodo.__index = BikelaneTodo

-- @param args table
-- @param args.id string
-- @param args.desc string
-- @param args.todoTableOnly boolean -- If true: hidden from Inspector; If false: visible in Inspector and Campaign-Dropdown
-- @param args.conditions function
function BikelaneTodo.new(args)
  local self = setmetatable({}, BikelaneTodo)
  self.id = args.id
  self.desc = args.desc
  self.todoTableOnly = args.todoTableOnly
  self.priority = args.priority
  self.conditions = args.conditions
  return self
end

function BikelaneTodo:__call(objectTags, resultTags)
  if self.conditions(objectTags, resultTags) then
    return {
      id = self.id,
      priority = self.priority(objectTags, resultTags),
      todoTableOnly = self.todoTableOnly,
    }
  else
    return nil
  end
end


-- ========
-- REMINDER
-- ========
-- Cleanup function is part of `processing/topics/roads_bikelanes/roads_bikelanes.sql`

-- === Bicycle Roads ===
local missing_traffic_sign_vehicle_destination = BikelaneTodo.new({
  id = "missing_traffic_sign_vehicle_destination",
  desc = "Expecting tag traffic_sign 'Anlieger frei' `traffic_sign=DE:244.1,1020-30` or similar.",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, _)
    return objectTags.bicycle_road == "yes"
    and (objectTags.vehicle == "destination" or objectTags.motor_vehicle == "destination")
    and not ContainsSubstring(objectTags.traffic_sign, "1020-30")
  end
})
local missing_traffic_sign_vehicle_destination__mapillary = BikelaneTodo.new({
  id = "missing_traffic_sign_vehicle_destination__mapillary",
  desc = "Expecting tag traffic_sign 'Anlieger frei' `traffic_sign=DE:244.1,1020-30` or similar.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and missing_traffic_sign_vehicle_destination(objectTags, _)
  end
})

-- Note: We ignore the misstagging of `motor_vehicle` instead of `vehicle` as it is currently hard to map in iD and not that relevant for routing.
local missing_traffic_sign_244 = BikelaneTodo.new({
  id = "missing_traffic_sign_244",
  desc = "Expecting tag `traffic_sign=DE:244.1` or similar.",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, _)
    return objectTags.bicycle_road == "yes"
      and not ContainsSubstring(objectTags.traffic_sign, '244')
      and not missing_traffic_sign_vehicle_destination(objectTags)
  end
})
local missing_traffic_sign_244__mapillary = BikelaneTodo.new({
  id = "missing_traffic_sign_244__mapillary",
  desc = "Expecting tag `traffic_sign=DE:244.1` or similar.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and missing_traffic_sign_244(objectTags, _)
  end
})

local missing_access_tag_bicycle_road = BikelaneTodo.new({
  id = "missing_access_tag_bicycle_road",
  desc = "Expected access tag `bicycle=designated` that is required for routing.",
  todoTableOnly = false,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, _)
    return objectTags.bicycle_road == "yes"
      -- Only check `vehicle` because `motor_vehicle` does allow `bicycle` already.
      -- However the wiki recomments `vehicle` over `motor_vehicle`, so once that is fixed this will trigger again.
      and (objectTags.vehicle == "no" or objectTags.vehicle == "destination")
      and objectTags.bicycle ~= 'designated'
  end
})
-- IDEA: Check if `motor_vehicle=*` instead of `vehicle=*` was used (https://wiki.openstreetmap.org/wiki/Tag:bicycle_road%3Dyes, https://wiki.openstreetmap.org/wiki/Key:access#Land-based_transportation)

-- === Traffic Signs ===
local malformed_traffic_sign = BikelaneTodo.new({
  id = "malformed_traffic_sign",
  desc = "Traffic sign tag needs cleaning up.",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    if (resultTags.category == nil) then return false end

    -- Compare raw with sanitized tag and create 'todo' if different
    if objectTags['traffic_sign'] ~= SanitizeTrafficSign(objectTags['traffic_sign']) then return true end
    if objectTags['traffic_sign:both'] ~= SanitizeTrafficSign(objectTags['traffic_sign:both']) then return true end
    if objectTags['traffic_sign:forward'] ~= SanitizeTrafficSign(objectTags['traffic_sign:forward']) then return true end
    if objectTags['traffic_sign:backward'] ~= SanitizeTrafficSign(objectTags['traffic_sign:backward']) then return true end
    return false
  end
})
local malformed_traffic_sign__mapillary = BikelaneTodo.new({
  id = "malformed_traffic_sign__mapillary",
  desc = "Traffic sign tag needs cleaning up.",
  todoTableOnly = true,
  priority = function(_, _) return 1 end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and malformed_traffic_sign(objectTags, resultTags)
  end
})

local missing_traffic_sign = BikelaneTodo.new({
  id = "missing_traffic_sign",
  desc = "Expected tag `traffic_sign=DE:*` or `traffic_sign=none`.",
  todoTableOnly = true,
  priority = function(objectTags, _)
    if objectTags.bicycle == "designated" then return "1" end
    if objectTags.bicycle == "yes" then return "2" end
    return "3"
  end,
  conditions = function(objectTags, resultTags)
    local traffic_sign = objectTags['traffic_sign'] or objectTags['traffic_sign:forward'] or objectTags['traffic_sign:backward']
    return traffic_sign == nil
      and not (
        missing_traffic_sign_244(objectTags) or
        missing_traffic_sign_vehicle_destination(objectTags)
        -- Add any new missing_traffic_sign_* here so we only trigger this TODO when no other traffic_sign todo is present.
      )
      and resultTags.category ~= 'cyclwayLink'
      and resultTags.category ~= 'crossing'
      and resultTags.category ~= 'needsClarification'
  end
})
local missing_traffic_sign__mapillary = BikelaneTodo.new({
  id = "missing_traffic_sign__mapillary",
  desc = "Expected tag `traffic_sign=DE:*` or `traffic_sign=none`.",
  todoTableOnly = true,
  priority = function(objectTags, _)
    if objectTags.bicycle == "designated" then return "1" end
    if objectTags.bicycle == "yes" then return "2" end
    return "3"
  end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and missing_traffic_sign(objectTags, resultTags)
  end
})

-- === Bike- and Foot Path ===
local missing_access_tag_240 = BikelaneTodo.new({
  id = "missing_access_tag_240",
  desc = "Expected tag `bicycle=designated` and `foot=designated`.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, _)
    return (ContainsSubstring(objectTags.traffic_sign, '240') or ContainsSubstring(objectTags.traffic_sign, '241'))
        and objectTags.bicycle ~= 'designated'
        and objectTags.foot ~= "designated"
        and objectTags.cycleway ~= 'track'
        and objectTags.cycleway ~= 'lane'
  end
})

-- TODO: If both bicycle=designated and foot=designated are present, check if the traffic_sign is 240 or 241.
local missing_segregated = BikelaneTodo.new({
  id = "missing_segregated",
  desc = "Expected tag `segregated=yes` or `segregated=no`.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    return resultTags.category == "needsClarification"
        and (objectTags.segregated ~= "yes" or objectTags.segregated ~= "no")
        and (
          (objectTags.bicycle == "designated" and objectTags.foot == "designated")
          or ContainsSubstring( objectTags.traffic_sign, '240')
          or ContainsSubstring( objectTags.traffic_sign, '241')
        )
  end
})
local missing_segregated__mapillary = BikelaneTodo.new({
  id = "missing_segregated__mapillary",
  desc = "Expected tag `segregated=yes` or `segregated=no`.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and missing_segregated(objectTags, resultTags)
  end
})

local unexpected_bicycle_access_on_footway = BikelaneTodo.new({
  id = "unexpected_bicycle_access_on_footway",
  desc = "Expected `highway=path+bicycle=designated` (unsigned/explicit DE:240)" ..
    "or `highway=footway+bicycle=yes` (unsigned/explicit DE:239,1022-10);"..
    " Add traffic_sign=none to specify unsigned path.",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    return objectTags.highway == 'footway'
      and objectTags.bicycle == 'designated'
      and resultTags.category == 'needsClarification'
  end
})
local unexpected_bicycle_access_on_footway__mapillary = BikelaneTodo.new({
  id = "unexpected_bicycle_access_on_footway__mapillary",
  desc = "Expected `highway=path+bicycle=designated` (unsigned/explicit DE:240)" ..
    "or `highway=footway+bicycle=yes` (unsigned/explicit DE:239,1022-10);"..
    " Add traffic_sign=none to specify unsigned path.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and unexpected_bicycle_access_on_footway(objectTags, resultTags)
  end
})

local unexpected_highway_path = BikelaneTodo.new({
  id = 'unexpected_highway_path',
  desc = 'Expected `highway=cyclway` (unsigned/explicit DE:237)',
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    local excluded_surfaces = Set({ 'ground', 'dirt', 'fine_gravel', 'gravel', 'pebblestone', 'earth' })
    return objectTags.highway == 'path'
      and objectTags.bicycle == 'designated'
      and objectTags.foot == 'no'
      -- REFERENCE: See conditions in `needsClarification` category
      and not (
        has_tag_with_prefix(objectTags, 'mtb:') or
        objectTags.mtb == 'yes' or
        excluded_surfaces[objectTags.surface]
      )
  end
})
local unexpected_highway_path__mapillary = BikelaneTodo.new({
  id = 'unexpected_highway_path__mapillary',
  desc = 'Expected `highway=cyclway` (unsigned/explicit DE:237)',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and unexpected_highway_path(objectTags, resultTags)
  end
})

-- === Infrastructure ===
local crossing_too_long = BikelaneTodo.new({
  id = "crossing_too_long",
  desc = "Crossing longer than 100 m, guidance form unclear. Please review and correct.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    return resultTags.category == 'needsClarification'
      and is_crossing_pattern(objectTags)
      and objectTags._length ~= nil
      and objectTags._length > 100
  end
})

local needs_clarification = BikelaneTodo.new({
  id = "needs_clarification",
  desc = "Tagging insufficient to categorize the bike infrastructure.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    return resultTags.category == "needsClarification"
      and not (
        objectTags.cycleway == "shared" -- Handled by RoadTodos.lua `deprecated_cycleway_shared`
        or unexpected_bicycle_access_on_footway(objectTags, resultTags)
        or crossing_too_long(objectTags, resultTags)
      )
  end
})
local needs_clarification__mapillary = BikelaneTodo.new({
  id = "needs_clarification__mapillary",
  desc = "Tagging insufficient to categorize the bike infrastructure.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and needs_clarification(objectTags, resultTags)
  end
})

-- Name is not precise anymore since we only include one sub-category here.
-- Background: https://github.com/FixMyBerlin/private-issues/issues/2081#issuecomment-2656458701
local adjoining_or_isolated = BikelaneTodo.new({
  id = "adjoining_or_isolated",
  desc = "Only for category=cycleway_adjoiningOrIsolated for now. Expected tag `is_sidepath=yes` or `is_sidepath=no`.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    return resultTags.category == 'cycleway_adjoiningOrIsolated'
  end
})

local advisory_or_exclusive = BikelaneTodo.new({
  id = "advisory_or_exclusive",
  desc = "Expected tag `cycleway:*:lane=advisory` or `exclusive`.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    return ContainsSubstring(resultTags.category, '_advisoryOrExclusive')
  end
})
local advisory_or_exclusive__mapillary = BikelaneTodo.new({
  id = "advisory_or_exclusive__mapillary",
  desc = "Expected tag `cycleway:*:lane=advisory` or `exclusive`.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and advisory_or_exclusive(objectTags, resultTags)
  end
})

local needs_clarification_track = BikelaneTodo.new({
  id = "needs_clarification_track",
  desc = "Tagging `cycleway=track` insufficient to categorize the bike infrastructure`.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, resultTags)
    if resultTags.category == "cyclewayOnHighwayProtected" then return false end
    if objectTags._parent == nil then return false end

    -- Some cases are tagged sufficiently with `cycleway:SIDE:segregated` or `cycleway:SIDE:traffic_signs`
    -- It is hard to check both sides propery. This will error on the side of caution.
    local segregated = objectTags._parent['cycleway:both:segregated'] or objectTags._parent['cycleway:left:segregated'] or objectTags._parent['cycleway:right:segregated']
    if segregated == "yes" or segregated == "no" then return false end
    local traffic_sign = objectTags._parent['cycleway:both:traffic_sign'] or objectTags._parent['cycleway:left:traffic_sign'] or objectTags._parent['cycleway:right:traffic_sign']
    if ContainsSubstring(traffic_sign, '240') or ContainsSubstring(traffic_sign, '241') then return false end

    return objectTags._parent['cycleway'] == "track"
      or objectTags._parent['cycleway:both'] == "track"
      or objectTags._parent['cycleway:left'] == "track"
      or objectTags._parent['cycleway:right'] == "track"
  end
})
local needs_clarification_track__mapillary = BikelaneTodo.new({
  id = "needs_clarification_track__mapillary",
  desc = "Tagging `cycleway=track` insufficient to categorize the bike infrastructure`.",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and needs_clarification_track(objectTags, resultTags)
  end
})

local mixed_cycleway_both = BikelaneTodo.new({
  id = "mixed_cycleway_both",
  desc = "Mixed tagging of cycleway=* or cycleway:both=* with cycleway:SIDE",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, _)
    if objectTags._parent == nil then return false end
    -- NOTE: This will trigger on "no" values. Which is OK, because the mix of "both" and "SIDE" is still not ideal.
    return (objectTags._parent['cycleway:both'] ~= nil and (objectTags._parent['cycleway:left'] ~= nil or objectTags._parent['cycleway:right'] ~= nil))
        or (objectTags._parent['cycleway'] ~= nil and (objectTags._parent['cycleway:left'] ~= nil or objectTags._parent['cycleway:right'] ~= nil))
  end
})
local mixed_cycleway_both__mapillary = BikelaneTodo.new({
  id = "mixed_cycleway_both__mapillary",
  desc = "Mixed tagging of cycleway=* or cycleway:both=* with cycleway:SIDE",
  todoTableOnly = true,
  priority = function(_, _) return "1" end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and mixed_cycleway_both(objectTags, resultTags)
  end
})

-- === Other ===
local days_in_year = 365
local currentness_too_old = BikelaneTodo.new({
  id = "currentness_too_old",
  desc = "Infrastructure that has not been edited for about 10 years",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage and resultTags._age_in_days >= days_in_year * 15 then return "1" end
    if objectTags.mapillary_coverage and resultTags._age_in_days >= days_in_year * 12 then return "2" end
    return "3"
  end,
  conditions = function(objectTags, resultTags)
    -- Sync date with `app/src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/mapboxStyles/groups/radinfra_currentness.ts`
    return resultTags.category ~= nil and resultTags._age_in_days ~= nil and resultTags._age_in_days >= days_in_year*10
  end
})
local currentness_too_old__mapillary = BikelaneTodo.new({
  id = "currentness_too_old__mapillary",
  desc = "Infrastructure that has not been edited for about 10 years",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if resultTags._age_in_days >= days_in_year * 15 then return "1" end
    if resultTags._age_in_days >= days_in_year * 12 then return "2" end
    return "3"
  end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and currentness_too_old(objectTags, resultTags)
  end
})

local missing_width = BikelaneTodo.new({
  id = 'missing_width',
  desc = 'Ways without `width`',
  todoTableOnly = true,
  priority =  function(objectTags, resultTags)
    if objectTags.mapillary_coverage and resultTags.surface == 'sett' then return '1' end
    if objectTags.mapillary_coverage and resultTags.surface ~= nil then return '2' end
    return '3'
  end,
  conditions = function(objectTags, resultTags)
    return resultTags.width == nil
      and resultTags.category ~= 'cyclwayLink'
      and resultTags.category ~= 'crossing'
      and resultTags.category ~= 'pedestrianAreaBicycleYes'
      and resultTags.category ~= 'needsClarification'
      and not ContainsSubstring(resultTags.category, 'cyclewayOnHighway')
      and not ContainsSubstring(resultTags.category, 'sharedBusLane')
  end
})
local missing_width_surface_sett__mapillary = BikelaneTodo.new({
  id = 'missing_width_surface_sett__mapillary',
  desc = 'Ways without `width` but `surface=sett` to count stones',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage
      and missing_width(objectTags, resultTags)
      and resultTags.surface == 'sett' -- When surface=sett, one can count the stones to get the width
  end
})

local missing_surface = BikelaneTodo.new({
  id = "missing_surface",
  desc = "Ways without `surface`",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if resultTags.category == 'crossing' then return "3" end
    if objectTags.mapillary_coverage then return "1" end
    return "2"
  end,
  conditions = function(objectTags, resultTags)
    -- Either the surface is missing. But also surface values that are not derived from the osm tag, should be added.
    -- (ATM all values are derive from osm tags, see processing/topics/helper/DeriveSurface.lua)
    return (resultTags.surface == nil or resultTags.surface_source ~= 'tag')
      and resultTags.category ~= 'cyclwayLink'
      and resultTags.category ~= 'needsClarification'
      and not ContainsSubstring(resultTags.category, 'cyclewayOnHighway')
      and not ContainsSubstring(resultTags.category, 'sharedBusLane')
  end
})
local missing_surface__mapillary = BikelaneTodo.new({
  id = "missing_surface__mapillary",
  desc = "Ways without `surface`",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if resultTags.category == 'crossing' then return "2" end
    return "1"
  end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and missing_surface(objectTags, resultTags)
  end
})

local missing_oneway = BikelaneTodo.new({
  id = "missing_oneway",
  desc = "Ways without explicit `oneway`",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if resultTags.oneway == 'assumed_no' and objectTags.mapillary_coverage then return "1" end
    if resultTags.oneway == 'assumed_no' or objectTags.mapillary_coverage then return "2" end
    return "3"
  end,
  conditions = function(objectTags, resultTags)
    -- Skip if the "track" campaign is present
    if needs_clarification_track(objectTags, resultTags) then return false end
    if needs_clarification(objectTags, resultTags) then return false end
    -- We rely on `_implicitOneWayConfidence` from `processing/topics/roads_bikelanes/bikelanes/BikelaneCategories.lua`
    -- But some infra it not relevant enough for now:
    if resultTags.category == 'crossing' then return false end
    if resultTags.category == 'cyclewayLink' then return false end
    if not (resultTags.oneway == 'assumed_no' or resultTags.oneway == 'implicit_yes') then return false end
    return resultTags._implicitOneWayConfidence == 'low'
  end
})
local missing_oneway__mapillary = BikelaneTodo.new({
  id = "missing_oneway__mapillary",
  desc = "Ways without explicit `oneway`",
  todoTableOnly = true,
  priority = function(objectTags, resultTags)
    if resultTags.oneway == 'assumed_no' then return "1" end
    return "2"
  end,
  conditions = function(objectTags, resultTags)
    return objectTags.mapillary_coverage and missing_oneway(objectTags, resultTags)
  end
})

BikelaneTodos = {
  -- REMINDER: Always use snake_case, never camelCase
  -- Infrastructure
  crossing_too_long,
  needs_clarification,
  adjoining_or_isolated,
  advisory_or_exclusive,
  needs_clarification_track,
  mixed_cycleway_both,
  unexpected_highway_path,
  -- Bicycle Roads
  missing_traffic_sign_vehicle_destination,
  missing_traffic_sign_244,
  missing_access_tag_bicycle_road,
  -- Traffic Signs
  missing_traffic_sign,
  malformed_traffic_sign,
  -- Bike- and Foot Path
  missing_access_tag_240,
  missing_segregated,
  unexpected_bicycle_access_on_footway,
  -- Other
  currentness_too_old,
  missing_width,
  missing_surface,
  missing_oneway,

  -- Mapillary versions…
  missing_traffic_sign_vehicle_destination__mapillary,
  missing_traffic_sign_244__mapillary,
  malformed_traffic_sign__mapillary,
  missing_traffic_sign__mapillary,
  missing_segregated__mapillary,
  unexpected_bicycle_access_on_footway__mapillary,
  needs_clarification__mapillary,
  advisory_or_exclusive__mapillary,
  needs_clarification_track__mapillary,
  mixed_cycleway_both__mapillary,
  unexpected_highway_path__mapillary,
  currentness_too_old__mapillary,
  missing_width_surface_sett__mapillary,
  missing_surface__mapillary,
  missing_oneway__mapillary,
}
