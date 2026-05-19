local extract_public_tags = require('topics.helper.extract_public_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

local function result_tags_public_transport(tags)
  local category

  if tags.railway == 'station' or tags.railway == 'halt' then
    category = 'railway_station'
  end
  if tags.amenity == 'ferry_terminal' then
    category = 'ferry_station'
  end
  if tags.station == 'subway' then
    category = 'subway_station'
  end
  if tags.station == 'light_rail' then
    category = 'light_rail_station'
  end
  if tags.railway == 'tram_stop' then
    category = 'tram_station'
  end
  if category == nil then
    category = 'undefined'
  end

  local result_tags = {
    category = category,
    name = SANITIZE_TAGS.safe_string(tags.name),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
    wikidata = SANITIZE_TAGS.safe_string(tags.wikidata),
    wikipedia = SANITIZE_TAGS.safe_string(tags.wikipedia),
    description = SANITIZE_TAGS.safe_string(tags.description or tags.note),
    network = SANITIZE_TAGS.safe_string(tags.network),
    network_short = SANITIZE_TAGS.safe_string(tags['network:short']),
  }

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_public_transport
