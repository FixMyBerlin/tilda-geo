local log = require('topics.helper.log')

---@return table<string, { category: OffStreetParkingCategory, object: OSMObject} | { category: nil, object: nil}>
local function categorize_off_street_parking(object, categories)
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

return categorize_off_street_parking
