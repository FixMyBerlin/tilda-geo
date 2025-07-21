require('init')
require("Set")
require("TimeUtils")
require("BikelaneCategories")
require("transformations")
require("CopyTags")
require("RoadWidth")
require("DeriveSurface")
require("DeriveSmoothness")
require("BikelaneTodos")
require("Sanitize")
require("DeriveOneway")
require("DefaultId")
require("DeriveTrafficSigns")
require("CollectTodos")
require("ToMarkdownList")
require("ToTodoTags")
local parse_length = require('parse_length')
local SANITIZE_ROAD_TAGS = require('sanitize_road_tags')

local tags_copied = {}
local tags_prefixed = {}
local sideSignMap = {
  ["left"] = 1,
  ["right"] = -1
}

-- transformations for nested tags:
local footwayTransformation = CenterLineTransformation.new({
  highway = "footway",
  prefix = "sidewalk",
  filter = function(tags)
    return not (tags.footway == 'no' or tags.footway == 'separate')
  end,
  direction_reference = 'parent'
})
local cyclewayTransformation = CenterLineTransformation.new({
  highway = "cycleway",
  prefix = "cycleway",
  direction_reference = 'self'
})

local transformations = { cyclewayTransformation, footwayTransformation } -- order matters for presence

function Bikelanes(object)
  local object_tags = object.tags
  local result_bikelanes = {}

  -- generate cycleways from center line tagging, also includes the original object with `side = self`
  local transformedObjects = GetTransformedObjects(object_tags, transformations)

  for _, transformed_tags in ipairs(transformedObjects) do
    local category = CategorizeBikelane(transformed_tags)
    if category ~= nil then
      local result_tags = {
        _side = transformed_tags._side,
        _infrastructureExists = category.infrastructureExists,
        _implicitOneWayConfidence = category.implicitOneWayConfidence,
        _age_in_days = AgeInDays(object.timestamp),
        category = category.id,
      }

      if category.infrastructureExists then
        MergeTable(result_tags, {
          _id = DefaultId(object),
          _infrastructureExists = true,
          prefix = transformed_tags._prefix,
          width = parse_length(transformed_tags.width),
          width_source = object_tags['source:cycleway:' .. transformed_tags._side .. ':width'] or transformed_tags['source:width'],
          oneway = DeriveOneway(transformed_tags, category),
          bridge = Sanitize(object_tags.bridge, { "yes" }),
          tunnel = Sanitize(object_tags.tunnel, { "yes" }),
          surface_color = SANITIZE_ROAD_TAGS.surface_color(transformed_tags),
          separation_left = SANITIZE_ROAD_TAGS.separation(transformed_tags, 'left'),
          separation_right = SANITIZE_ROAD_TAGS.separation(transformed_tags, 'right'),
          buffer_left = SANITIZE_ROAD_TAGS.buffer(transformed_tags, 'left'),
          buffer_right = SANITIZE_ROAD_TAGS.buffer(transformed_tags, 'right'),
          marking_left = SANITIZE_ROAD_TAGS.marking(transformed_tags, 'left'),
          marking_right = SANITIZE_ROAD_TAGS.marking(transformed_tags, 'right'),
          traffic_mode_left = SANITIZE_ROAD_TAGS.traffic_mode(transformed_tags, 'left'),
          traffic_mode_right = SANITIZE_ROAD_TAGS.traffic_mode(transformed_tags, 'right'),
          mapillary = object_tags['source:cycleway:' .. transformed_tags._side .. ':mapillary'] or transformed_tags.mapillary,
          mapillary_forward = transformed_tags['mapillary:forward'],
          mapillary_backward = transformed_tags['mapillary:backward'],
          mapillary_traffic_sign = object_tags['source:cycleway:' .. transformed_tags._side .. ':traffic_sign:mapillary'] or transformed_tags['source:traffic_sign:mapillary'],
          description = transformed_tags.description or transformed_tags.note,
        })

        MergeTable(result_tags, DeriveTrafficSigns(transformed_tags))
        MergeTable(result_tags, DeriveSmoothness(transformed_tags))
        MergeTable(result_tags, DeriveSurface(transformed_tags))
        CopyTags(result_tags, transformed_tags, tags_prefixed, 'osm_')
        -- copy original tags
        CopyTags(result_tags, object_tags, tags_copied)

        -- these keys are different for projected geometries
        if transformed_tags._side ~= "self" then
          result_tags._id = DefaultId(object) .. '/' .. transformed_tags._prefix .. '/' .. transformed_tags._side
          result_tags._parent_highway = transformed_tags._parent_highway
          result_tags.offset = sideSignMap[transformed_tags._side] * RoadWidth(object_tags) / 2
        end

        local todos = CollectTodos(BikelaneTodos, transformed_tags, result_tags)
        result_tags._todo_list = ToTodoTags(todos)
        result_tags.todos = ToMarkdownList(todos)
      end
      table.insert(result_bikelanes, result_tags)
    end
  end

  return result_bikelanes
end
