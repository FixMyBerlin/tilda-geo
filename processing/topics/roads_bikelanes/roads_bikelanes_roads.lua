local SET = require('topics.helper.sets')
local highway_classes = require('topics.helper.highway_classes')
local exclude = require('topics.roads_bikelanes.helper.exclude_highways')
local maxspeed = require('topics.roads_bikelanes.maxspeed.maxspeed')
local merge_table = require('topics.helper.merge_table')
local category_is_sidepath = require('topics.roads_bikelanes.bikelanes.categories.category_is_sidepath')
local extract_public_tags = require('topics.helper.extract_public_tags')
local default_id = require('topics.helper.default_id')
local paths_generalization = require('topics.roads_bikelanes.paths.paths_generalization')
local road_generalization = require('topics.roads_bikelanes.roads.road_generalization')
local road_todo_categories = require('topics.roads_bikelanes.roads.road_todo_categories')
local collect_todos = require('topics.helper.collect_todos')
local to_markdown_list = require('topics.helper.to_markdown_list')
local to_todo_tags = require('topics.helper.to_todo_tags')
local categorize_bike_suitability = require('topics.roads_bikelanes.roads.bike_suitability')
local road_classification_road_value = require('topics.roads_bikelanes.roads.road_classification_road_value')
local transform_highway_path_with_foot_or_bicycle_no = require('topics.roads_bikelanes.helper.transform_tags.transform_highway_path_with_foot_or_bicycle_no')
local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local LOG_ERROR = require('topics.roads_bikelanes.roads_bikelanes_errors')
local roads_bikelanes_tables = require('topics.roads_bikelanes.roads_bikelanes_tables')

local roads_table = roads_bikelanes_tables.roads_table
local roads_path_classes_table = roads_bikelanes_tables.roads_path_classes_table
local bike_suitability_table = roads_bikelanes_tables.bike_suitability_table
local todo_lines_table = roads_bikelanes_tables.todo_lines_table

---@param context RoadsBikelanesWayContext
local function roads_bikelanes_roads(context)
  ---@type ObjectMeta
  local object_meta = context.object_meta
  ---@type OsmTags
  local object_tags = context.object_tags
  local object_geom = context.object_geom

  local result_tags = merge_table({}, context.shared_result_tags)
  merge_table(result_tags, context.cycleway_presence)

  if not highway_classes.sidepath_highway_classes[object_tags.highway] then
    merge_table(result_tags, maxspeed(object_tags))
  end
  local todos = collect_todos(road_todo_categories, object_tags, result_tags)
  result_tags._todo_list = to_todo_tags(todos)
  result_tags.todos = to_markdown_list(todos)

  transform_highway_path_with_foot_or_bicycle_no(object_tags)
  result_tags.road = road_classification_road_value(object_tags)

  local public_result_tags = extract_public_tags(result_tags)
  local cleaned_public, replaced_tags =
    CLEANER.separate_tags(
      public_result_tags,
      object_tags,
      SANITIZE_ROAD_TAGS.log_source_overrides(object_tags)
    )
  for k in pairs(public_result_tags) do
    result_tags[k] = cleaned_public[k]
  end
  LOG_ERROR.SANITIZED_VALUE(object_tags._type, object_tags._id, object_geom, replaced_tags, 'roads_bikelanes_roads')

  if category_is_sidepath(object_tags) then return end
  local forbidden_accesses_roads = SET.join_sets({
    EXIT.forbidden_accesses_bikelanes,
    SET.set({ 'destination', 'customers' })
  })
  if exclude.by_access(object_tags, forbidden_accesses_roads) then return end
  if exclude.by_indoor(object_tags) then return end
  if exclude.by_informal(object_tags) then return end

  local bike_suitability = categorize_bike_suitability(object_tags)
  if bike_suitability then
    local bike_suitability_tags = {
      bikeSuitability = bike_suitability.id,
    }
    merge_table(bike_suitability_tags, result_tags)

    bike_suitability_table:insert({
      id = default_id({ type = object_tags._type, id = object_tags._id }),
      tags = extract_public_tags(bike_suitability_tags),
      meta = object_meta,
      geom = object_geom,
      minzoom = 0
    })
  end

  if highway_classes.path_classes[object_tags.highway] then
    for _, cycleway in ipairs(context.cycleways) do
      if cycleway._side == 'self' then result_tags['bikelane_self'] = cycleway.category end
      if cycleway._side == 'left' then result_tags['bikelane_left'] = cycleway.category end
      if cycleway._side == 'right' then result_tags['bikelane_right'] = cycleway.category end
    end

    roads_path_classes_table:insert({
      id = default_id({ type = object_tags._type, id = object_tags._id }),
      tags = merge_table(extract_public_tags(result_tags), {
        _is_sidepath = object_tags._is_sidepath,
        _in_settlement_area = object_tags._in_settlement_area,
      }),
      meta = object_meta,
      geom = object_geom,
      minzoom = paths_generalization(object_tags, result_tags)
    })
  else
    result_tags.name_ref = object_tags.ref
    roads_table:insert({
      id = default_id({ type = object_tags._type, id = object_tags._id }),
      tags = merge_table(extract_public_tags(result_tags), {
        _in_settlement_area = object_tags._in_settlement_area,
      }),
      meta = object_meta,
      geom = object_geom,
      minzoom = road_generalization(object_tags, result_tags)
    })
  end

  if next(result_tags._todo_list) ~= nil then
    local todo_meta = {
      todos = result_tags.todos,
      category = result_tags.category,
      mapillary_coverage = object_tags.mapillary_coverage,
    }
    todo_lines_table:insert({
      id = default_id({ type = object_tags._type, id = object_tags._id }),
      table = 'roads',
      tags = result_tags._todo_list,
      meta = merge_table(todo_meta, object_meta),
      length = math.floor(result_tags.length),
      geom = object_geom,
      minzoom = 0
    })
  end
end

return roads_bikelanes_roads
