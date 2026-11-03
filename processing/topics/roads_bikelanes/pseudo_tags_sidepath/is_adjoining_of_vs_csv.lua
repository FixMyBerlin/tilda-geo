local bikelane_categories = require('topics.roads_bikelanes.bikelanes.bikelane_categories')
local adjoining_sources = require('topics.roads_bikelanes.pseudo_tags_sidepath.adjoining_sources')

-- Condition of the `adjoining_of_vs_csv` todo of `roads` and `bikelanes`.
-- Conflict record: a mapper set `is_sidepath:of` to one TILDA road class and the sidepath
-- CSV sniffed another. Published `adjoining_road` stays the `:of` value (see adjoining_context).
-- This todo only lists the disagreement so we can inspect it. It does not change the value.
--
-- Not fired on crossings. There OSM `:of` (parallel parent) and the CSV (crossed carriageway)
-- mean different roads, so a mismatch is expected. Multi-road crossing ties are SQL-only and
-- are not this todo.
--
-- Not fired on Fahrradstraße / Fußgängerzone-Rad-frei: those ways do not publish adjoining_*.
---@param object_tags OsmTags
---@return boolean
local function is_adjoining_of_vs_csv(object_tags)
  if object_tags._side and object_tags._side ~= 'self' then
    return false
  end
  if bikelane_categories.is_own_cycling_facility(object_tags) then
    return false
  end
  local sources = adjoining_sources.read_adjoining_sources(object_tags, object_tags)
  if sources.is_crossing then
    return false
  end
  return sources.of_mapped ~= nil
    and sources.csv_road ~= nil
    and sources.of_mapped ~= sources.csv_road
end

return is_adjoining_of_vs_csv
