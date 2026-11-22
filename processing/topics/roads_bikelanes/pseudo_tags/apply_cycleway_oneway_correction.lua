-- Corrects a wrong `cycleway:*:oneway=yes` on a two-way road in Berlin before the direction is derived,
-- as if the OSM edit were already done. The ways come from `cycleway_oneway_corrections.csv`, see
-- `pseudoTags/cyclewayOnewayCorrectionsSource/README.md`.
--
-- The change is the one of the planned OSM edit (infravelo-radnetz `osm-cleanup/oneway-2026-11`, `new_tags`):
-- - Remove `cycleway:oneway`, `cycleway:both:oneway`, `cycleway:left:oneway`, `cycleway:right:oneway` where
--   the value is `yes`.
-- - On a side covered by a removed tag with a track, set the side default explicitly (left `-1`, right
--   `yes`): without a tag a track that is the only cycle path of the road reads as two-way.
--
-- Ways edited on or after `CUTOFF` count as corrected in OSM, whatever their tags say. Keep the date in sync
-- with `PSEUDO_TAG_CUTOFF` in `scripts/build_cleanup.py`.

-- 2026-11-22T00:00:00Z in unix seconds, like `object.timestamp`.
local CUTOFF = 1795305600

local SIDE_DEFAULTS = { left = '-1', right = 'yes' }
local COVERS = {
  ['cycleway:oneway'] = { left = true, right = true },
  ['cycleway:both:oneway'] = { left = true, right = true },
  ['cycleway:left:oneway'] = { left = true },
  ['cycleway:right:oneway'] = { right = true },
}

local function side_infra(tags, side)
  return tags['cycleway:' .. side] or tags['cycleway:both'] or tags.cycleway
end

---@param object_tags OsmTags with `_timestamp` (unix seconds)
local function apply_cycleway_oneway_correction(object_tags)
  if object_tags._timestamp and object_tags._timestamp >= CUTOFF then
    return
  end

  local covered = {}
  for key, sides in pairs(COVERS) do
    if object_tags[key] == 'yes' then
      object_tags[key] = nil
      for side in pairs(sides) do
        covered[side] = true
      end
    end
  end

  for side, default in pairs(SIDE_DEFAULTS) do
    local key = 'cycleway:' .. side .. ':oneway'
    if covered[side] and side_infra(object_tags, side) == 'track' and object_tags[key] == nil then
      object_tags[key] = default
    end
  end
end

return apply_cycleway_oneway_correction
