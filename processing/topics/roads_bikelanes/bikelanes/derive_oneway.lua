-- Expects tags after `normalize_oneway_tags`: one-way is `yes` or `-1` (against the drawing direction).
---@param value string|nil
local function is_oneway(value)
  return value == 'yes' or value == '-1'
end

-- Oneway fallback of a track tagged on the road (`cycleway:<side>=track`, category `*_adjoining`
-- with prefix `cycleway`): one-way when the other side of the road has cycling infrastructure, else
-- two-way; nil for everything else.
-- Why: the track says little about how the path is built. Cycling infrastructure on the other side
-- (lane, track, `separate`, a sidewalk open to bicycles, …) means cyclists have a way on each side,
-- so this one runs with its side. Nothing there (also `not_expected` on a one-way road) means this is
-- the only cycle path of the road, so we assume it is two-way. Other cases need an explicit tag.
---@param tags OsmTags transformed tags of one side
---@param category table
---@param context { other_side_has_cycling: boolean }|nil
---@return boolean|nil nil when this is not a track tagged on the road
local function road_track_is_one_way(tags, category, context)
  if context == nil or category.position ~= 'adjoining' then return nil end
  if tags._prefix ~= 'cycleway' or tags._side == 'self' then return nil end
  return context.other_side_has_cycling
end

-- Without a tag, the category decides (`implicitOneWay` in `bikelane_categories.lua`), also for
-- lanes and tracks tagged on the road (`cycleway:<side>=*`):
-- - Lanes (`implicit_yes`): one direction, in and outside settlements. Two-way lanes are very rare,
--   and then mostly protected bike lanes. Shared motor vehicle lanes (`shared_lane`) are the car lane
--   of their side and also run in one direction.
-- - Tracks, shared and segregated foot and cycle paths and footways with `bicycle=yes`: the position
--   decides (`create_subcategories_adjoining_or_isolated.lua`). Next to a road (`_adjoining`, also
--   tracks tagged on the road, see `road_track_is_one_way`) `implicit_yes`, as in StVO § 2 Abs. 4 and the wiki default for
--   `cycleway:<side>:oneway` (https://wiki.openstreetmap.org/wiki/Key:cycleway:right:oneway#Implicit_values);
--   away from roads (`_isolated`) `assumed_no`; unknown position (`_adjoiningOrIsolated`) the category.
--   Outside settlements shared foot and cycle paths next to roads are often two-way by sign. We can't
--   tell settlements apart yet (the settlement areas are not active), so those stay `implicit_yes`
--   with low confidence (todo `missing_oneway`). Once settlement areas are active, we recommend
--   `assumed_no` for `footAndCyclewayShared_adjoining` outside settlements: in Brandenburg 61 % of
--   the tagged ones are two-way, over 600 km with a two-way sign (1000-3x). See
--   `pseudo_tags_settlement_area/README.md`.
--   Trade-off and numbers: https://github.com/FixMyBerlin/tilda-geo/pull/424.
--   The line direction follows the wiki default, see `LINE_DIRECTION.bikelane_reversed` (`helper/line_direction.lua`).
---@param tags OsmTags
---@param category table
---@param context { other_side_has_cycling: boolean }|nil only for the sides of a road, see `road_track_is_one_way`
---@return 'yes'|'no'|'car_not_bike'|'assumed_no'|'implicit_yes'
local function derive_oneway(tags, category, context)
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

  local road_track_one_way = road_track_is_one_way(tags, category, context)
  if road_track_one_way ~= nil then
    return road_track_one_way and 'implicit_yes' or 'assumed_no'
  end

  if category.implicitOneWay then
    return 'implicit_yes'
  end

  return 'assumed_no'
end

return derive_oneway
