-- place=square polygons for the `_places_squares` PROCESSING-ONLY table (geometry only — no
-- tags/meta, no minzoom). The leading `_` keeps it out of Martin's tile sources; the
-- planning-worker uses it to score proximity to / coverage by public squares.
--
-- MVP: closed ways only, no multipolygon relations (squares as relations are rare; mirrors the
-- pedestrian-zone MVP decision elsewhere in the planning module).
local db_table = osm2pgsql.define_table({
  name = '_places_squares',
  ids = { type = 'way', id_column = 'osm_id' },
  columns = {
    { column = 'geom', type = 'polygon' },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

--- Way handler: every place=square closed way (geometry only).
---@param object table
local function places_squares(object)
  if not object.is_closed then
    return
  end
  db_table:insert({ geom = object:as_polygon() })
end

return places_squares
