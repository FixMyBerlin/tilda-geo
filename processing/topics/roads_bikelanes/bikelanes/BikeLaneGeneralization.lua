require('init')
require("Set")


---@param original_tags table
---@param result_tags table
---@return integer
--- Return the minzoom for paths
function BikeLaneGeneralization(original_tags, result_tags)
  local length = result_tags.length
  if length < 50 then
    return 10
  end
  return 0
end
