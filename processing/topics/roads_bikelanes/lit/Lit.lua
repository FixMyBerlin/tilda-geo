require('init')
require("CopyTags")
require("TimeUtils")
require("Set")

local tags_copied = {}
local tags_prefixed = {}

function Lit(object)
  local tags = object.tags
  local result_tags = {_meta = {}}

  -- Categorize the data in three groups: "lit", "unlit", "special"
  if tags.lit ~= nil then
    if (tags.lit == "yes" or tags.lit == "no") then
      result_tags.lit = tags.lit
    else
      result_tags.lit = "special"
    end
  end

  CopyTags(result_tags, tags, tags_copied)
  CopyTags(result_tags, tags, tags_prefixed, "osm_")

  return result_tags
end
