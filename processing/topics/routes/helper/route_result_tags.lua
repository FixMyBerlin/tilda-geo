local extract_public_tags = require('topics.helper.extract_public_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')

-- Tags shared by all non-bicycle route types (mtb, bus, foot, hiking).
local function route_result_tags(object)
  local tags = object.tags
  local result_tags = {
    route = tags.route,
    name = SANITIZE_TAGS.safe_string(tags.name),
    ref = SANITIZE_TAGS.safe_string(tags.ref),
    network = SANITIZE_TAGS.safe_string(tags.network),
    operator = SANITIZE_TAGS.safe_string(tags.operator),
    from = SANITIZE_TAGS.safe_string(tags.from),
    to = SANITIZE_TAGS.safe_string(tags.to),
    route_description = SANITIZE_TAGS.safe_string(tags.description or tags['description:de']),
    website = SANITIZE_TAGS.safe_string(tags.website),
    wikipedia = SANITIZE_TAGS.safe_string(tags.wikipedia),
  }

  -- Same as bikeroutes: `/` keeps multiple colours in one value.
  if tags.colour ~= nil then
    result_tags.colours = string.gsub(tags.colour, ';', '/')
  end

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, object.tags, {})
end

return route_result_tags
