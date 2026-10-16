local HIGHWAYS = require('topics.helper.highway_classes')

local function lookup_row(merged, object_id)
  return merged[tonumber(object_id)]
end

local function apply_mapillary(object_tags, row)
  if row and row.mapillary_coverage then
    object_tags.mapillary_coverage = row.mapillary_coverage
  end
end

local function apply_sidepath(object_tags, row, highway)
  if not highway then
    return
  end
  if not HIGHWAYS.sidepath_highway_classes[highway] then
    return
  end

  if not row then
    object_tags._is_sidepath = 'assumed_no'
    return
  end

  if row.is_sidepath_estimation == 'true' then
    object_tags._is_sidepath = 'assumed_yes'
  else
    object_tags._is_sidepath = 'assumed_no'
  end

  if row.adjoining_road then
    object_tags._sidepath_adjoining_road = row.adjoining_road
  end
  if row.adjoining_maxspeed then
    object_tags._sidepath_adjoining_maxspeed = row.adjoining_maxspeed
  end
end

-- Kept as suffix → class map; each output line picks its own class (pseudo_route_relations.lua).
local function apply_radnetz_berlin(object_tags, row)
  if row and row.radnetz_berlin then
    object_tags._radnetz_berlin = row.radnetz_berlin
  end
end

local function apply_pseudo_tags(object_tags, object_id, merged, _object_geom)
  local row = lookup_row(merged, object_id)

  apply_mapillary(object_tags, row)
  apply_sidepath(object_tags, row, object_tags.highway)
  apply_radnetz_berlin(object_tags, row)
end

return apply_pseudo_tags
