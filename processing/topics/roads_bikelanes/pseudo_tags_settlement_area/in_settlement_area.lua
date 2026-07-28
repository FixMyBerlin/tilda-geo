local HIGHWAY_CLASSES = require('topics.helper.highway_classes')
local SET = require('topics.helper.sets')

-- Ways that receive a settlement-area estimation = ALL road classes + path classes (incl.
-- `service` — every road is innerorts/außerorts somewhere). The export classifies every way in
-- `roads` + `roadsPathClasses` + `bikelanes`, so every class here is covered; a way in scope but
-- absent from the CSV would otherwise wrongly default to assumed_yes (inside).
-- This is deliberately broader than the sidepath road list (settlement applies to all roads, not
-- just the "main roads a path can be a sidepath of"). KEEP IN SYNC (FYI) with the export only:
--   - processing/topics/roads_bikelanes/pseudo_tags_settlement_area/sql/run_settlement_area_estimation.sql
local way_classes = SET.join_sets({
  HIGHWAY_CLASSES.trunk_motorway_classes,
  HIGHWAY_CLASSES.major_road_classes,
  HIGHWAY_CLASSES.minor_road_classes,
  HIGHWAY_CLASSES.path_classes,
})

--- Returns _in_settlement_area for a way (innerorts/außerorts estimation).
--- The CSV holds only the MINORITY class — ways OUTSIDE settlement areas (~32% by count on
--- Germany; see landcover/settlement_areas/CLASSIFICATION_STATS.md) — so we infer the majority
--- (inside) as the default. Same idea as is_sidepath.
---  - in scope and IN csv  -> 'assumed_no'  (außerorts / outside)
---  - in scope and NOT csv -> 'assumed_yes' (innerorts / inside — the default)
---  - out of scope         -> nil
---@param rows table - map osm_id -> row, from load_csv_in_settlement_area:get()
---@param osm_id number|string
---@param highway string|nil
---@return 'assumed_yes'|'assumed_no'|nil
local function in_settlement_area(rows, osm_id, highway)
  if not highway or not way_classes[highway] then
    return nil
  end
  if rows[tonumber(osm_id)] then
    return 'assumed_no'
  end
  return 'assumed_yes'
end

return in_settlement_area
