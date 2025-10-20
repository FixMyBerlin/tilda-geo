require('init')

-- Mutate `cycleway=opposite` to the oneway-schema.
-- Docs: https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway%3Dopposite
-- This doesn't handle opposite tagging on nested tags.
---@param destTags table<string, string> The input table of OSM tags to mutate in-place
---@return table<string, string> unmodified_tags A table containing the original values that were overwritten
local function transform_cycleway_opposite_schema(destTags)
  local unmodified_tags = {}

  if destTags.oneway ~= 'yes' then
    return unmodified_tags
  end

  if destTags.cycleway == 'opposite' then
    -- Store the original values for debugging
    unmodified_tags.cycleway = destTags.cycleway
    unmodified_tags['oneway:bicycle'] = destTags['oneway:bicycle']

    destTags['cycleway'] = 'no'
    destTags['oneway:bicycle'] = 'no'
    return unmodified_tags
  end

  if destTags.cycleway == 'opposite_lane' then
    -- Store the original values for debugging
    unmodified_tags.cycleway = destTags.cycleway
    unmodified_tags['cycleway:right'] = destTags['cycleway:right']
    unmodified_tags['cycleway:left'] = destTags['cycleway:left']
    unmodified_tags['oneway:bicycle'] = destTags['oneway:bicycle']

    destTags['cycleway'] = nil
    destTags['cycleway:right'] = 'no'
    destTags['cycleway:left'] = 'lane'
    destTags['oneway:bicycle'] = 'no'
    return unmodified_tags
  end

  if destTags.cycleway == 'opposite_track' then
    -- Store the original values for debugging
    unmodified_tags.cycleway = destTags.cycleway
    unmodified_tags['cycleway:right'] = destTags['cycleway:right']
    unmodified_tags['cycleway:left'] = destTags['cycleway:left']
    unmodified_tags['oneway:bicycle'] = destTags['oneway:bicycle']

    destTags['cycleway'] = nil
    destTags['cycleway:right'] = 'no'
    destTags['cycleway:left'] = 'track'
    destTags['oneway:bicycle'] = 'no'
    return unmodified_tags
  end

  return unmodified_tags
end

return transform_cycleway_opposite_schema
