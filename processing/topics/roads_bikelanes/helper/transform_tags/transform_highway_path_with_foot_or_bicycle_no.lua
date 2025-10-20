require('init')
require('Log')

-- Transform misclassified highway=path tags to their correct primary highway type.
--
-- Background: We allow highway=path with foot=no for bikelane categorization, but for roads processing
-- we need to be more strict about path accessibility. Instead of excluding these paths entirely,
-- we transform them to their (assumed) actual infrastructure type based on access restrictions:
-- - highway=path + foot=no + bicycle=designated/yes/nil → highway=cycleway
-- - highway=path + foot=yes/designated/nil + bicycle=no → highway=footway
--
---@param destTags table<string, string> The input table of OSM tags to mutate in-place
---@return table<string, string> unmodified_tags A table containing the original values that were overwritten
local function transform_highway_path_with_foot_or_bicycle_no(destTags)
  local unmodified_tags = {}

  if destTags.highway ~= 'path' then
    return unmodified_tags
  end

  -- Transform highway=path + foot=no + bicycle=designated/yes/nil -> highway=cycleway
  if destTags.foot == 'no' and (destTags.bicycle == 'designated' or destTags.bicycle == 'yes' or destTags.bicycle == nil) then
    -- Store the original values for debugging
    unmodified_tags.highway = destTags.highway
    unmodified_tags.foot = destTags.foot
    unmodified_tags.bicycle = destTags.bicycle

    destTags.highway = 'cycleway'
    destTags.foot = nil
    destTags.bicycle = nil
    return unmodified_tags
  end

  -- Transform highway=path + foot=yes/designated/nil + bicycle=no -> highway=footway
  if destTags.bicycle == 'no' and (destTags.foot == 'yes' or destTags.foot == 'designated' or destTags.foot == nil) then
    -- Store the original values for debugging
    unmodified_tags.highway = destTags.highway
    unmodified_tags.foot = destTags.foot
    unmodified_tags.bicycle = destTags.bicycle

    destTags.highway = 'footway'
    destTags.foot = nil
    destTags.bicycle = nil
    return unmodified_tags
  end

  return unmodified_tags
end

return transform_highway_path_with_foot_or_bicycle_no
