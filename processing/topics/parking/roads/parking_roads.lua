require('init')
require('Log')
require('MergeTable')
require('result_tags_roads')
local is_road_check = require('is_road')
local is_driveway_check = require('is_driveway')
local has_parking_check = require('has_parking')
local LOG_ERROR = require('parking_errors')

local db_table = osm2pgsql.define_table({
  name = '_parking_roads',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',      not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'linestring', projection = 5243 },
    { column = 'is_driveway', type = 'boolean'},
    { column = 'has_parking', type = 'boolean'},
    { column = 'is_parking_road', type = 'boolean'},
  },
  indexes = {
    { column = { 'osm_id' }, method = 'btree' },
    { column = { 'geom' }, method = 'gist' },
    { column = { 'is_driveway', 'has_parking' }, method = 'btree' },
  }
})

-- `_parking_roads` flag semantics:
-- * `is_driveway`: true for `service`/`track`/… (not in `is_road`); false for `is_road` ways (e.g. `residential`, `motorway_link`).
-- * `has_parking`: true when we create parking lines along this road; false when we do not (e.g. driveways without parking, pedestrian/motorway_link without explicit tags). Roads with has_parking=false are still used for cutout geometry and intersection logic.
-- * `is_parking_road`: true when this way is treated as the main parking road at intersections (for driveway corner cutouts and kerb trimming). Set for is_road ways and for is_driveway ways that have has_parking (e.g. highway=service with parking).
--
-- Normal streets: (`is_driveway`=false, `has_parking`=true).
-- Driveways: (`is_driveway`=true, `has_parking`=* from explicit `parking:*` tags).
-- Exception: `pedestrian` and 'motorway_link` are `is_road` but we don't assume parking — `has_parking` only if explicit `parking:*` tags (see `has_parking.lua` `highway_is_road_parking_optional`). So they are often (`is_driveway`=false, `has_parking`=false) in `_parking_roads` which means the are used as road cutouts and 5m intersection corners but get parking lines only when tagged.
function parking_roads(object)
  local is_road = is_road_check(object.tags)
  local is_driveway = is_driveway_check(object.tags)
  if not (is_road or is_driveway) then return end
  if object.tags.area == 'yes' then return end -- exclude areas like https://www.openstreetmap.org/way/185835333

  local row_data, replaced_tags = result_tags_roads(object)
  local has_parking = has_parking_check(object.tags)
  local is_parking_road = is_road or (is_driveway and has_parking)
  local row = MergeTable({
    geom = object:as_linestring(),
    is_driveway = is_driveway,
    has_parking = has_parking,
    is_parking_road = is_parking_road,
  }, row_data)

  LOG_ERROR.SANITIZED_VALUE(object, row.geom, replaced_tags, 'parking_roads')
  db_table:insert(row)
end
