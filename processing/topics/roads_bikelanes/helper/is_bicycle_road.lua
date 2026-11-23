local has_prefix = require('topics.helper.has_prefix')
local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')

--- Fahrradstraße or Fahrradzone: `bicycle_road=yes`, or a `traffic_sign` that starts with `DE:244`
--- (Zeichen 244.1 Fahrradstraße, 244.3 Fahrradzone). Shared by the `bicycleRoad` category and the
--- bicycle access (`sanitize_access_tags.resolve`), so both agree on what a bicycle road is.
---@param tags OsmTags
---@return boolean
local function is_bicycle_road(tags)
  if tags.bicycle_road == 'yes' then return true end
  return has_prefix(sanitize_traffic_sign(tags.traffic_sign), 'DE:244') == true
end

return is_bicycle_road
