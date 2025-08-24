require('init')
require("CopyTags")
require("Set")
require("Sanitize")
require("Metadata")
require("DefaultId")

local bikeroutesTable = osm2pgsql.define_table({
  name = 'bikeroutes',
  ids = { type = 'any', id_column = 'osm_id', type_column = 'osm_type' },
  columns = {
    { column = 'id',   type = 'text', not_null = true },
    { column = 'tags', type = 'jsonb' },
    { column = 'meta', type = 'jsonb' },
    { column = 'geom', type = 'multilinestring' },
    { column = 'minzoom', type = 'integer', not_null = true },
  },
  indexes = {
    { column = {'minzoom', 'geom'}, method = 'gist' },
    { column = 'id', method = 'btree', unique = true  }
  }
})

function osm2pgsql.process_relation(object)
  local tags = object.tags
  local result_tags = {}

  -- Supposed to be 'km', always. TODO: Ideally modify parse_length to handle different default units.
  result_tags.distance = tonumber(tags.distance)
  result_tags.network = Sanitize(tags.network, { 'lcn', 'rcn', 'ncn', 'icn' })
  -- "Radschnellverbindungen", 15x https://taginfo.geofabrik.de/europe:germany/keys/cycle_highway#values
  -- We only allow `yes`, `nil`+`no` are both `no`
  -- Map: https://overpass-turbo.eu/?w=%22cycle_highway%22%3D%22yes%22+in+Germany&R
  result_tags.cycle_highway = Sanitize(tags.cycle_highway, { 'yes' })
  -- Only yes/no are relevant https://taginfo.geofabrik.de/europe:germany/keys/roundtrip#values
  result_tags.roundtrip = Sanitize(tags.routndtrip, { 'yes', 'no' })
  -- Only those two are relevant https://taginfo.geofabrik.de/europe:germany/keys/network%3Atype#values
  result_tags.network_type = Sanitize(tags['network:type'], { 'node_network', 'basic_network' })

  -- free form text, mostly with cryptic key https://taginfo.geofabrik.de/europe:germany/keys/cycle_network#values
  result_tags.cycle_network_key = tags.cycle_network
  -- free form text, https://taginfo.geofabrik.de/europe:germany/keys/symbol#values
  result_tags.symbol_description = tags.symbol
  -- free form text with route stops
  result_tags.route_description = tags.description or tags['description:de']
  -- rename to plural since it can be multipe colors. Cleanup tags that use a non standard separator
  -- https://taginfo.geofabrik.de/europe:germany/keys/colour#values
  -- (Reminder: Taginfo doesn not just show colour on relations but all usage; Use the "Overpass turbo" link and change query to `relation`)
  if (tags.colour ~= nil) then
    result_tags.colours = string.gsub(tags.colour or "", ";", "/")
    result_tags.colours = string.gsub(result_tags.colour or "", ";", "-")
  end

  local tags_copied = {
    'name',
    'ref',
    'operator',
    'website',
    -- 'wikdata', -- not needed for now
    'wikipedia',
    -- Maybe later add "from", "to", "via" used by cycle_highways (in DE:BW, FRM1)
  }
  CopyTags(result_tags, tags, tags_copied)

  if tags.type == 'route' and tags.route == 'bicycle' then
    bikeroutesTable:insert({
      tags = result_tags,
      meta = Metadata(object),
      geom = object:as_multilinestring(),
      minzoom = 0,
      id = DefaultId(object)
    })
  end
end
