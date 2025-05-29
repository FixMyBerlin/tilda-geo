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

local tags_copied = {
  "mapillary",
  "description",
}
local tags_prefixed = {
  'surface:colour',
  'separation',
  'separation:left',
  'separation:right',
  'traffic_mode',
  'traffic_mode:left',
  'traffic_mode:right',
}
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
        _updated_age = AgeInDays(object.timestamp),
        category = category.id,
      }

      if category.infrastructureExists then
        MergeTable(result_tags, {
          _id = DefaultId(object),
          _infrastructureExists = true,
          -- _age = AgeInDays(ParseCheckDate(tags["check_date"])),
          prefix = transformed_tags._prefix,
          width = ParseLength(transformed_tags.width),
          oneway = DeriveOneway(transformed_tags, category),
          bridge = Sanitize(object_tags.bridge, { "yes" }),
          tunnel = Sanitize(object_tags.tunnel, { "yes" }),
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
          -- result_tags._age = AgeInDays(ParseCheckDate(tags["check_date:" .. transformedTags._prefix]))
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
