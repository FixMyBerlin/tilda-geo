-- Interprets sidepath-estimation pseudo tags plus explicit OSM `is_sidepath:of` into the
-- published adjoining motor-road context. Shared by bikelanes standalone rows, the
-- roadsPathClasses writer, and routing's resolve_motor_road_context.
--
-- Winner:
-- - Crossings: CSV only. OSM `:of` names the parallel parent street; the CSV names the
--   crossed carriageway (`ST_Intersects`). Never mix them.
-- - Otherwise a usable `:of` wins, so a mapper can override bad sniffing. Unusable `:of`
--   (typo, street name, trunk) falls through to the CSV.
-- - OSM `:of` is a highway class with no sub-tags. It cannot become `residential_priority_road`.
--   When `:of` is usable we keep that coarser value and do not enrich it from the CSV.
--
-- The CSV `adjoining_maxspeed` belongs to the CSV class. Keep it only when that class is
-- the one we publish.

local category_is_sidepath = require('topics.roads_bikelanes.bikelanes.categories.category_is_sidepath')
local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local adjoining_sources = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_sources')

--- Sidepath context = the estimation pseudo tag, OR any explicit sidepath tagging (via the shared
--- `category_is_sidepath`: is_sidepath=yes, parent_road, footway/path/steps=sidewalk,
--- path/cycleway=sidepath).
---@param object_tags OsmTags
---@param tags OsmTags
---@return boolean
local function has_sidepath_context(object_tags, tags)
  return object_tags._is_sidepath == 'assumed_yes' or not not category_is_sidepath(tags)
end

---@class AdjoiningContext
---@field adjoining_road string|nil
---@field adjoining_maxspeed number|nil

--- Filled whenever a source has a value (no sidepath gate). `{}` for Fahrradstraße /
--- Fußgängerzone-Rad-frei and when neither source has anything.
---@param object_tags OsmTags
---@param tags OsmTags
---@return AdjoiningContext
local function derive_adjoining_context(object_tags, tags)
  if bikelane_categories.is_own_cycling_facility(object_tags)
    or bikelane_categories.is_own_cycling_facility(tags)
  then
    return {}
  end

  local sources = adjoining_sources.read_adjoining_sources(object_tags, tags)
  local adjoining_road
  local adjoining_maxspeed

  if sources.is_crossing then
    adjoining_road = sources.csv_road
    adjoining_maxspeed = sources.csv_maxspeed
  elseif sources.of_mapped then
    adjoining_road = sources.of_mapped
    if sources.csv_road == sources.of_mapped then
      adjoining_maxspeed = sources.csv_maxspeed
    end
  else
    adjoining_road = sources.csv_road
    adjoining_maxspeed = sources.csv_maxspeed
  end

  -- nil fields are not stored, so "nothing found" is `{}` without an extra check.
  return {
    adjoining_road = adjoining_road,
    adjoining_maxspeed = adjoining_maxspeed,
  }
end

return {
  has_sidepath_context = has_sidepath_context,
  derive_adjoining_context = derive_adjoining_context,
  sanitize_is_sidepath_of = adjoining_sources.sanitize_is_sidepath_of,
}
