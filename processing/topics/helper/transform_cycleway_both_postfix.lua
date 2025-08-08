require('init')

-- Transform `cycleway=no` to `cycleway:both=no` for consistent transformation handling.
-- For other cycleway-tags our transformation works fine but for `no` in combination with `bicycle_road=yes` it exited the processing too early.
---@param destTags table<string, string> The input table of OSM tags to mutate in-place
---@return table<string, string> unmodified_tags A table containing the original values that were overwritten
local function transform_cycleway_both_postfix(destTags)
  local unmodified_tags = {}

  -- Check if we have cycleway=no but no side-specific cycleway tags
  if destTags.cycleway == 'no' and not destTags['cycleway:both'] and not destTags['cycleway:left'] and not destTags['cycleway:right'] then

    -- Store the original value for debugging
    unmodified_tags['cycleway'] = destTags['cycleway']

    -- Convert to cycleway:both=no for consistent transformation handling
    destTags['cycleway:both'] = 'no'
    destTags.cycleway = nil
  end

  return unmodified_tags
end

return transform_cycleway_both_postfix
