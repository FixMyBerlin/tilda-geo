local has_prefix = require('topics.helper.has_prefix')
local SIDE_LIFECYCLE = require('topics.roads_bikelanes.helper.transform_tags.side_lifecycle')

-- Mutate the input to transform `construction:bicycle_road=yes` to be `bicycle_road=yes`.
-- - Function returns the old tags `<oldKey>=<oldValue>` for debugging … but we don't use that ATM
-- - Deletes the original `construction:*` values because they are now obsolete
-- Docs: https://wiki.openstreetmap.org/wiki/Lifecycle_prefix#Common_prefixes
---@param destTags OsmTags The input table of OSM tags to mutate in-place
---@return OsmTags unmodified_tags A table containing the original values that were overwritten
local function transform_construction_prefix(destTags)
  local unmodified_tags = {}

  -- First pass: collect all construction keys to avoid modifying table during iteration
  local construction_keys = {}
  for key, value in pairs(destTags) do
    if has_prefix(key, 'construction:') then
      construction_keys[key] = value
    end
  end

  -- Second pass: process the construction keys
  for key, value in pairs(construction_keys) do
    -- Remove the 'construction:' (13 chars + 1) prefix to get the base tag name
    local base_tag = key:sub(14)

    -- Store the original value as `osm_*` tag should it exist
    unmodified_tags[base_tag] = destTags[base_tag]

    -- Add the tag without the construction prefix
    destTags[base_tag] = value
    -- Delete the prefixed tag
    destTags[key] = nil

    -- Add the lifecycle-tag to track this modification
    -- Place it at the right 'layer' based on the base tag structure
    if SIDE_LIFECYCLE.is_side_key(base_tag) then
      -- For cycleway[:SIDE], sidewalk[:SIDE] -> cycleway[:SIDE]:lifecycle, sidewalk[:SIDE]:lifecycle
      destTags[base_tag .. ':lifecycle'] = 'construction'
    else
      -- For highway, bicycle_road, etc. -> lifecycle
      destTags['lifecycle'] = 'construction'
    end
  end

  return unmodified_tags
end

return transform_construction_prefix
