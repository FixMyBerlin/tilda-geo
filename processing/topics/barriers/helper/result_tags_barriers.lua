require('init')
local extract_public_tags = require('extract_public_tags')
local SANITIZE_TAGS = require('sanitize_tags')
local SANITIZE_BARRIER_TAGS = require('sanitize_barrier_tags')
local CLEANER = require('sanitize_cleaner')

local function result_tags_barriers(tags)
  local result_tags = {
    tunnel = SANITIZE_BARRIER_TAGS.tunnel(tags.tunnel),
    waterway = SANITIZE_BARRIER_TAGS.waterway(tags.waterway),
    aerodrome = SANITIZE_BARRIER_TAGS.aerodrome(tags.aerodrome),
    name = SANITIZE_TAGS.safe_string(tags.name),
    natural = SANITIZE_BARRIER_TAGS.natural(tags.natural),
    railway = SANITIZE_BARRIER_TAGS.railway(tags.railway),
    usage = SANITIZE_BARRIER_TAGS.usage(tags.usage),
    circumference = tags._computed_circumference,
    area = tags._computed_area,
    highway = tags.highway,
    bridge = SANITIZE_BARRIER_TAGS.bridge(tags.bridge),
  }

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_barriers
