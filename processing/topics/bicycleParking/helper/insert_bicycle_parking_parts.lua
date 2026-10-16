local insert_bicycle_parking_point = require('topics.bicycleParking.helper.insert_bicycle_parking_point')
local insert_bicycle_parking_area = require('topics.bicycleParking.helper.insert_bicycle_parking_area')

--- Row tags of one part: a copy of the shared tags (parts never share a table) plus `kind` and `capacity`.
--- When the object has more than one part, `geometry_transform` tells bicycleParking.sql how to place them.
---@param shared_tags OsmTags
---@param part BicycleParkingPart
---@param geometry_transform string|nil
---@return OsmTags
local function part_tags(shared_tags, part, geometry_transform)
  local tags = {}
  for key, value in pairs(shared_tags) do
    tags[key] = value
  end
  tags.kind = part.kind
  tags.capacity = part.capacity
  tags.geometry_transform = geometry_transform
  return tags
end

--- The first part keeps the object id (`way/123`), further parts add their kind (`way/123/cargo_bike_parking`).
---@param object_id string
---@param index integer
---@param part BicycleParkingPart
---@return string
local function part_id(object_id, index, part)
  if index == 1 then return object_id end
  return object_id .. '/' .. part.kind
end

--- One point row per part, all at `geom`. `split_transform` is `point_offset` (node) or `line_halves` (open way).
---@param parts BicycleParkingPart[]
---@param shared_tags OsmTags
---@param meta table
---@param geom any
---@param object_id string
---@param split_transform 'point_offset'|'line_halves'
local function insert_point_parts(parts, shared_tags, meta, geom, object_id, split_transform)
  local geometry_transform = #parts > 1 and split_transform or nil
  for index, part in ipairs(parts) do
    insert_bicycle_parking_point(part_tags(shared_tags, part, geometry_transform), meta, geom, part_id(object_id, index, part))
  end
end

--- One area row and one point row (at the centroid) per part, all with the original geometry.
--- `processing/topics/bicycleParking/bicycleParking.sql` splits the geometry afterwards.
---@param parts BicycleParkingPart[]
---@param shared_tags OsmTags
---@param meta table
---@param geom any
---@param object_id string
local function insert_area_parts(parts, shared_tags, meta, geom, object_id)
  local centroid = geom:centroid()
  local geometry_transform = #parts > 1 and 'area_split' or nil
  for index, part in ipairs(parts) do
    local id = part_id(object_id, index, part)
    local tags = part_tags(shared_tags, part, geometry_transform)
    insert_bicycle_parking_area(tags, meta, geom, id)
    insert_bicycle_parking_point(tags, meta, centroid, id)
  end
end

return {
  points = insert_point_parts,
  areas = insert_area_parts,
}
