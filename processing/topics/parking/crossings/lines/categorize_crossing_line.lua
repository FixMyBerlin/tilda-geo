require('init')
require('Log')
require('crossing_line_categories')

---@return table<string, { category: ObstacleCategory, object: OSMObject} | { category: nil, object: nil}>
local function categorize_crossing_line(object)
  for _, category in ipairs(crossing_line_categories) do
    if category:is_active(object.tags) then
      object.tags.side = 'self'

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

return categorize_crossing_line
