local SET = require('topics.helper.sets')
local highway_classes = require('topics.helper.highway_classes')

local exclude_highways = {
  -- Permanent closures only: temporary ones are turned into `lifecycle` by `transform_lifecycle_tags`
  -- before this runs. All other access values are decided by `helper/access_restriction.lua`.
  by_access_no = function(tags)
    if tags.access == 'no' then
      return true
    end
    if tags.highway == 'footway' and tags.foot == 'no' then
      return true
    end
    if tags.highway == 'cycleway' and tags.bicycle == 'no' then
      return true
    end

    return false
  end,

  -- Roads skip these; highwayAreas is the inverse and keeps them.
  -- See https://github.com/FixMyBerlin/private-issues/issues/1038
  by_area = function(tags)
    return tags.area == 'yes'
  end,

  by_other_tags = function(tags)
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

  by_highway_class = function(tags)
    if not tags.highway then return true end

    -- Skip stuff like 'construction' (some), 'proposed', 'platform' (Haltestellen), 'rest_area' (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
    -- REMINDER: Keep in sync with `processing/topics/roads_bikelanes/helper/transform_tags/transform_lifecycle_tags.lua`
    local allowed_highways = SET.join_sets({
      highway_classes.trunk_motorway_classes,
      highway_classes.major_road_classes,
      highway_classes.minor_road_classes,
      highway_classes.path_classes,
    })
    if allowed_highways[tags.highway] then
      return false
    end

    return true
  end,
}

return exclude_highways
