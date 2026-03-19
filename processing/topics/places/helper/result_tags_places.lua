require('init')
local extract_public_tags = require('extract_public_tags')
local SANITIZE_TAGS = require('sanitize_tags')
local CLEANER = require('sanitize_cleaner')

local function result_tags_places(tags)
  local result_tags = {
    place = tags.place,
    capital = SANITIZE_TAGS.safe_string(tags.capital),
    population_date = SANITIZE_TAGS.safe_string(tags['population:date']),
    admin_level = tonumber(tags.admin_level),
  }
  result_tags.population = tonumber(tags.population)
  result_tags.name = SANITIZE_TAGS.safe_string(tags.name)
  result_tags.website = SANITIZE_TAGS.safe_string(tags.website)
  result_tags.wikidata = SANITIZE_TAGS.safe_string(tags.wikidata)
  result_tags.wikipedia = SANITIZE_TAGS.safe_string(tags.wikipedia)

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_places
