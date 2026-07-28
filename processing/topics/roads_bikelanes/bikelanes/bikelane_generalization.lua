
---@param original_tags table
---@param result_tags table
---@return integer
local function bikelane_generalization(original_tags, result_tags)
  local length = result_tags.length
  if length < 100 then
    return 9
  end
  return 0
end

return bikelane_generalization
