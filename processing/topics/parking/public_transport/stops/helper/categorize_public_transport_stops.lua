require('init')
local public_transport_stop_categories = require('public_transport_stop_categories')

local function categorize_public_transport_stops(object)
  for _, category in ipairs(public_transport_stop_categories) do
    if category:is_active(object.tags) then
      return {
        object = object,
        category = category,
      }
    end
  end
  return {
    category = nil,
    object = nil
  }
end

return categorize_public_transport_stops
