
---@param object table
---@return boolean
local function exit_processing_ways(object)
  return object.tags.highway == nil
end

return exit_processing_ways
