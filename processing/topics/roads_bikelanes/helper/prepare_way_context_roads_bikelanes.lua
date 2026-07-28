local round = require('topics.helper.round')

---@param object table
---@param object_tags OsmTags
---@return table, number|nil
local function prepare_way_context_roads_bikelanes(object, object_tags)
  local line_geom = object:as_linestring()
  local length = round(line_geom:transform(5243):length(), 2)
  object_tags._length = length

  return line_geom, length
end

return prepare_way_context_roads_bikelanes
