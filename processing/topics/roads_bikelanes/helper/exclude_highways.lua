require('Set')
require('JoinSets')
require('HighwayClasses')

local exclude_highways = {
  by_access = function(tags, forbidden_accesses)
    if tags.access and forbidden_accesses[tags.access] then
      return true
    end
    if tags.highway == 'footway' and tags.foot and forbidden_accesses[tags.foot] then
      return true
    end
    if tags.highway == 'cycleway' and tags.bicycle and forbidden_accesses[tags.bicycle] then
      return true
    end

    return false
  end,

  by_service = function(tags)
    -- Skip all unwanted `highway=service + service=<value>` values
    -- The key can have random values, we mainly want to skip
    -- - 'driveway' which we consider implicitly private
    -- - 'parking_aisle' which we do not consider part of the road network (they need a regular service highway if other roads connect)
    -- - 'emergency_access' which we consider a special kind of driveway
    -- - 'drive-through' which we do not consider part of the road network; and which results in false positives for our oneway-plus layer
    --
    -- Exception: Include service highways with explicit bicycle access
    -- - bicycle=designated
    -- - bicycle:left|right|both=* where * is not "no"
    --
    if tags.bicycle == 'designated' then
      return false
    end

    if tags['bicycle:left'] and tags['bicycle:left'] ~= 'no' then
      return false
    end
    if tags['bicycle:right'] and tags['bicycle:right'] ~= 'no' then
      return false
    end
    if tags['bicycle:both'] and tags['bicycle:both'] ~= 'no' then
      return false
    end

    -- REMINDER: Keep this in sync with processing/topics/roads_bikelanes/roads/RoadClassificationRoadValue.lua
    local allowed_service = Set({ 'alley' })
    if tags.service and not allowed_service[tags.service] then
      return true
    end

    return false
  end,

  by_other_tags = function(tags)
    -- Skip any area. See https://github.com/FixMyBerlin/private-issues/issues/1038 for more.
    if tags.area == 'yes' then
      return true
    end

    -- Skip piers
    if tags.man_made == 'pier' then
      return true
    end

    -- https://wiki.openstreetmap.org/wiki/Tag:leisure%3Dtrack needed to filter some MTB `path`
    if tags.leisure == 'track' then
      return true
    end

    return false
  end,

  by_indoor = function(tags)
    if tags.indoor == 'yes' then
      return true
    end

    return false
  end,

  by_informal = function(tags)
    if tags.informal == 'yes' then
      return true
    end

    return false
  end,

  by_highway_class = function(tags)
    if not tags.highway then return true end

    -- Skip stuff like 'construction' (some), 'proposed', 'platform' (Haltestellen), 'rest_area' (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
    -- REMINDER: Keep in sync with `processing/topics/roads_bikelanes/helper/transform_tags/transform_lifecycle_tags.lua`
    local allowed_highways = JoinSets({ HighwayClasses, MajorRoadClasses, MinorRoadClasses, PathClasses })
    if allowed_highways[tags.highway] then
      return false
    end

    return true
  end
}

return exclude_highways
