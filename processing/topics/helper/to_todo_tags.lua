
---@param array `Array<{id: string, priority: string, todoTableOnly: boolean}>`
---@return table A table where each entry is a table with the structure `{id: priority}`
local function to_todo_tags(array)
  if not array or next(array) == nil then
    return {}
  end

  local result = {}
  for _, obj in ipairs(array) do
    result[obj.id] = obj.priority
  end
  return result
end

return to_todo_tags
