-- Entrance nodes for the `entrances` table (standard topic shape: id/tags/meta/geom + minzoom).
-- It is the map layer "Eingänge" and also read by the space-finder-worker (`PostgisLoader`):
-- subway entrances are the access points for the ÖPNV score. Building entrances are not
-- used by any score yet (resident demand starts at the building outline); the loader is
-- there for letting demand start at the entrance later.
--
-- `tags.category` (sanitized, only the values we use):
--   - `public_transport`: `railway=subway_entrance` (not `disused=yes`). Those are often also
--     tagged `entrance=yes`; the railway tag wins.
--     The map layer "Eingänge" hides them; they are here for the ÖPNV score.
--   - `building`: every other `entrance=*` node.
--
-- Skipped: `entrance=*` on an `amenity=parking_entrance` (car park / underground garage driveway).
-- It is no building entrance, and the parking topic has all of them (`off_street_parking_points`).
--
-- We do NOT verify that a building entrance actually sits on a building: `entrance=*` is
-- virtually always mapped as a vertex of a building outline, and proving it (osm2pgsql 2.3 id
-- cache, or a spatial join against `_buildings`) buys accuracy this use case does not need.
-- Entrances on fences or barriers are imported too.
--
-- Every `entrance` value is imported, not just yes/main: filtering downstream is free.
local metadata = require('topics.helper.metadata')
local default_id = require('topics.helper.default_id')
local LOG_ERROR = require('topics.entrances.entrances_errors')
local result_tags = require('topics.entrances.helper.result_tags')
local entrance_category = require('topics.entrances.helper.entrance_category')

-- Must not exceed SIMPLIFY_MAX_ZOOM (14): sources stop requesting tiles there and overzoom, and
-- the tile function drops rows with `z < minzoom`. The style layer hides entrances below z16.
local MINZOOM = 14

local db_table = osm2pgsql.define_table({
  name = 'entrances',
  ids = { type = 'node', id_column = 'osm_id' },
  columns = {
    { column = 'id', type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id', method = 'btree', unique = true },
  },
})

--- Node handler: subway entrances and every entrance=* node.
---@param object OsmObject
local function entrance_nodes(object)
  local category = entrance_category(object.tags)
  if not category then
    return
  end

  local cleaned_tags, replaced_tags = result_tags(object.tags, category)
  local geom = object:as_point()
  LOG_ERROR.SANITIZED_VALUE(object, geom, replaced_tags, 'entrance_nodes')

  db_table:insert({
    id = default_id(object),
    tags = cleaned_tags,
    meta = metadata(object),
    geom = geom,
    minzoom = MINZOOM,
  })
end

return entrance_nodes
