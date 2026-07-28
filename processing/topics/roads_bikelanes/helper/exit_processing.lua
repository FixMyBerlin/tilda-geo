local SET = require('topics.helper.sets')
local exclude = require('topics.roads_bikelanes.helper.exclude_highways')

local forbidden_accesses_bikelanes = SET.set({ 'private', 'no', 'delivery', 'permit' })

---@param object_tags table<string, string | nil>
---@return boolean
local function exit_processing(object_tags)
  if exclude.by_highway_class(object_tags) then return true end
  if exclude.by_other_tags(object_tags) then return true end
  if exclude.by_access(object_tags, forbidden_accesses_bikelanes) then return true end
  if exclude.by_service(object_tags) then return true end

  return false
end

return {
  exit_processing = exit_processing,
  forbidden_accesses_bikelanes = forbidden_accesses_bikelanes,
}
