require('init')
RoadTodo = {}
RoadTodo.__index = RoadTodo

-- @param args table
-- @param args.key string
-- @param args.desc string
-- @param args.todoTableOnly boolean
-- @param args.conditions function
function RoadTodo.new(args)
  local self = setmetatable({}, RoadTodo)
  self.id = args.id
  self.desc = args.desc
  self.todoTableOnly = args.todoTableOnly
  self.priority = args.priority
  self.conditions = args.conditions
  return self
end

function RoadTodo:__call(objectTags, resultTags)
  if self.conditions(objectTags, resultTags) then
    return {
      id = self.id,
      priority = self.priority(objectTags, resultTags),
      todoTableOnly = self.todoTableOnly,
    }
  else
    return nil
  end
end

-- === Deprecated cycleway tagging ===
local deprecated_cycleway_shared = RoadTodo.new({
  id = "deprecated_cycleway_shared",
  desc = "The tagging `cycleway=shared` is deprecated and should be replaced or removed.",
  todoTableOnly = false,
  priority = function(objectTags, resultTags)
    if objectTags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(objectTags, _)
    return objectTags.cycleway == "shared"
  end
})

RoadTodos = {
  -- REMINDER: Always use snake_case, never camelCase
  deprecated_cycleway_shared,
}
