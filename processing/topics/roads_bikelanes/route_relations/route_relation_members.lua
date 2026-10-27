local ROUTE_TYPES = require('topics.helper.route_types')

---@param relation table osm2pgsql relation object
---@return table[] rows `{ way_id, route }`, one per member way; empty for other relations
local function route_relation_members(relation)
  local route = ROUTE_TYPES.route_type(relation.tags)
  if route == nil then return {} end

  local rows = {}
  local seen = {}
  for _, member in ipairs(relation.members) do
    -- PTv2 platforms (`platform`, `platform_entry_only`, …) are where people wait, not where the route runs.
    local is_platform = member.role:find('^platform') ~= nil
    -- A way can be listed more than once, e.g. as forward and backward member.
    if member.type == 'w' and not is_platform and not seen[member.ref] then
      seen[member.ref] = true
      rows[#rows + 1] = { way_id = member.ref, route = route }
    end
  end
  return rows
end

return route_relation_members
