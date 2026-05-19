require('topics.helper.time_utils')
local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local transformations = require('topics.roads_bikelanes.bikelanes.transformations')
local merge_table = require('topics.helper.merge_table')
local road_width = require('topics.helper.road_width')
local derive_surface = require('topics.helper.derive_surface')
local derive_smoothness = require('topics.helper.derive_smoothness')
local bikelane_todo_categories = require('topics.roads_bikelanes.bikelanes.bikelane_todo_categories')
local collect_todos = require('topics.helper.collect_todos')
local derive_oneway = require('topics.roads_bikelanes.bikelanes.derive_oneway')
local default_id = require('topics.helper.default_id')
local derive_traffic_signs = require('topics.helper.derive_traffic_signs')
local to_markdown_list = require('topics.helper.to_markdown_list')
local to_todo_tags = require('topics.helper.to_todo_tags')
local parse_length = require('topics.helper.parse_length')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local LOG_ERROR = require('topics.roads_bikelanes.roads_bikelanes_errors')
local to_semicolon_list = require('topics.helper.to_semicolon_list')
local derive_traffic_mode = require('topics.roads_bikelanes.bikelanes.helper.derive_traffic_mode')
local derive_bikelane_surface = require('topics.roads_bikelanes.bikelanes.helper.derive_bikelane_surface')
local derive_bikelane_smoothness = require('topics.roads_bikelanes.bikelanes.helper.derive_bikelane_smoothness')

local side_sign_map = {
  ['left'] = 1,
  ['right'] = -1,
}

local footway_transformation = CenterLineTransformation.new({
  highway = 'footway',
  prefix = 'sidewalk',
  filter = function(tags)
    return not (tags.footway == 'no' or tags.footway == 'separate')
  end,
  direction_reference = 'parent',
})
local cycleway_transformation = CenterLineTransformation.new({
  highway = 'cycleway',
  prefix = 'cycleway',
  direction_reference = 'self',
})

local transformations = { cycleway_transformation, footway_transformation }

local categorize_bikelane = bikelane_categories.categorize_bikelane

---@param result_tags OsmTags
---@param object_tags OsmTags
---@param log_overrides OsmTags
---@param object_geom table
local function merge_bikelane_public_tags(result_tags, object_tags, log_overrides, object_geom)
  local public_result_tags = extract_public_tags(result_tags)
  local cleaned_public, replaced_tags =
    CLEANER.separate_tags(public_result_tags, object_tags, log_overrides)
  for k in pairs(public_result_tags) do
    result_tags[k] = cleaned_public[k]
  end
  LOG_ERROR.SANITIZED_VALUE(object_tags._type, object_tags._id, object_geom, replaced_tags, 'bikelanes')
end

---@param object_tags OsmTags
---@param object_geom table
---@return OsmTags[]
local function bikelanes(object_tags, object_geom)
  ---@type OsmTags[]
  local result_bikelanes = {}

  ---@type TransformedObject[]
  local transformed_objects = get_transformed_objects(object_tags, transformations)

  for _, transformed_tags in ipairs(transformed_objects) do
    transformed_tags._length = object_tags._length
    local category = categorize_bikelane(transformed_tags)
    if category ~= nil then
      local result_tags = {
        _side = transformed_tags._side,
        _infrastructureExists = category.infrastructureExists,
        _implicitOneWayConfidence = category.implicitOneWayConfidence,
        _age_in_days = age_in_days(object_tags._timestamp),
        category = category.id,
      }

      if category.infrastructureExists then
        merge_table(result_tags, {
          _id = default_id({ type = object_tags._type, id = object_tags._id }),
          _infrastructureExists = true,
          prefix = transformed_tags._prefix,
          lifecycle = transformed_tags.lifecycle or SANITIZE_ROAD_TAGS.temporary(transformed_tags) or object_tags.lifecycle,
          width = parse_length(transformed_tags.width),
          width_source = transformed_tags['source:width'],
          width_effective = parse_length(transformed_tags['width:effective']),
          oneway = derive_oneway(transformed_tags, category),
          bridge = SANITIZE_TAGS.boolean_yes(object_tags.bridge),
          tunnel = SANITIZE_TAGS.boolean_yes(object_tags.tunnel),
          surface_color = SANITIZE_ROAD_TAGS.surface_color(transformed_tags),
          separation_left = SANITIZE_ROAD_TAGS.separation(transformed_tags, 'left'),
          separation_right = SANITIZE_ROAD_TAGS.separation(transformed_tags, 'right'),
          buffer_left = SANITIZE_ROAD_TAGS.buffer(transformed_tags, 'left'),
          buffer_right = SANITIZE_ROAD_TAGS.buffer(transformed_tags, 'right'),
          marking_left = SANITIZE_ROAD_TAGS.marking(transformed_tags, 'left'),
          marking_right = SANITIZE_ROAD_TAGS.marking(transformed_tags, 'right'),
          mapillary = to_semicolon_list({
            transformed_tags.mapillary,
            transformed_tags['source:mapillary'],
            object_tags.mapillary,
          }),
          mapillary_forward = to_semicolon_list({
            transformed_tags['mapillary:forward'],
            transformed_tags['source:mapillary:forward'],
          }),
          mapillary_backward = to_semicolon_list({
            transformed_tags['mapillary:backward'],
            transformed_tags['source:mapillary:backward'],
          }),
          mapillary_traffic_sign = to_semicolon_list({
            transformed_tags['traffic_sign:mapillary'],
            transformed_tags['source:traffic_sign:mapillary'],
            transformed_tags['source:traffic_sign:forward:mapillary'],
            transformed_tags['source:traffic_sign:backward:mapillary'],
            object_tags['source:traffic_sign:mapillary'],
            object_tags['source:traffic_sign:forward:mapillary'],
            object_tags['source:traffic_sign:backward:mapillary'],
          }),
          description = to_semicolon_list({
            transformed_tags.description,
            transformed_tags.note,
          }),
        })

        merge_table(result_tags, derive_traffic_mode(transformed_tags, object_tags, category.id, transformed_tags._side))
        merge_table(result_tags, derive_traffic_signs(transformed_tags))
        merge_table(result_tags, derive_bikelane_surface(transformed_tags, category))
        merge_table(result_tags, derive_bikelane_smoothness(transformed_tags, category))
        result_tags.description = SANITIZE_TAGS.safe_string(result_tags.description)

        if transformed_tags._side ~= 'self' then
          result_tags._id = default_id({ type = object_tags._type, id = object_tags._id }) .. '/' .. transformed_tags._prefix .. '/' .. transformed_tags._side
          result_tags._parent_highway = transformed_tags._parent_highway
          result_tags.offset = side_sign_map[transformed_tags._side] * road_width(object_tags) / 2
        end

        merge_bikelane_public_tags(
          result_tags,
          object_tags,
          SANITIZE_ROAD_TAGS.log_source_overrides(transformed_tags),
          object_geom
        )

        local todos = collect_todos(bikelane_todo_categories, transformed_tags, result_tags)
        result_tags._todo_list = to_todo_tags(todos)
        result_tags.todos = to_markdown_list(todos)
      end

      table.insert(result_bikelanes, result_tags)
    end
  end

  return result_bikelanes
end

return bikelanes
