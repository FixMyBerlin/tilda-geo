---@param result_tags table
---@return integer
local function minzoom(result_tags)
  if result_tags.formalEducation then
    return 7
  end
  if result_tags.category then
    return 7
  end
  return 13
end

return minzoom
