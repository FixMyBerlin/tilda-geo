require('init')
require("CopyTags")
require("Metadata")
require("Set")
require("Sanitize")
require("DefaultId")
require("SanitizeTrafficSign")
require("MergeTable")
require("ExtractPublicTags")
require("capacity_normalization")

local nodeTable = osm2pgsql.define_table({
  name = 'bicycleParking_points',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',   not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'point' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local areaTable = osm2pgsql.define_table({
  name = 'bicycleParking_areas',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',      type = 'text',   not_null = true },
    { column = 'tags',    type = 'jsonb' },
    { column = 'meta',    type = 'jsonb' },
    { column = 'geom',    type = 'polygon' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = { 'minzoom', 'geom' }, method = 'gist' },
    { column = 'id',                  method = 'btree', unique = true }
  }
})

local function exitProcessing(object)
  if object.tags.amenity ~= 'bicycle_parking' then
    return true
  end
end

local function processTags(tags)
  -- this is the list of tags found in the wiki: https://wiki.openstreetmap.org/wiki/Tag:amenity%3Dbicycle_parking
  -- also https://wiki.openstreetmap.org/wiki/Berlin/Verkehrswende/Fahrradparkpl%C3%A4tze
  local result_tags = {_meta = {}}
  local binary = { "yes", "no" }
  MergeTable(result_tags, capacity_normalization(tags))
  result_tags.access = Sanitize(tags.access, { "yes", "private", "permissive", "customers" })
  result_tags.covered = Sanitize(tags.covered, binary, "implicit_no")
  result_tags.fee = Sanitize(tags.fee, binary, "implicit_no")
  result_tags.access_cargo_bike = Sanitize(tags.cargo_bike, binary, "implicit_no")
  result_tags.bicycle_parking = Sanitize(
    tags.bicycle_parking,
    { "stands", "wide_stands", "bollard", "wall_loops", "shed", "two-tier", "lockers" }
  )

  -- these tags are copied (Eigennamen)
  local allowed_tags = {
    "name",
    "operator",
  }
  -- these tags are copied and prefixed with `osm_`
  -- we need to sanatize them at some point
  local tags_cc = {
    "area", "operator:type", "covered", "indoor", "access", "cargo_bike", "capacity",
    "capacity:cargo_bike", "fee", "lit", "surface", "bicycle_parking", "maxstay", "surveillance",
    "bicycle_parking:count", "bicycle_parking:position", "description",
    "mapillary",
    "description",
  }
  CopyTags(result_tags, tags, allowed_tags)
  CopyTags(result_tags, tags, tags_cc, "osm_")
  result_tags.traffic_sign = SanitizeTrafficSign(tags.traffic_sign)

  return result_tags
end

function osm2pgsql.process_node(object)
  if exitProcessing(object) then return end
  local result_tags = processTags(object.tags)
  local meta = Metadata(object)

  nodeTable:insert({
    tags = ExtractPublicTags(result_tags),
    meta = meta,
    geom = object:as_point(),
    minzoom = 0,
    id = DefaultId(object)
  })
end

function osm2pgsql.process_way(object)
  if exitProcessing(object) then return end
  local result_tags = processTags(object.tags)
  local meta = Metadata(object)

  if object.is_closed then
    -- Closed lines: add as polygon to area table and point to node table
    areaTable:insert({
      tags = ExtractPublicTags(result_tags),
      meta = meta,
      geom = object:as_polygon(),
      minzoom = 0,
      id = DefaultId(object)
    })

    -- Also add centroid point to node table
    nodeTable:insert({
      tags = ExtractPublicTags(result_tags),
      meta = meta,
      geom = object:as_polygon():centroid(),
      minzoom = 0,
      id = DefaultId(object)
    })
  else
    -- Open lines: convert to point using linestring centroid
    nodeTable:insert({
      tags = ExtractPublicTags(result_tags),
      meta = meta,
      geom = object:as_linestring():centroid(),
      minzoom = 0,
      id = DefaultId(object)
    })
  end
end
