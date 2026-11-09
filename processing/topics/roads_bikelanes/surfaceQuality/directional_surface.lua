-- Roads in mixed traffic get no bikelane geometry, so `surface:bicycle*`, `surface:forward|backward`
-- and `surface:left|right` cannot become own lines. We keep one `surface` for the road and add
-- a hint token to `description` for each differing value (see `tilda_description`).
-- Hints name sides only: in right-hand traffic `forward` is the right half and `backward` the left half
-- of the way; when both are tagged, the side value wins.
-- https://wiki.openstreetmap.org/wiki/Verkehrswende-Meetup/Radwege#Randseitige_Asphaltierung_.28von_Kopfsteinpflaster.29
-- Examples (Berlin):
--   `surface:bicycle`: https://www.openstreetmap.org/way/31349228 (Gleimstraße, sett with asphalt for bicycles)
--   `surface:bicycle:forward`: https://www.openstreetmap.org/way/182693863 (Innstraße, asphalt with sett at the edge)
--   `surface:bicycle:forward|backward`: https://www.openstreetmap.org/way/160765596 (Ingrid-Rabe-Straße)
--   `surface:forward` + `surface:right`: https://www.openstreetmap.org/way/4582011 (Mittelstraße, sett with asphalt at the edge)
--   `surface:forward|backward` without `surface`: https://www.openstreetmap.org/way/25746850 (Haeckelstraße)
--   `surface:left|right` without `surface`: https://www.openstreetmap.org/way/48435428 (Finkenkruger Weg)
--   `surface:left|right` on a path: https://www.openstreetmap.org/way/4475759 (Mehringplatz)
-- Bikelanes of some categories use these hints as well, see `derive_bikelane_surface_tags`.
local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local derive_smoothness = require('topics.helper.derive_smoothness')
local DESC = require('topics.helper.tilda_description')
local merge_table = require('topics.helper.merge_table')

-- Order matters: per token the first tagged key counts, and on equal badness the first value wins.
local SURFACE_KEYS = {
  { key = 'surface:bicycle', token = 'surface_bicycle' },
  { key = 'surface:bicycle:right', token = 'surface_bicycle_right' },
  { key = 'surface:bicycle:forward', token = 'surface_bicycle_right' },
  { key = 'surface:bicycle:left', token = 'surface_bicycle_left' },
  { key = 'surface:bicycle:backward', token = 'surface_bicycle_left' },
  { key = 'surface:right', token = 'surface_right' },
  { key = 'surface:forward', token = 'surface_right' },
  { key = 'surface:left', token = 'surface_left' },
  { key = 'surface:backward', token = 'surface_left' },
}

local SMOOTHNESS_RANK = { excellent = 1, good = 2, intermediate = 3, bad = 4, very_bad = 5 }

---@param raw_surface string
---@return integer
local function badness(raw_surface)
  local smoothness = derive_smoothness({ surface = raw_surface }).smoothness
  return SMOOTHNESS_RANK[smoothness] or 0
end

---@class DirectionalSurfaceResult
---@field surface_tags OsmTags|nil Copy of the tags with the chosen `surface`; nil when `surface` stays as tagged
---@field hints string[] hint tokens for values that differ from the chosen surface

--- Pick the road surface: `surface` when tagged with a valid value, otherwise the worst of the directional values.
---@param tags OsmTags
---@param skip_keys table<string, boolean>|nil keys the caller handles itself
---@return DirectionalSurfaceResult
local function directional_surface(tags, skip_keys)
  local values = {}
  local seen_tokens = {}
  for _, entry in ipairs(SURFACE_KEYS) do
    local raw = not (skip_keys and skip_keys[entry.key]) and tags[entry.key] or nil
    local surface = SANITIZE_TAGS.allowed_surface(raw, tags)
    if surface and not seen_tokens[entry.token] then
      seen_tokens[entry.token] = true
      table.insert(values, { token = entry.token, raw = raw, surface = surface })
    end
  end
  if #values == 0 then return { surface_tags = nil, hints = {} } end

  local surface_tags = nil
  local chosen_surface = SANITIZE_TAGS.allowed_surface(tags.surface, tags)
  if chosen_surface == nil then
    local worst = values[1]
    for _, value in ipairs(values) do
      if badness(value.raw) > badness(worst.raw) then worst = value end
    end
    surface_tags = merge_table({}, tags)
    surface_tags.surface = worst.raw
    chosen_surface = worst.surface
  end

  local hints = {}
  for _, value in ipairs(values) do
    if value.surface ~= chosen_surface then
      table.insert(hints, DESC.token(value.token, value.surface))
    end
  end

  return { surface_tags = surface_tags, hints = hints }
end

return directional_surface
