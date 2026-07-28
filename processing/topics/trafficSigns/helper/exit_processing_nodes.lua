
---@param object table
---@return boolean
local function exit_processing_nodes(object)
  local required_tags = { 'traffic_sign', 'traffic_sign:forward', 'traffic_sign:backward', 'traffic_sign:both' }
  for _, tag in pairs(required_tags) do
    if object.tags[tag] then
      return false
    end
  end
  return true
end

return exit_processing_nodes
