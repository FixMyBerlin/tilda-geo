
local road_todo_class = {}
road_todo_class.__index = road_todo_class

---@param args table
---@param args.id string
---@param args.desc string
---@param args.todoTableOnly boolean
---@param args.priority fun(object_tags: table, result_tags: table): string
---@param args.conditions fun(object_tags: table, result_tags: table): boolean
---@return table
function road_todo_class.new(args)
  local self = setmetatable({}, road_todo_class)
  self.id = args.id
  self.desc = args.desc
  self.todoTableOnly = args.todoTableOnly
  self.priority = args.priority
  self.conditions = args.conditions
  return self
end

function road_todo_class:__call(object_tags, result_tags)
  if self.conditions(object_tags, result_tags) then
    return {
      id = self.id,
      priority = self.priority(object_tags, result_tags),
      todoTableOnly = self.todoTableOnly,
    }
  else
    return nil
  end
end

-- === Deprecated cycleway tagging ===
local deprecated_cycleway_shared = road_todo_class.new({
  id = 'deprecated_cycleway_shared',
  desc = 'The tagging `cycleway=shared` is deprecated and should be replaced or removed.',
  todoTableOnly = false,
  priority = function(object_tags, result_tags)
    if object_tags.mapillary_coverage then return '1' end
    return '2'
  end,
  conditions = function(object_tags, _)
    return object_tags.cycleway == 'shared'
  end,
})

local road_todo_categories = {
  deprecated_cycleway_shared,
}

return road_todo_categories
