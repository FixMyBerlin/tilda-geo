---Reverse a linestring geometry so travel direction matches legal cycling direction.
---Uses osm2pgsql's geometry :reverse() (PostGIS ST_Reverse equivalent).
---@param geom table|nil
---@return table|nil
local function reverse_linestring(geom)
  if geom == nil then
    return nil
  end
  return geom:reverse()
end

return reverse_linestring
