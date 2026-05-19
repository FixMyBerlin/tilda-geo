local sanitize_for_logging = require('topics.helper.sanitize_for_logging')
local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

local function result_tags_bikeroutes(object)
  local tags = object.tags
  local result_tags = {
    distance = tonumber(tags.distance),
    network = sanitize_for_logging(tags.network, { 'lcn', 'rcn', 'ncn', 'icn' }),
    cycle_highway = sanitize_for_logging(tags.cycle_highway, { 'yes' }),
    roundtrip = sanitize_for_logging(tags.roundtrip, { 'yes', 'no' }),
    network_type = sanitize_for_logging(tags['network:type'], { 'node_network', 'basic_network' }),
    cycle_network_key = SANITIZE_TAGS.safe_string(tags.cycle_network),
    symbol_description = SANITIZE_TAGS.safe_string(tags.symbol),
    route_description = SANITIZE_TAGS.safe_string(tags.description or tags['description:de']),
    name = SANITIZE_TAGS.safe_string(tags.name),
    ref = SANITIZE_TAGS.safe_string(tags.ref),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
    website = SANITIZE_TAGS.safe_string(tags.website),
    wikipedia = SANITIZE_TAGS.safe_string(tags.wikipedia),
  }

  -- TODO: Check how this is used in TS; We split for `;` in TS but maybe this `/` was by design…
  if tags.colour ~= nil then
    result_tags.colours = string.gsub(tags.colour, ';', '/')
  end

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, object.tags, {})
end

return result_tags_bikeroutes
