-- True when the row of the way itself in `bikelanes` has this todo. Left and right lanes do not count.
---@param cycleways table[]
---@param todo_id string
---@return boolean
local function self_bikelane_has_todo(cycleways, todo_id)
  for _, cycleway in ipairs(cycleways) do
    if cycleway._side == 'self' and cycleway._todo_list and cycleway._todo_list[todo_id] then
      return true
    end
  end
  return false
end

return self_bikelane_has_todo
