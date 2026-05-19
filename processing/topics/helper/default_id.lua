
---@param object { type: string, id: number|string }
---@return string
local function default_id(object)
  return string.lower(object.type) .. '/' .. tostring(object.id)
end

return default_id
