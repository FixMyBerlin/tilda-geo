require('init')
require('JoinSets')
require('HighwayClasses')

-- Mutate the construction tags to become our own `lifecycle` tag.
---@param destTags table<string, string> The input table of OSM tags to mutate in-place
---@return table<string, string> unmodified_tags A table containing the original values that were overwritten
local function transform_lifecycle_tags(destTags)
  local unmodified_tags = {}

  if not destTags.highway then
    return unmodified_tags
  end

  -- Skip stuff like 'construction' (some), 'proposed', 'platform' (Haltestellen), 'rest_area' (https://wiki.openstreetmap.org/wiki/DE:Tag:highway=rest%20area)
  -- REMINDER: Keep in sync with `processing/topics/roads_bikelanes/helper/exclude_highways.lua` > `by_highway_class`
  local allowed_highways = JoinSets({ HighwayClasses, MajorRoadClasses, MinorRoadClasses, PathClasses })

  if allowed_highways[destTags.construction] then
    -- Store the original value for debugging
    unmodified_tags.highway = destTags.highway
    unmodified_tags.lifecycle = destTags.lifecycle

    -- Transform `highway=construction + construction=ALLOW_LIST`. Only data with missing `construction=*` is skipped.
    destTags.highway = destTags.construction
    destTags.lifecycle = 'construction'
    destTags.construction = nil
  end

  return unmodified_tags
end

return transform_lifecycle_tags
