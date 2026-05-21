---@param result_tags table
---@return integer
local function minzoom(result_tags)
  if result_tags.formalEducation then
    return 11
  end
  return 13
end

return minzoom
