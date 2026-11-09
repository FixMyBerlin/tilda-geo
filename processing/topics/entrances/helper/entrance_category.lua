---@param tags OsmTags
---@return 'public_transport'|'building'|nil
local function entrance_category(tags)
  if tags.railway == 'subway_entrance' then
    if tags.disused == 'yes' then return nil end
    return 'public_transport'
  end
  if tags.entrance then
    if tags.amenity == 'parking_entrance' then return nil end
    return 'building'
  end
  return nil
end

return entrance_category
