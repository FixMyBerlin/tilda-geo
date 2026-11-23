-- Owner of the `_sealing_surfaces` table (one row per OSM object). Nodes (trees), ways (lines,
-- areas) and relations (multipolygons) all insert through this module, like bicycleParking does
-- for its shared tables.
--
-- PROCESSING-ONLY table (the `_` prefix keeps it out of the map layers): the Flächenfinder scoring
-- worker reads it to compute the sealed share per H3 hexagon. No tags/meta/minzoom columns.
-- SRID 5243 (meters) like `_buildings` and `_parking_roads`.
local db_table = osm2pgsql.define_table({
  name = '_sealing_surfaces',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    -- A | A2 | B | D | tree
    { column = 'sealing_group', type = 'text', not_null = true },
    -- true when the group came from the object's own `surface` tag
    { column = 'surface_explicit', type = 'boolean', not_null = true },
    -- sanitized surface value, NULL when missing or not allowed
    { column = 'surface', type = 'text' },
    -- ways only
    { column = 'highway', type = 'text' },
    -- lines only: width in meters + where it comes from (tag | default)
    { column = 'width_m', type = 'real' },
    { column = 'width_source', type = 'text' },
    -- sidewalks tagged on a road only: distance of the sidewalk axis from the road line (m),
    -- > 0 left, < 0 right of the way direction; the worker shifts the line by it
    { column = 'offset_m', type = 'real' },
    -- tree points only: crown diameter in meters + where it comes from (tag | default)
    { column = 'crown_m', type = 'real' },
    { column = 'crown_source', type = 'text' },
    { column = 'geom', type = 'geometry', projection = 5243, not_null = true },
  },
  indexes = {
    { column = 'geom', method = 'gist' },
  },
})

---@param object OsmObject
---@param classification SealingClassification
---@param geom table osm2pgsql geometry (not null)
local function insert_sealing_surface(object, classification, geom)
  db_table:insert({
    sealing_group = classification.sealing_group,
    surface_explicit = classification.surface_explicit,
    surface = classification.surface,
    highway = object.type == 'way' and object.tags.highway or nil,
    width_m = classification.width_m,
    width_source = classification.width_source,
    offset_m = classification.offset_m,
    crown_m = classification.crown_m,
    crown_source = classification.crown_source,
    geom = geom,
  })
end

return insert_sealing_surface
