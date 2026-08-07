-- Conflict record: a mapper set `is_sidepath:of` to one TILDA road class and the sidepath
-- CSV sniffed another. Published `adjoining_road` stays the `:of` value (see adjoining_context).
-- This todo only lists the disagreement so we can inspect it. It does not change the value.
--
-- Not fired on crossings. There OSM `:of` (parallel parent) and the CSV (crossed carriageway)
-- mean different roads, so a mismatch is expected. Multi-road crossing ties are SQL-only and
-- are not this todo.
--
-- Not fired on Fahrradstraße / Fußgängerzone-Rad-frei: those ways do not publish adjoining_*.

local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local adjoining_sources = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_sources')

local adjoining_of_vs_csv_todo = {
  id = 'adjoining_of_vs_csv',
  desc = 'OSM is_sidepath:of and the sidepath CSV name different road classes. Published adjoining_road follows is_sidepath:of.',
  todoTableOnly = true,
}

setmetatable(adjoining_of_vs_csv_todo, {
  __call = function(_, object_tags, _)
    if object_tags._side and object_tags._side ~= 'self' then
      return nil
    end
    if bikelane_categories.is_own_cycling_facility(object_tags) then
      return nil
    end
    local sources = adjoining_sources.read_adjoining_sources(object_tags, object_tags)
    if sources.is_crossing then
      return nil
    end
    if not (sources.of_mapped and sources.csv_road and sources.of_mapped ~= sources.csv_road) then
      return nil
    end
    return {
      id = adjoining_of_vs_csv_todo.id,
      -- collect_todos prefixes `prio`
      priority = '2',
      todoTableOnly = true,
    }
  end,
})

--- Copy `categories` and append this todo. Does not mutate the shared category list.
---@param categories table
---@return table
local function append_to(categories)
  local list = {}
  for _, todo in ipairs(categories) do
    list[#list + 1] = todo
  end
  list[#list + 1] = adjoining_of_vs_csv_todo
  return list
end

return {
  todo = adjoining_of_vs_csv_todo,
  append_to = append_to,
}
