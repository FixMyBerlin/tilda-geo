require('init')
local SET = require('sets')
local exclude = require('exclude_highways')

local forbidden_accesses_bikelanes = SET.set({ 'private', 'no', 'delivery', 'permit' })

local function exit_processing_roads_bikelanes(object_tags)
  if exclude.by_highway_class(object_tags) then return true end
  if exclude.by_other_tags(object_tags) then return true end
  if exclude.by_access(object_tags, forbidden_accesses_bikelanes) then return true end
  if exclude.by_service(object_tags) then return true end

  return false
end

return {
  exit_processing_roads_bikelanes = exit_processing_roads_bikelanes,
  forbidden_accesses_bikelanes = forbidden_accesses_bikelanes,
}
