-- Roads skip `area=yes`. highwayAreas is that inverse: closed `highway=*` polygons.
-- Not `area:highway` — those describe road space, tags live on the `highway=*` object.
---@param object table
---@return boolean
local function is_highway_area(object)
  local tags = object.tags
  if tags.highway == nil or tags.area ~= 'yes' then
    return false
  end
  if object.type == 'way' then
    return object.is_closed == true
  end
  return object.type == 'relation'
end

return is_highway_area
