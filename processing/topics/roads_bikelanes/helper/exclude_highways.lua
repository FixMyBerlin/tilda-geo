require('Set')

local function exclude_by_access(tags, forbidden_accesses)
  if tags.access and forbidden_accesses[tags.access] then
    return true
  end
  if (tags.highway == 'footway' or tags.highway == 'path') and tags.foot and forbidden_accesses[tags.foot] then
    return true
  end
  if tags.highway == 'cycleway' and tags.bicycle and forbidden_accesses[tags.bicycle] then
    return true
  end

  return false
end

local function exclude_by_service(tags)
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
end

local function exclude_by_area_water(tags)
  -- Skip any area. See https://github.com/FixMyBerlin/private-issues/issues/1038 for more.
  if tags.area == 'yes' then
    return true
  end

  -- Skip piers
  if tags.man_made == 'pier' then
    return true
  end

  return false
end

local function exclude_by_indoor(tags)
  if tags.indoor == 'yes' then
    return true
  end

  return false
end

local function exclude_by_informal(tags)
  if tags.informal == 'yes' then
    return true
  end

  return false
end

return {
  by_access = exclude_by_access,
  by_service = exclude_by_service,
  by_indoor = exclude_by_indoor,
  by_informal = exclude_by_informal,
  by_area_water = exclude_by_area_water
}
