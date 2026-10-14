-- Subway/station entrance nodes for the `_publicTransport_entrances` PROCESSING-ONLY table
-- (geometry only — no tags/meta, no minzoom). The leading `_` keeps it out of Martin's tile
-- sources; it is used by the planning-worker to score proximity to actual pedestrian access
-- points instead of the (often distant) station point.
--
-- TODO: if this ever becomes a PRESENTATIONAL table, give it the standard topic shape
--       (id/tags/meta/geom + a minzoom) and drop the `_` prefix.
local db_table = osm2pgsql.define_table({
  name = '_publicTransport_entrances',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'geom', type = 'point' },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

--- Node handler: every railway=subway_entrance node (geometry only).
---@param object table
local function public_transport_entrances(object)
  if object.tags.railway ~= 'subway_entrance' then
    return
  end
  if object.tags.disused == 'yes' then
    return
  end
  db_table:insert({ geom = object:as_point() })
end

return public_transport_entrances
