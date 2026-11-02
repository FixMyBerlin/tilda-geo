-- OSM `route=*` values that TILDA processes, each with the `routes` topic table that holds
-- its relations. `roads_bikelanes` writes which of these relations a way belongs to into
-- `tags.route_relations`; see topics/roads_bikelanes/route_relations/README.md.
local TABLE_BY_ROUTE = {
  bicycle = 'bikeroutes',
  mtb = 'mtbroutes',
  bus = 'busroutes',
  foot = 'footroutes',
  hiking = 'hikingroutes',
}

---@param tags table relation tags
---@return string|nil route the `route=*` value when it is a processed route type
local function route_type(tags)
  if tags.type ~= 'route' or TABLE_BY_ROUTE[tags.route] == nil then return nil end
  return tags.route
end

return {
  TABLE_BY_ROUTE = TABLE_BY_ROUTE,
  route_type = route_type,
}
