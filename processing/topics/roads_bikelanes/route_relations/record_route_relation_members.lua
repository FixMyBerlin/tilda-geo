local route_relation_members = require('topics.roads_bikelanes.route_relations.route_relation_members')

-- Processing-internal (leading `_`): only `6_route_relations.sql` reads it.
local members_table = osm2pgsql.define_table({
  name = '_routeRelationMembers',
  ids = { type = 'relation', id_column = 'relation_id' },
  columns = {
    { column = 'way_id', type = 'int8', not_null = true },
    { column = 'route', type = 'text', not_null = true },
  },
  -- No index: 6_route_relations.sql reads the whole table once.
  indexes = {},
})

---@param relation table osm2pgsql relation object
local function record_route_relation_members(relation)
  for _, row in ipairs(route_relation_members(relation)) do
    members_table:insert(row)
  end
end

return record_route_relation_members
