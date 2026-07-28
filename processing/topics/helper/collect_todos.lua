-- local inspect = require('inspect')

---@desc Call every todo function of a given todo list with the given tag objects and collect the results
---@param todo_functions table like `processing/topics/roads_bikelanes/bikelanes/bikelane_todos.lua` and `road_todos.lua`
---@param tags_object table|nil
---@param result_tags table|nil
---@return table `Array<{id: string, priority: string, todoTableOnly: boolean}>`
local function collect_todos(todo_functions, tags_object, result_tags)
  local todo_results = {}

  for _, todo_func in ipairs(todo_functions) do
    local result = todo_func(tags_object, result_tags)
    if (result) then
      table.insert(todo_results, {
        id = result.id,
        priority = 'prio' .. result.priority,
        todoTableOnly = result.todoTableOnly,
      })
    end
  end

  return todo_results
end

return collect_todos
