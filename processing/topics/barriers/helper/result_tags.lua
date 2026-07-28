local extract_public_tags = require('topics.helper.extract_public_tags')
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local SANITIZE_BARRIER_TAGS = require('topics.barriers.helper.sanitize_barrier_tags')
local CLEANER = require('topics.helper.sanitize_cleaner')

local function result_tags_barriers(tags)
  local result_tags = {
    tunnel = SANITIZE_BARRIER_TAGS.tunnel(tags.tunnel),
    waterway = SANITIZE_BARRIER_TAGS.waterway(tags.waterway),
    aerodrome = SANITIZE_BARRIER_TAGS.aerodrome(tags.aerodrome),
    name = SANITIZE_TAGS.safe_string(tags.name),
    natural = SANITIZE_BARRIER_TAGS.natural(tags.natural),
    railway = SANITIZE_BARRIER_TAGS.railway(tags.railway),
    usage = SANITIZE_BARRIER_TAGS.usage(tags.usage),
    area = tags._computed_area,
    highway = tags.highway,
    bridge = SANITIZE_BARRIER_TAGS.bridge(tags.bridge),
  }

  local public_result_tags = extract_public_tags(result_tags)
  return CLEANER.separate_tags(public_result_tags, tags, {})
end

return result_tags_barriers
