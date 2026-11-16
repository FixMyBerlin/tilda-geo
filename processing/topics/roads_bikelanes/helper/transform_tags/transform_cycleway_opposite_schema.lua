
-- Mutate `cycleway=opposite` to the oneway-schema.
-- Docs: https://wiki.openstreetmap.org/wiki/DE:Tag:cycleway%3Dopposite
-- This doesn't handle opposite tagging on nested tags.
---@param destTags OsmTags The input table of OSM tags to mutate in-place
---@return OsmTags unmodified_tags A table containing the original values that were overwritten
local function transform_cycleway_opposite_schema(destTags)
  local unmodified_tags = {}

  if destTags.oneway ~= 'yes' and destTags.oneway ~= '-1' then
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

  local opposite_values = { opposite_lane = 'lane', opposite_track = 'track' }
  local value = opposite_values[destTags.cycleway]
  if value then
    -- The contraflow lane is on the left in the direction of travel: the left side of the way
    -- on `oneway=yes` (riding against the way), the right side on `oneway=-1` (riding with it).
    local side, other_side, direction = 'left', 'right', '-1'
    if destTags.oneway == '-1' then
      side, other_side, direction = 'right', 'left', 'yes'
    end
    local oneway_key = 'cycleway:' .. side .. ':oneway'

    -- Store the original values for debugging
    unmodified_tags.cycleway = destTags.cycleway
    unmodified_tags['cycleway:' .. other_side] = destTags['cycleway:' .. other_side]
    unmodified_tags['cycleway:' .. side] = destTags['cycleway:' .. side]
    unmodified_tags[oneway_key] = destTags[oneway_key]
    unmodified_tags['oneway:bicycle'] = destTags['oneway:bicycle']

    destTags['cycleway'] = nil
    destTags['cycleway:' .. other_side] = 'no'
    destTags['cycleway:' .. side] = value
    -- Explicit, because on a oneway road both sides follow the road unless tagged otherwise.
    destTags[oneway_key] = destTags[oneway_key] or direction
    destTags['oneway:bicycle'] = 'no'
    return unmodified_tags
  end

  return unmodified_tags
end

return transform_cycleway_opposite_schema
