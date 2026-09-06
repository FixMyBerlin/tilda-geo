local CLONE = require('topics.helper.clones')
local SET = require('topics.helper.sets')
local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local round = require('topics.helper.round')
local extract_public_tags = require('topics.helper.extract_public_tags')
local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')
local road_generalization = require('topics.roads_bikelanes.roads.road_generalization')
local exclude = require('topics.roads_bikelanes.helper.exclude_highways')
local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local LOG_ERROR = require('topics.roads_bikelanes.roads_bikelanes_errors')
local roads_bikelanes_tables

local function get_highway_areas_table()
  if roads_bikelanes_tables == nil then
    roads_bikelanes_tables = require('topics.roads_bikelanes.roads_bikelanes_tables')
  end
  return roads_bikelanes_tables.highway_areas_table
end

local forbidden_accesses_roads = SET.join_sets({
  EXIT.forbidden_accesses_bikelanes,
  SET.set({ 'destination', 'customers' })
})

---@param tags OsmTags
local function normalize_highway_area_tags(tags)
  if tags['area:highway'] and tags.highway == nil then
    tags.highway = tags['area:highway']
  end
end

---@param object table
---@return boolean
local function is_highway_area_way(object)
  if object.type ~= 'way' or not object.is_closed then
    return false
  end

  local tags = object.tags
  if tags['area:highway'] then
    return true
  end

  return tags.highway ~= nil and tags.area == 'yes'
end

---@param tags OsmTags
---@return boolean
local function should_skip_highway_area(tags)
  if exclude.by_highway_class(tags) then
    return true
  end
  if exclude.by_access(tags, forbidden_accesses_roads) then
    return true
  end
  if exclude.by_service(tags) then
    return true
  end
  if exclude.by_indoor(tags) then
    return true
  end
  if exclude.by_informal(tags) then
    return true
  end

  if tags.man_made == 'pier' then
    return true
  end
  if tags.leisure == 'track' then
    return true
  end

  return false
end

---@param object table
local function process_highway_area_object(object)
  ---@type OsmTags
  local object_tags = CLONE.structured_clone(object.tags)
  normalize_highway_area_tags(object_tags)
  transform_lifecycle_tags(object_tags)
  if should_skip_highway_area(object_tags) then
    return
  end

  object_tags._type = object.type
  object_tags._id = object.id
  if object.type == 'way' then
    object_tags._length = round(object:as_linestring():transform(5243):length(), 2)
  else
    object_tags._length = 0
  end

  local shared_result_tags = result_tags(object_tags)
  local public_result_tags = extract_public_tags(shared_result_tags)
  local cleaned_public, replaced_tags = CLEANER.separate_tags(
    public_result_tags,
    object_tags,
    SANITIZE_ROAD_TAGS.log_source_overrides(object_tags)
  )
  for k in pairs(public_result_tags) do
    shared_result_tags[k] = cleaned_public[k]
  end

  local geom = object:as_multipolygon()
  local caller_name = object.type == 'relation' and 'highway_areas_relation' or 'highway_areas_way'
  LOG_ERROR.SANITIZED_VALUE(object_tags._type, object_tags._id, geom, replaced_tags, caller_name)

  get_highway_areas_table():insert({
    id = default_id(object),
    tags = extract_public_tags(shared_result_tags),
    meta = metadata(object),
    geom = geom,
    minzoom = road_generalization(object_tags, shared_result_tags),
  })
end

---@param object table
---@return boolean
local function try_process_way(object)
  if not is_highway_area_way(object) then
    return false
  end

  process_highway_area_object(object)
  return true
end

---@param object table
local function process_relation(object)
  if object.type ~= 'relation' then
    return
  end

  local tags = object.tags
  if tags.highway == nil and tags['area:highway'] == nil then
    return
  end

  process_highway_area_object(object)
end

return {
  try_process_way = try_process_way,
  process_relation = process_relation,
  is_highway_area_way = is_highway_area_way,
  should_skip_highway_area = should_skip_highway_area,
}
