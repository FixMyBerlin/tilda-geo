-- `surface:bicycle*`, `surface:forward|backward`, `surface:left|right` and `smoothness:bicycle` on bikelanes
--
-- `surface:bicycle` describes a strip of the way that bicycles use, mostly an asphalt strip at the edge
-- of a sett road. `surface:forward|backward` and `surface:left|right` describe one half of the way.
-- One bikelane line cannot show these parts, so we pick one surface and add hint tokens for the
-- other parts to `description`, the same way as on roads (see `directional_surface`, `tilda_description`).
-- When the surface comes from these values, `surface_source` is `tag_directional`
-- (or `parent_highway_tag_directional`).
-- The category decides how a bikelane reads the tags (`BikelaneCategory.bicycleSurface`):
--
-- 'strip': Bicycles share a wide area with other traffic and use a strip of it.
--   The bikelane takes the bicycle values, and the hints `surface_strip` and `smoothness_strip` name
--   the surface of the rest of the way, so this information is not lost.
--   Categories: `bicycleRoad`, `bicycleRoad_vehicleDestination`, `pedestrianAreaBicycleYes`,
--   `sharedMotorVehicleLane` (reads the tags of the parent road).
--   Example: https://www.openstreetmap.org/way/840977557 (Grimmstraße, Fahrradstraße,
--   `surface=sett`, `surface:bicycle=asphalt`, `smoothness:bicycle=good`)
--
-- 'whole_way': The bikelane is a way of its own; bicycles use the whole width or their own half
--   (`segregated=yes`). `surface:bicycle` is the surface of the bikelane, without a hint.
--   Categories: `cycleway`, `footAndCyclewayShared`, `footAndCyclewaySegregated`, `footwayBicycleYes`
--   and their `_adjoining|_isolated|_adjoiningOrIsolated` variants.
--   Example: https://www.openstreetmap.org/way/4475759 (Mehringplatz, shared path,
--   `surface=paving_stones`, `surface:left=asphalt`)
--
-- Both: Without `surface:bicycle` and `surface`, the worst directional or side value is the surface.
--   Every directional or side value that differs from the chosen surface gets a hint.
--
-- nil: Lanes on the road (`cyclewayOnHighway_*`, `cyclewayOnHighwayProtected`,
--   `cyclewayOnHighwayBetweenLanes`) and bus lanes. Their own surface is `cycleway:<side>:surface`;
--   the road's values are only the fallback below, without hints.
--
-- Fallback to the parent road (`copySurfaceSmoothnessFromParent`) when the lane has no own surface,
--   in this order: `surface:bicycle`, `surface:bicycle:<side>`, `surface:bicycle:forward|backward`,
--   `surface:<side>`, `surface:forward|backward`, `surface`, then the worst directional or side value.
--   The lane lies in one half of the road: right = forward, left = backward; the direction
--   values only count on roads without `oneway`.
--   Example: https://www.openstreetmap.org/way/4692264 (Körtestraße, `surface=sett`, `surface:bicycle=asphalt`,
--   `cycleway:left:surface=asphalt`)
--
-- When the surface comes from `surface:bicycle`, or a lane takes the side or direction value of the
-- road, the way's `smoothness` does not apply to it; the smoothness is then derived from that surface
-- (unless `smoothness:bicycle` is given). When the worst directional value of the way itself is used,
-- the way's `smoothness` still applies, as on roads.

local SANITIZE_TAGS = require('topics.helper.sanitize_tags')
local derive_smoothness = require('topics.helper.derive_smoothness')
local directional_surface = require('topics.roads_bikelanes.surfaceQuality.directional_surface')
local DESC = require('topics.helper.tilda_description')
local SET = require('topics.helper.sets')
local merge_table = require('topics.helper.merge_table')
local DIRECTION_SIDE = require('topics.helper.direction_side')

---@alias BikelaneBicycleSurface 'strip'|'whole_way'

local BICYCLE_KEYS = SET.set({
  'surface:bicycle',
  'surface:bicycle:right',
  'surface:bicycle:forward',
  'surface:bicycle:left',
  'surface:bicycle:backward',
})

---@class SurfaceChoice
---@field surface string|nil raw OSM value
---@field smoothness string|nil raw OSM value
---@field directional boolean

---@param tags OsmTags
---@param use_bicycle boolean
---@return SurfaceChoice
local function choose(tags, use_bicycle)
  local bicycle = use_bicycle and SANITIZE_TAGS.allowed_surface(tags['surface:bicycle'], tags) and tags['surface:bicycle'] or nil
  local bicycle_smoothness = use_bicycle and tags['smoothness:bicycle'] or nil
  if bicycle then
    return { surface = bicycle, smoothness = bicycle_smoothness, directional = false }
  end
  if SANITIZE_TAGS.allowed_surface(tags.surface, tags) then
    return { surface = tags.surface, smoothness = bicycle_smoothness or tags.smoothness, directional = false }
  end
  local fallback = directional_surface(tags, not use_bicycle and BICYCLE_KEYS or nil).surface_tags
  if fallback then
    return { surface = fallback.surface, smoothness = bicycle_smoothness or tags.smoothness, directional = true }
  end
  return { surface = nil, smoothness = bicycle_smoothness or tags.smoothness, directional = false }
end

---@param parent_tags OsmTags
---@param side 'left'|'right'
---@return SurfaceChoice
local function choose_for_side(parent_tags, side)
  if SANITIZE_TAGS.allowed_surface(parent_tags['surface:bicycle'], parent_tags) then
    return choose(parent_tags, true)
  end
  local two_way = parent_tags.oneway ~= 'yes' and parent_tags.oneway ~= '-1'
  local direction = DIRECTION_SIDE.side_to_direction(side)

  -- Raw value of `key` when it is in the allowlist.
  local function allowed(key)
    local value = parent_tags[key]
    return SANITIZE_TAGS.allowed_surface(value, parent_tags) and value
  end

  local surface = allowed('surface:bicycle:' .. side)
    or (two_way and allowed('surface:bicycle:' .. direction))
    or allowed('surface:' .. side)
    or (two_way and allowed('surface:' .. direction))
  if surface then
    return { surface = surface, smoothness = parent_tags['smoothness:bicycle'], directional = true }
  end
  return choose(parent_tags, true)
end

--- Copy of the tags with the chosen `surface` and `smoothness`.
---@param tags OsmTags
---@param choice SurfaceChoice
---@param parent OsmTags|nil
---@return OsmTags
local function override(tags, choice, parent)
  local result = merge_table({}, tags)
  result.surface = choice.surface
  result.smoothness = choice.smoothness
  result._parent = parent
  result._surface_directional = choice.directional
  return result
end

--- Tags to derive the bikelane surface and smoothness from, see the definition above.
---@param tags OsmTags transformed bikelane tags
---@param category BikelaneCategory
---@return OsmTags
local function derive(tags, category)
  local parent = nil
  if category.copySurfaceSmoothnessFromParent and type(tags._parent) == 'table' then
    local side = tags._side
    local parent_choice = (side == 'left' or side == 'right')
      and choose_for_side(tags._parent, side)
      or choose(tags._parent, true)
    parent = override(tags._parent, parent_choice, nil)
  end

  if category.bicycleSurface == nil then
    if parent == nil then return tags end
    return override(tags, { surface = tags.surface, smoothness = tags.smoothness, directional = false }, parent)
  end
  return override(tags, choose(tags, true), parent)
end

--- `surface_source` with the `_directional` suffix when the surface came from a directional or side value.
---@param tags OsmTags result of `derive`
---@param surface_source string|nil
---@return string|nil
local function source(tags, surface_source)
  if surface_source == 'tag' and tags._surface_directional then
    return 'tag_directional'
  end
  local parent = tags._parent
  if surface_source == 'parent_highway_tag' and type(parent) == 'table' and parent._surface_directional then
    return 'parent_highway_tag_directional'
  end
  return surface_source
end

---@param source_tags OsmTags tags of the way the bikelane took its surface from
---@return string[] tokens naming the surface and smoothness of the rest of the way
local function strip_hints(source_tags)
  local bicycle_surface = SANITIZE_TAGS.allowed_surface(source_tags['surface:bicycle'], source_tags)
  if bicycle_surface == nil then return {} end
  local way_surface = SANITIZE_TAGS.allowed_surface(source_tags.surface, source_tags)
  if way_surface == nil or bicycle_surface == way_surface then return {} end

  local hints = { DESC.token('surface_strip', way_surface) }
  local way_smoothness = derive_smoothness(source_tags).smoothness
  if way_smoothness then table.insert(hints, DESC.token('smoothness_strip', way_smoothness)) end
  return hints
end

--- Hints for categories with `bicycleSurface`. `surface_source` tells whether the bikelane took its surface
--- from its own tags ('tag') or from the parent road ('parent_highway_tag').
---@param tags OsmTags transformed bikelane tags (not the result of `derive`)
---@param category BikelaneCategory
---@param surface_source string|nil
---@return string[]
local function hints(tags, category, surface_source)
  if category.bicycleSurface == nil then return {} end
  local source_tags = tags
  if surface_source == 'parent_highway_tag' or surface_source == 'parent_highway_tag_directional' then
    source_tags = tags._parent
  elseif surface_source ~= 'tag' and surface_source ~= 'tag_directional' then
    return {}
  end
  if type(source_tags) ~= 'table' then return {} end

  local hints = category.bicycleSurface == 'strip' and strip_hints(source_tags) or {}
  -- A lane on the parent road lies in one half of it; the other half does not concern it.
  if source_tags ~= tags then return hints end
  for _, directional_hint in ipairs(directional_surface(source_tags, { ['surface:bicycle'] = true }).hints) do
    table.insert(hints, directional_hint)
  end
  return hints
end

return {
  derive = derive,
  hints = hints,
  source = source,
}
