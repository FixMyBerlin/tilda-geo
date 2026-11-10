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
local LINE_DIRECTION = require('topics.roads_bikelanes.helper.line_direction')
local default_id = require('topics.helper.default_id')
local derive_traffic_signs = require('topics.helper.derive_traffic_signs')
local to_markdown_list = require('topics.helper.to_markdown_list')
local to_todo_tags = require('topics.helper.to_todo_tags')
local parse_width = require('topics.helper.parse_width')
local SANITIZE_ROAD_TAGS = require('topics.roads_bikelanes.helper.sanitize_road_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local to_semicolon_list = require('topics.helper.to_semicolon_list')
local DESC = require('topics.helper.tilda_description')
local derive_traffic_mode = require('topics.roads_bikelanes.bikelanes.helper.derive_traffic_mode')
local derive_bikelane_surface = require('topics.roads_bikelanes.bikelanes.helper.derive_bikelane_surface')
local derive_bikelane_smoothness = require('topics.roads_bikelanes.bikelanes.helper.derive_bikelane_smoothness')
local SURFACE_TAGS = require('topics.roads_bikelanes.bikelanes.helper.derive_bikelane_surface_tags')
local maxspeed = require('topics.roads_bikelanes.maxspeed.maxspeed')
local adjoining_context = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_context')
local HIGHWAYS = require('topics.helper.highway_classes')

local footway_transformation = CenterLineTransformation.new({
  highway = 'footway',
  prefix = 'sidewalk',
  filter = function(tags)
    -- `sidewalk:<side>=no|separate` unnests to `sidewalk`
    if tags.sidewalk == 'no' or tags.sidewalk == 'separate' then return false end
    -- Only sidewalks with bicycle access or any traffic sign are categorized.
    -- The categories check which access or sign they need (e.g. DE:240, DE:1022-10; DE:239 alone matches none).
    local has_bicycle_access = tags.bicycle == 'yes' or tags.bicycle == 'designated'
    local has_traffic_sign = tags.traffic_sign ~= nil
      or tags['traffic_sign:forward'] ~= nil
      or tags['traffic_sign:backward'] ~= nil
    if has_bicycle_access or has_traffic_sign then return true end
    return false
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
local function merge_bikelane_public_tags(result_tags, object_tags, log_overrides)
  local public_result_tags = extract_public_tags(result_tags)
  local cleaned_public, replaced_tags =
    CLEANER.separate_tags(public_result_tags, object_tags, log_overrides)
  for k in pairs(public_result_tags) do
    result_tags[k] = cleaned_public[k]
  end
  -- Tags that were replaced by their sanitised value, for the bikelanes writer to log.
  result_tags._replaced_tags = replaced_tags
end

---@param object_tags OsmTags
---@return OsmTags[]
local function bikelanes(object_tags)
  ---@type OsmTags[]
  local result_bikelanes = {}

  ---@type TransformedObject[]
  local transformed_objects = get_transformed_objects(object_tags, transformations)

  -- Categorize all sides first: the oneway fallback of a track on the road reads the other side.
  local categories = {}
  local side_has_cycling = { left = false, right = false }
  for index, transformed_tags in ipairs(transformed_objects) do
    transformed_tags._length = object_tags._length
    local category = categorize_bikelane(transformed_tags)
    categories[index] = category
    if category ~= nil and side_has_cycling[transformed_tags._side] ~= nil
      and (category.infrastructureExists or category.id == 'separate_geometry') then
      side_has_cycling[transformed_tags._side] = true
    end
  end

  for index, transformed_tags in ipairs(transformed_objects) do
    local category = categories[index]
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
          -- The side's own lifecycle wins, else it gets the lifecycle of its road
          lifecycle = transformed_tags.lifecycle or object_tags.lifecycle,
          width = parse_width(transformed_tags.width),
          width_source = transformed_tags['source:width'],
          width_effective = parse_width(transformed_tags['width:effective']),
          oneway = derive_oneway(transformed_tags, category, {
            other_side_has_cycling = side_has_cycling[transformed_tags._side == 'left' and 'right' or 'left'],
          }),
          bridge = SANITIZE_TAGS.boolean_yes(object_tags.bridge),
          tunnel = SANITIZE_TAGS.tunnel(object_tags.tunnel),
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
        })

        merge_table(result_tags, derive_traffic_mode(transformed_tags, object_tags, category.id, transformed_tags._side))
        merge_table(result_tags, derive_traffic_signs(transformed_tags))
        local surface_tags = SURFACE_TAGS.derive(transformed_tags, category)
        merge_table(result_tags, derive_bikelane_surface(surface_tags, category))
        merge_table(result_tags, derive_bikelane_smoothness(surface_tags, category))
        result_tags.surface_source = SURFACE_TAGS.source(surface_tags, result_tags.surface_source)
        -- The line points in the riding direction.
        local line_reversed = LINE_DIRECTION.bikelane_reversed(transformed_tags)
        result_tags._line_reversed = line_reversed
        local surface_hints = SURFACE_TAGS.hints(transformed_tags, category, result_tags.surface_source)
        if line_reversed and transformed_tags._side == 'self' then
          surface_hints = DESC.swap_side_tokens(surface_hints)
        end
        result_tags.description = DESC.build(transformed_tags, surface_hints)
        if transformed_tags._side ~= 'self' then
          result_tags._id = default_id({ type = object_tags._type, id = object_tags._id }) .. '/' .. transformed_tags._prefix .. '/' .. transformed_tags._side
          result_tags.parent_road = transformed_tags.parent_road
          -- object_tags is the parent centerline; maxspeed() reads exactly the tags the old
          -- synthetic-table rebuild copied (maxspeed*/zone:maxspeed/source:maxspeed + highway).
          result_tags.parent_maxspeed = maxspeed(object_tags).maxspeed
          -- Recommended sideways offset in meters, signed relative to the published line
          -- (+ left / - right of its direction). The geometry itself stays on the road
          -- centerline; this value is exported as the `offset` attribute and consumed purely
          -- visually by the map style (`line-offset`). See topic-doc chapter `versetzte-geometrien`.
          -- In right-hand traffic the lane usually lies to the right of its line (negative).
          local lane_left_of_line = (transformed_tags._side == 'left') ~= line_reversed
          result_tags.offset = (lane_left_of_line and 1 or -1) * road_width(object_tags) / 2
        elseif HIGHWAYS.path_classes[transformed_tags.highway]
          or HIGHWAYS.sidepath_highway_classes[transformed_tags.highway] then
          merge_table(
            result_tags,
            adjoining_context.derive_adjoining_context(object_tags, transformed_tags)
          )
        end

        merge_bikelane_public_tags(
          result_tags,
          object_tags,
          SANITIZE_ROAD_TAGS.log_source_overrides(transformed_tags)
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
