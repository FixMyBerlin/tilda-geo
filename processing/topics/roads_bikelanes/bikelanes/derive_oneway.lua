-- Expects tags after `normalize_oneway_tags`: one-way is `yes` or `-1` (against the drawing direction).
---@param value string|nil
local function is_oneway(value)
  return value == 'yes' or value == '-1'
end

-- Without a tag, the category decides (`implicitOneWay` in `bikelane_categories.lua`), also for
-- lanes and tracks tagged on the road (`cycleway:<side>=*`):
-- - Lanes (`implicit_yes`): one direction, in and outside settlements. Two-way lanes are very rare,
--   and then mostly protected bike lanes. Shared motor vehicle lanes (`shared_lane`) are the car lane
--   of their side and also run in one direction.
-- - Tracks and shared foot and cycle paths (`assumed_no`): both directions. Outside settlements
--   roadside tracks are often two-way and the `oneway=no` is often missing; inside settlements
--   (e.g. Berlin) the direction is usually tagged. We can't tell settlements apart yet (the settlement
--   areas are not active), so the default follows the case outside settlements. This differs from
--   the wiki default for `cycleway:<side>:oneway` (one direction per side,
--   https://wiki.openstreetmap.org/wiki/Key:cycleway:right:oneway#Implicit_values).
--   The line direction still follows the wiki default, see `side_line_reversed`.
---@param tags OsmTags
---@param category table
---@return 'yes'|'no'|'car_not_bike'|'assumed_no'|'implicit_yes'
local function derive_oneway(tags, category)
  if is_oneway(tags['oneway:bicycle']) then
    return 'yes'
  elseif tags['oneway:bicycle'] == 'no' then
    if is_oneway(tags.oneway) then
      return 'car_not_bike'
    else
      return 'no'
    end
  end

  if is_oneway(tags.oneway) then
    return 'yes'
  elseif tags.oneway == 'no' then
    return 'no'
  end

  if tags.highway == 'service' or tags.highway == 'track' then
    return 'assumed_no'
  end

  if category.implicitOneWay then
    return 'implicit_yes'
  end

  return 'assumed_no'
end

return derive_oneway
