require('init')
local CLONE = require('clones')
local SET = require('sets')
local highway_classes = require('highway_classes')
local exclude = require('exclude_highways')
local maxspeed = require('maxspeed')
local merge_table = require('merge_table')
local category_is_sidepath = require('category_is_sidepath')
local extract_public_tags = require('extract_public_tags')
local default_id = require('default_id')
local paths_generalization = require('paths_generalization')
local road_generalization = require('road_generalization')
local road_todo_categories = require('road_todo_categories')
local collect_todos = require('collect_todos')
local to_markdown_list = require('to_markdown_list')
local to_todo_tags = require('to_todo_tags')
local categorize_bike_suitability = require('bike_suitability')
local road_classification_road_value = require('road_classification_road_value')
local transform_highway_path_with_foot_or_bicycle_no = require('transform_highway_path_with_foot_or_bicycle_no')
local EXIT = require('exit_processing_roads_bikelanes')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')
local CLEANER = require('sanitize_cleaner')
local LOG_ERROR = require('roads_bikelanes_errors')
local roads_bikelanes_tables = require('roads_bikelanes_tables')

local roads_table = roads_bikelanes_tables.roads_table
local roads_path_classes_table = roads_bikelanes_tables.roads_path_classes_table
local bike_suitability_table = roads_bikelanes_tables.bike_suitability_table
local todo_lines_table = roads_bikelanes_tables.todo_lines_table

local function roads_bikelanes_roads(context)
  local object_meta = context.object_meta
  local object_tags = context.object_tags
  local object_geom = context.object_geom

  local result_tags = CLONE.structured_clone(context.shared_result_tags)
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
      tags = merge_table(extract_public_tags(result_tags), { _is_sidepath = object_tags._is_sidepath }),
      meta = object_meta,
      geom = object_geom,
      minzoom = paths_generalization(object_tags, result_tags)
    })
  else
    result_tags.name_ref = object_tags.ref
    roads_table:insert({
      id = default_id({ type = object_tags._type, id = object_tags._id }),
      tags = extract_public_tags(result_tags),
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
