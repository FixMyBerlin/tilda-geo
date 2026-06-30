local HIGHWAYS = require('topics.helper.highway_classes')
local SET = require('topics.helper.sets')

-- Which ways get a settlement-area estimation: ALL road + path classes (every way is
-- innerorts/außerorts somewhere). This was implicit before in pseudo_tags_settlement_area/
-- in_settlement_area.lua; the merged path needs it explicitly because the default for an in-scope
-- way absent from the CSV is `assumed_yes` (inside) — so without bounding the classes here, ways
-- that should get no value (e.g. out of scope) would wrongly default to assumed_yes. Deliberately
-- broader than the sidepath road list. KEEP IN SYNC with the export classification in
-- pseudo_tags_settlement_area/sql/run_settlement_area_estimation.sql.
local settlement_way_classes = SET.join_sets({
  HIGHWAYS.trunk_motorway_classes,
  HIGHWAYS.major_road_classes,
  HIGHWAYS.minor_road_classes,
  HIGHWAYS.path_classes,
})

local function lookup_row(merged, object_id)
  return merged[tonumber(object_id)]
end

local function apply_mapillary(object_tags, row)
  if row and row.mapillary_coverage then
    object_tags.mapillary_coverage = row.mapillary_coverage
  end
end

local function apply_sidepath(object_tags, row, highway)
  if not highway then
    return
  end
  if not HIGHWAYS.sidepath_highway_classes[highway] then
    return
  end

  if not row then
    object_tags._is_sidepath = 'assumed_no'
    return
  end

  if row.is_sidepath_estimation == 'true' then
    object_tags._is_sidepath = 'assumed_yes'
  else
    object_tags._is_sidepath = 'assumed_no'
  end

  if row.adjoining_road then
    object_tags._sidepath_adjoining_road = row.adjoining_road
  end
  if row.adjoining_maxspeed then
    object_tags._sidepath_adjoining_maxspeed = row.adjoining_maxspeed
  end
end

local function apply_settlement_from_csv(object_tags, row, highway)
  if not highway or not settlement_way_classes[highway] then
    return
  end
  if row and row.in_settlement_area == 'assumed_no' then
    object_tags._in_settlement_area = 'assumed_no'
    return
  end
  object_tags._in_settlement_area = 'assumed_yes'
end

local function apply_pseudo_tags(object_tags, object_id, merged, _object_geom)
  local row = lookup_row(merged, object_id)

  apply_mapillary(object_tags, row)
  apply_sidepath(object_tags, row, object_tags.highway)
  apply_settlement_from_csv(object_tags, row, object_tags.highway)
end

return apply_pseudo_tags
