require('init')
require('Log')

---@return table<string, { category: SeparateParkingCategory, object: OSMObject} | { category: nil, object: nil}>
local function categorize_parking_separate(object, categories)
  for _, category in ipairs(categories) do
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

return categorize_parking_separate
