---@param str string | nil
---@param subStr string | nil
---@return boolean
local function contains_substring(str, subStr)
  if (str == nil) then return false end
  if (subStr == nil) then return false end
  if string.find(str, subStr, 1, true) ~= nil then
    return true
  end
  return false
end

return contains_substring
