local SET = require('topics.helper.sets')
local exclude = require('topics.roads_bikelanes.helper.exclude_highways')
local EXIT = require('topics.roads_bikelanes.helper.exit_processing')
local category_is_sidepath = require('topics.roads_bikelanes.bikelanes.categories.category_is_sidepath')

-- Skip gates for inserting into `roads` / `roadsPathClasses`.
--
-- `routing` join invariant: every `standalone_path` uses
-- `source_table=roadsPathClasses` (virtual centerline infra joins `bikelanes`).
-- Those edges must exist in `roadsPathClasses` (`source_id` = path `id`). Call
-- this function from both `roads_bikelanes_roads.lua` (before insert) and
-- `build_segments.lua` (before emitting standalone_path) so inclusion cannot drift.
--
-- Do not apply this to `virtual_bikelane`. `category_is_sidepath` is true when
-- `parent_road` is set, which would drop centerline-derived
-- `footwayBicycleYes*` / `sidewalk:*` virtuals. OSM sidewalk tags are excluded
-- here on purpose (they never enter the path table).

local forbidden_accesses_roads = SET.join_sets({
  EXIT.forbidden_accesses_bikelanes,
  SET.set({ 'destination', 'customers' }),
})

---@param object_tags OsmTags
---@return boolean
local function excluded_from_roads_tables(object_tags)
  if category_is_sidepath(object_tags) then return true end
  if exclude.by_access(object_tags, forbidden_accesses_roads) then return true end
  if exclude.by_indoor(object_tags) then return true end
  if exclude.by_informal(object_tags) then return true end
  return false
end

return excluded_from_roads_tables
