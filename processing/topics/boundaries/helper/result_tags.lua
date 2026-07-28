local extract_public_tags = require('topics.helper.extract_public_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

local function result_tags_boundaries(tags)
  local admin_level = tonumber(tags.admin_level)
  local result_tags = {
    admin_level = admin_level,
    population = tonumber(tags.population),
    population_date = SANITIZE_TAGS.safe_string(tags['population:date']),
    name = SANITIZE_TAGS.safe_string(tags.name),
    name_prefix = SANITIZE_TAGS.safe_string(tags['name:prefix']),
    wikidata = SANITIZE_TAGS.safe_string(tags.wikidata),
    wikipedia = SANITIZE_TAGS.safe_string(tags.wikipedia),
    regionalschluessel = SANITIZE_TAGS.safe_string(tags['de:regionalschluessel']),
  }

  if admin_level == 8 then
    result_tags.category_municipality = 'Gemeinde'
  end
  if admin_level == 6 then
    result_tags.category_district = 'Landkreis'
    if tags.place == 'city' or tags['name:prefix'] == 'Kreisfreie Stadt' then
      result_tags.category_municipality = 'Kreisfreie Stadt'
      result_tags.category_district = 'Kreisfreie Stadt'
    end
  end
  if admin_level == 4 and tags.place == 'city' then
    result_tags.category_municipality = 'Stadtstaat'
    result_tags.category_district = 'Stadtstaat'
  end

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_boundaries
