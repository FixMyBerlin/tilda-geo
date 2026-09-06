local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local round = require('topics.helper.round')
local extract_public_tags = require('topics.helper.extract_public_tags')
local transform_lifecycle_tags = require('topics.roads_bikelanes.helper.transform_tags.transform_lifecycle_tags')
local result_tags = require('topics.roads_bikelanes.helper.result_tags')
local road_generalization = require('topics.roads_bikelanes.roads.road_generalization')
local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local LOG_ERROR = require('topics.roads_bikelanes.roads_bikelanes_errors')
local highway_areas_table = require('topics.roads_bikelanes.roads_bikelanes_tables').highway_areas_table

---@param object table
local function process_highway_area(object)
  ---@type OsmTags
  local object_tags = object.tags
  transform_lifecycle_tags(object_tags)
  if EXIT.exit_processing(object_tags, true) then
    return
  end

  local geom = object:as_multipolygon()
  object_tags._type = object.type
  object_tags._id = object.id
  object_tags._area = round(geom:transform(5243):area(), 2)

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

  local caller_name = object.type == 'relation' and 'highway_areas_relation' or 'highway_areas_way'
  LOG_ERROR.SANITIZED_VALUE(object_tags._type, object_tags._id, geom, replaced_tags, caller_name)

  highway_areas_table:insert({
    id = default_id(object),
    tags = extract_public_tags(shared_result_tags),
    meta = metadata(object),
    geom = geom,
    minzoom = road_generalization(object_tags, shared_result_tags),
  })
end

return {
  process_highway_area = process_highway_area,
}
