-- Pseudo relations: network membership from external data (pseudo tags), written into
-- `route_relations` next to the OSM route relations. See README.md.

---@param object_tags table way tags with `_radnetz_berlin` (id suffix → class) from apply_pseudo_tags
---@param id string TILDA id of the output line, e.g. `way/123` or `way/123/cycleway/left`
---@return string|nil route_relations part, e.g. `radnetz_berlin:Vorrangnetz`
local function pseudo_route_relations(object_tags, id)
  local classes = object_tags._radnetz_berlin
  if not classes then return nil end

  local suffix = id:match('^%a+/%d+/(.+)$') or ''
  local class = classes[suffix]
  if not class then return nil end
  return 'radnetz_berlin:' .. class
end

return pseudo_route_relations
