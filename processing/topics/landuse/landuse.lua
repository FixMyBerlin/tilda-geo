require('init')
require("Set")
require("Metadata")
require("CopyTags")
require("DefaultId")

local table = osm2pgsql.define_table({
  name = 'landuse',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multipolygon' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'id', method = 'btree', unique = true  }
  }
})

local function ExitProcessing(object)
  if not (object.tags.landuse or object.tags.amenity) then
    return true
  end

  local allowed_values_landuse = Set({
    "allotments",
    "brownfield",
    "cemetery",
    "civic_admin",
    "civic",
    "commercial",
    "construction",
    "farmyard",
    "garages",
    "industrial",
    "religious",
    "residential",
    "retail"
  })
  local allowed_values_amenity = Set({
    "school",
    "university"
  })
  if not (allowed_values_landuse[object.tags.landuse] or allowed_values_amenity[object.tags.amenity]) then
    return true
  end

  return false
end

local function processTags(tags)
  -- For simplicy, we move the amenity values to the landuse key
  tags.landuse = tags.landuse or tags.amenity
  local tags_cc = { "name", "landuse", "access", "operator" }
  return CopyTags({}, tags, tags_cc)
end

function osm2pgsql.process_way(object)
  if ExitProcessing(object) or not object.is_closed then
    return
  end

  table:insert({
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_polygon(),
    minzoom = 0,
    id = DefaultId(object)
  })
end

function osm2pgsql.process_relation(object)
  -- Only process multipolygon relations to avoid inserting relations with NULL geometry (like `type=site`)
  -- The original condition "not object.tags.type == 'multipolygon'" was always false due to operator precedence
  if ExitProcessing(object) or object.tags.type ~= 'multipolygon' then
    return
  end

  table:insert({
    tags = processTags(object.tags),
    meta = Metadata(object),
    geom = object:as_multipolygon(),
    minzoom = 0,
    id = DefaultId(object)
  })
end
