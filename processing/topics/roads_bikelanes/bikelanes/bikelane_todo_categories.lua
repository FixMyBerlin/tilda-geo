local contains_substring = require('topics.helper.contains_substring')
local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')
local SET = require('topics.helper.sets')
local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local has_tag_with_prefix = require('topics.helper.has_tag_with_prefix')
-- local inspect = require('inspect')
local BikelaneTodo = {}
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

function BikelaneTodo:__call(object_tags, result_tags)
  if self.conditions(object_tags, result_tags) then
    return {
      id = self.id,
      priority = self.priority(object_tags, result_tags),
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
  id = 'missing_traffic_sign_vehicle_destination',
  desc = 'Expecting tag traffic_sign \'Anlieger frei\' `traffic_sign=DE:244.1,1020-30` or similar.',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, _)
    return object_tags.bicycle_road == 'yes'
    and (object_tags.vehicle == 'destination' or object_tags.motor_vehicle == 'destination')
    and not contains_substring(object_tags.traffic_sign, '1020-30')
  end
})
local missing_traffic_sign_vehicle_destination__mapillary = BikelaneTodo.new({
  id = 'missing_traffic_sign_vehicle_destination__mapillary',
  desc = 'Expecting tag traffic_sign \'Anlieger frei\' `traffic_sign=DE:244.1,1020-30` or similar.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and missing_traffic_sign_vehicle_destination(object_tags, result_tags)
  end
})

-- Note: We ignore the misstagging of `motor_vehicle` instead of `vehicle` as it is currently hard to map in iD and not that relevant for routing.
local missing_traffic_sign_244 = BikelaneTodo.new({
  id = 'missing_traffic_sign_244',
  desc = 'Expecting tag `traffic_sign=DE:244.1` or similar.',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, _)
    return object_tags.bicycle_road == 'yes'
      and not contains_substring(object_tags.traffic_sign, '244')
      and not missing_traffic_sign_vehicle_destination(object_tags)
  end
})
local missing_traffic_sign_244__mapillary = BikelaneTodo.new({
  id = 'missing_traffic_sign_244__mapillary',
  desc = 'Expecting tag `traffic_sign=DE:244.1` or similar.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and missing_traffic_sign_244(object_tags, result_tags)
  end
})

local missing_access_tag_bicycle_road = BikelaneTodo.new({
  id = 'missing_access_tag_bicycle_road',
  desc = 'Expected access tag `bicycle=designated` that is required for routing.',
  todoTableOnly = false,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, _)
    return object_tags.bicycle_road == 'yes'
      -- Only check `vehicle` because `motor_vehicle` does allow `bicycle` already.
      -- However the wiki recomments `vehicle` over `motor_vehicle`, so once that is fixed this will trigger again.
      and (object_tags.vehicle == 'no' or object_tags.vehicle == 'destination')
      and object_tags.bicycle ~= 'designated'
  end
})
-- IDEA: Check if `motor_vehicle=*` instead of `vehicle=*` was used (https://wiki.openstreetmap.org/wiki/Tag:bicycle_road%3Dyes, https://wiki.openstreetmap.org/wiki/Key:access#Land-based_transportation)

-- === Traffic Signs ===
local malformed_traffic_sign = BikelaneTodo.new({
  id = 'malformed_traffic_sign',
  desc = 'Traffic sign tag needs cleaning up.',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    if (result_tags.category == nil) then return false end

    -- Compare raw with sanitized tag and create 'todo' if different
    if object_tags['traffic_sign'] ~= sanitize_traffic_sign(object_tags['traffic_sign']) then return true end
    if object_tags['traffic_sign:both'] ~= sanitize_traffic_sign(object_tags['traffic_sign:both']) then return true end
    if object_tags['traffic_sign:forward'] ~= sanitize_traffic_sign(object_tags['traffic_sign:forward']) then return true end
    if object_tags['traffic_sign:backward'] ~= sanitize_traffic_sign(object_tags['traffic_sign:backward']) then return true end
    return false
  end
})
local malformed_traffic_sign__mapillary = BikelaneTodo.new({
  id = 'malformed_traffic_sign__mapillary',
  desc = 'Traffic sign tag needs cleaning up.',
  todoTableOnly = true,
  priority = function(_, _) return 1 end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and malformed_traffic_sign(object_tags, result_tags)
  end
})

local missing_traffic_sign = BikelaneTodo.new({
  id = 'missing_traffic_sign',
  desc = 'Expected tag `traffic_sign=DE:*` or `traffic_sign=none`.',
  todoTableOnly = true,
  priority = function(object_tags, _)
    if object_tags.bicycle == 'designated' then return '1' end
    if object_tags.bicycle == 'yes' then return '2' end
    return '3'
  end,
  conditions = function(object_tags, result_tags)
    local traffic_sign = object_tags['traffic_sign'] or object_tags['traffic_sign:forward'] or object_tags['traffic_sign:backward']
    return traffic_sign == nil
      and not (
        missing_traffic_sign_244(object_tags) or
        missing_traffic_sign_vehicle_destination(object_tags)
        -- Add any new missing_traffic_sign_* here so we only trigger this TODO when no other traffic_sign todo is present.
      )
      and result_tags.category ~= 'cyclwayLink'
      and result_tags.category ~= 'crossing'
      and result_tags.category ~= 'needsClarification'
  end
})
local missing_traffic_sign__mapillary = BikelaneTodo.new({
  id = 'missing_traffic_sign__mapillary',
  desc = 'Expected tag `traffic_sign=DE:*` or `traffic_sign=none`.',
  todoTableOnly = true,
  priority = function(object_tags, _)
    if object_tags.bicycle == 'designated' then return '1' end
    if object_tags.bicycle == 'yes' then return '2' end
    return '3'
  end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and missing_traffic_sign(object_tags, result_tags)
  end
})

-- === Bike- and Foot Path ===
local missing_access_tag_240 = BikelaneTodo.new({
  id = 'missing_access_tag_240',
  desc = 'Expected tag `bicycle=designated` and `foot=designated`.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, _)
    return (contains_substring(object_tags.traffic_sign, '240') or contains_substring(object_tags.traffic_sign, '241'))
        and object_tags.bicycle ~= 'designated'
        and object_tags.foot ~= 'designated'
        and object_tags.cycleway ~= 'track'
        and object_tags.cycleway ~= 'lane'
  end
})

-- TODO: If both bicycle=designated and foot=designated are present, check if the traffic_sign is 240 or 241.
local missing_segregated = BikelaneTodo.new({
  id = 'missing_segregated',
  desc = 'Expected tag `segregated=yes` or `segregated=no`.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return result_tags.category == 'needsClarification'
        and (object_tags.segregated ~= 'yes' or object_tags.segregated ~= 'no')
        and (
          (object_tags.bicycle == 'designated' and object_tags.foot == 'designated')
          or contains_substring( object_tags.traffic_sign, '240')
          or contains_substring( object_tags.traffic_sign, '241')
        )
  end
})
local missing_segregated__mapillary = BikelaneTodo.new({
  id = 'missing_segregated__mapillary',
  desc = 'Expected tag `segregated=yes` or `segregated=no`.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and missing_segregated(object_tags, result_tags)
  end
})

local unexpected_bicycle_access_on_footway = BikelaneTodo.new({
  id = 'unexpected_bicycle_access_on_footway',
  desc = 'Expected `highway=path+bicycle=designated` (unsigned/explicit DE:240)' ..
    'or `highway=footway+bicycle=yes` (unsigned/explicit DE:239,1022-10);'..
    ' Add traffic_sign=none to specify unsigned path.',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return object_tags.highway == 'footway'
      and object_tags.bicycle == 'designated'
      and result_tags.category == 'needsClarification'
  end
})
local unexpected_bicycle_access_on_footway__mapillary = BikelaneTodo.new({
  id = 'unexpected_bicycle_access_on_footway__mapillary',
  desc = 'Expected `highway=path+bicycle=designated` (unsigned/explicit DE:240)' ..
    'or `highway=footway+bicycle=yes` (unsigned/explicit DE:239,1022-10);'..
    ' Add traffic_sign=none to specify unsigned path.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and unexpected_bicycle_access_on_footway(object_tags, result_tags)
  end
})

local unexpected_highway_path = BikelaneTodo.new({
  id = 'unexpected_highway_path',
  desc = 'Expected `highway=cyclway` (unsigned/explicit DE:237)',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    local excluded_surfaces = SET.set({ 'ground', 'dirt', 'fine_gravel', 'gravel', 'pebblestone', 'earth' })
    return object_tags.highway == 'path'
      and object_tags.bicycle == 'designated'
      and object_tags.foot == 'no'
      -- REFERENCE: See conditions in `needsClarification` category
      and not (
        has_tag_with_prefix(object_tags, 'mtb:') or
        object_tags.mtb == 'yes' or
        excluded_surfaces[object_tags.surface]
      )
  end
})
local unexpected_highway_path__mapillary = BikelaneTodo.new({
  id = 'unexpected_highway_path__mapillary',
  desc = 'Expected `highway=cyclway` (unsigned/explicit DE:237)',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and unexpected_highway_path(object_tags, result_tags)
  end
})

-- === Infrastructure ===
local crossing_too_long = BikelaneTodo.new({
  id = 'crossing_too_long',
  desc = 'Crossing longer than 100 m, guidance form unclear. Please review and correct.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return result_tags.category == 'needsClarification'
      and bikelane_categories.is_crossing_pattern(object_tags)
      and object_tags._length ~= nil
      and object_tags._length > 100
  end
})

local needs_clarification = BikelaneTodo.new({
  id = 'needs_clarification',
  desc = 'Tagging insufficient to categorize the bike infrastructure.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return result_tags.category == 'needsClarification'
      and not (
        object_tags.cycleway == 'shared' -- Handled by RoadTodos.lua `deprecated_cycleway_shared`
        or unexpected_bicycle_access_on_footway(object_tags, result_tags)
        or crossing_too_long(object_tags, result_tags)
        or missing_segregated(object_tags, result_tags)
      )
  end
})
local needs_clarification__mapillary = BikelaneTodo.new({
  id = 'needs_clarification__mapillary',
  desc = 'Tagging insufficient to categorize the bike infrastructure.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and needs_clarification(object_tags, result_tags)
  end
})

-- Name is not precise anymore since we only include one sub-category here.
-- Background: https://github.com/FixMyBerlin/private-issues/issues/2081#issuecomment-2656458701
local adjoining_or_isolated = BikelaneTodo.new({
  id = 'adjoining_or_isolated',
  desc = 'Only for category=cycleway_adjoiningOrIsolated for now. Expected tag `is_sidepath=yes` or `is_sidepath=no`.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return result_tags.category == 'cycleway_adjoiningOrIsolated'
  end
})

local advisory_or_exclusive = BikelaneTodo.new({
  id = 'advisory_or_exclusive',
  desc = 'Expected tag `cycleway:*:lane=advisory` or `exclusive`.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return contains_substring(result_tags.category, '_advisoryOrExclusive')
  end
})
local advisory_or_exclusive__mapillary = BikelaneTodo.new({
  id = 'advisory_or_exclusive__mapillary',
  desc = 'Expected tag `cycleway:*:lane=advisory` or `exclusive`.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and advisory_or_exclusive(object_tags, result_tags)
  end
})

local needs_clarification_track = BikelaneTodo.new({
  id = 'needs_clarification_track',
  desc = 'Tagging `cycleway=track` insufficient to categorize the bike infrastructure`.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    if result_tags.category == 'cyclewayOnHighwayProtected' then return false end
    if object_tags._parent == nil then return false end

    -- Some cases are tagged sufficiently with `cycleway:SIDE:segregated` or `cycleway:SIDE:traffic_signs`
    -- It is hard to check both sides propery. This will error on the side of caution.
    local segregated = object_tags._parent['cycleway:both:segregated'] or object_tags._parent['cycleway:left:segregated'] or object_tags._parent['cycleway:right:segregated']
    if segregated == 'yes' or segregated == 'no' then return false end
    local traffic_sign = object_tags._parent['cycleway:both:traffic_sign'] or object_tags._parent['cycleway:left:traffic_sign'] or object_tags._parent['cycleway:right:traffic_sign']
    if contains_substring(traffic_sign, '240') or contains_substring(traffic_sign, '241') then return false end

    return object_tags._parent['cycleway'] == 'track'
      or object_tags._parent['cycleway:both'] == 'track'
      or object_tags._parent['cycleway:left'] == 'track'
      or object_tags._parent['cycleway:right'] == 'track'
  end
})
local needs_clarification_track__mapillary = BikelaneTodo.new({
  id = 'needs_clarification_track__mapillary',
  desc = 'Tagging `cycleway=track` insufficient to categorize the bike infrastructure`.',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and needs_clarification_track(object_tags, result_tags)
  end
})

local mixed_cycleway_both = BikelaneTodo.new({
  id = 'mixed_cycleway_both',
  desc = 'Mixed tagging of cycleway=* or cycleway:both=* with cycleway:SIDE',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, _)
    if object_tags._parent == nil then return false end
    -- NOTE: This will trigger on 'no' values. Which is OK, because the mix of 'both' and 'SIDE' is still not ideal.
    return (object_tags._parent['cycleway:both'] ~= nil and (object_tags._parent['cycleway:left'] ~= nil or object_tags._parent['cycleway:right'] ~= nil))
        or (object_tags._parent['cycleway'] ~= nil and (object_tags._parent['cycleway:left'] ~= nil or object_tags._parent['cycleway:right'] ~= nil))
  end
})
local mixed_cycleway_both__mapillary = BikelaneTodo.new({
  id = 'mixed_cycleway_both__mapillary',
  desc = 'Mixed tagging of cycleway=* or cycleway:both=* with cycleway:SIDE',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and mixed_cycleway_both(object_tags, result_tags)
  end
})

-- === Other ===
local days_in_year = 365
local currentness_too_old = BikelaneTodo.new({
  id = 'currentness_too_old',
  desc = 'Infrastructure that has not been edited for about 10 years',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage and result_tags._age_in_days >= days_in_year * 15 then return '1' end
    if object_tags.mapillary_coverage and result_tags._age_in_days >= days_in_year * 12 then return '2' end
    return '3'
  end,
  conditions = function(object_tags, result_tags)
    -- Sync date with `app/src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/mapboxStyles/groups/radinfra_currentness.ts`
    return result_tags.category ~= nil and result_tags._age_in_days ~= nil and result_tags._age_in_days >= days_in_year*10
  end
})
local currentness_too_old__mapillary = BikelaneTodo.new({
  id = 'currentness_too_old__mapillary',
  desc = 'Infrastructure that has not been edited for about 10 years',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if result_tags._age_in_days >= days_in_year * 15 then return '1' end
    if result_tags._age_in_days >= days_in_year * 12 then return '2' end
    return '3'
  end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and currentness_too_old(object_tags, result_tags)
  end
})

local missing_width = BikelaneTodo.new({
  id = 'missing_width',
  desc = 'Ways without `width`',
  todoTableOnly = true,
  priority =  function(object_tags, result_tags)
    if object_tags.mapillary_coverage and result_tags.surface == 'sett' then return '1' end
    if object_tags.mapillary_coverage and result_tags.surface ~= nil then return '2' end
    return '3'
  end,
  conditions = function(object_tags, result_tags)
    return result_tags.width == nil
      and result_tags.category ~= 'cyclwayLink'
      and result_tags.category ~= 'crossing'
      and result_tags.category ~= 'pedestrianAreaBicycleYes'
      and result_tags.category ~= 'needsClarification'
      and not contains_substring(result_tags.category, 'cyclewayOnHighway')
      and not contains_substring(result_tags.category, 'sharedBusLane')
  end
})
local missing_width_surface_sett__mapillary = BikelaneTodo.new({
  id = 'missing_width_surface_sett__mapillary',
  desc = 'Ways without `width` but `surface=sett` to count stones',
  todoTableOnly = true,
  priority = function(_, _) return '1' end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage
      and missing_width(object_tags, result_tags)
      and result_tags.surface == 'sett' -- When surface=sett, one can count the stones to get the width
  end
})

local missing_surface = BikelaneTodo.new({
  id = 'missing_surface',
  desc = 'Ways without `surface`',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if result_tags.category == 'crossing' then return '3' end
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    -- Either the surface is missing. But also surface values that are not derived from the osm tag, should be added.
    -- (ATM all values are derive from osm tags, see processing/topics/helper/derive_surface.lua)
    return (result_tags.surface == nil or result_tags.surface_source ~= 'tag')
      and result_tags.category ~= 'cyclwayLink'
      and result_tags.category ~= 'needsClarification'
      and not contains_substring(result_tags.category, 'cyclewayOnHighway')
      and not contains_substring(result_tags.category, 'sharedBusLane')
  end
})
local missing_surface__mapillary = BikelaneTodo.new({
  id = 'missing_surface__mapillary',
  desc = 'Ways without `surface`',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if result_tags.category == 'crossing' then return '2' end
    return '1'
  end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and missing_surface(object_tags, result_tags)
  end
})

local missing_oneway = BikelaneTodo.new({
  id = 'missing_oneway',
  desc = 'Ways without explicit `oneway`',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if result_tags.oneway == 'assumed_no' and object_tags.mapillary_coverage then return '1' end
    if result_tags.oneway == 'assumed_no' or object_tags.mapillary_coverage then return '2' end
    return '3'
  end,
  conditions = function(object_tags, result_tags)
    -- Skip if the 'track' campaign is present
    if needs_clarification_track(object_tags, result_tags) then return false end
    if needs_clarification(object_tags, result_tags) then return false end
    -- We rely on `_implicitOneWayConfidence` from `processing/topics/roads_bikelanes/bikelanes/BikelaneCategories.lua`
    -- But some infra it not relevant enough for now:
    if result_tags.category == 'crossing' then return false end
    if result_tags.category == 'cyclewayLink' then return false end
    if not (result_tags.oneway == 'assumed_no' or result_tags.oneway == 'implicit_yes') then return false end
    return result_tags._implicitOneWayConfidence == 'low'
  end
})
local missing_oneway__mapillary = BikelaneTodo.new({
  id = 'missing_oneway__mapillary',
  desc = 'Ways without explicit `oneway`',
  todoTableOnly = true,
  priority = function(object_tags, result_tags)
    if result_tags.oneway == 'assumed_no' then return '1' end
    return '2'
  end,
  conditions = function(object_tags, result_tags)
    return object_tags.mapillary_coverage and missing_oneway(object_tags, result_tags)
  end
})

local bikelane_todo_categories = {
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

return bikelane_todo_categories
