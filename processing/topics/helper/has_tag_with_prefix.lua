require('init')
local has_prefix = require('has_prefix')

---@param tags table | nil
---@param prefix string | nil
---@return boolean
local function has_tag_with_prefix(tags, prefix)
  if tags == nil then return false end
  if prefix == nil then return false end

  for key, _ in pairs(tags) do
    if has_prefix(key, prefix) then
      return true
    end
  end

  return false
end

return has_tag_with_prefix
