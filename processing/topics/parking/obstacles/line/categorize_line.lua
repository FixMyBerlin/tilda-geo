require('init')
require("Log")
require("obstacle_line_categories")

---@return table<string, { category: ObstacleCategory, object: OSMObject} | { category: nil, object: nil}>
function categorize_line(object)
  for _, category in ipairs(obstacle_line_categories) do
    if category:is_active(object.tags) then
      return {
        category = category,
        object = object
      }
    end
  end
  return {
    category = nil,
    object = nil
  }
end
