-- Line ways: footways, cycleways, paths, pedestrian and living streets (sealed by type or surface),
-- tree rows, and sidewalks tagged on roads (one row per side, shifted by the worker). The root file sends closed ways with area semantics to sealing_areas.lua instead.
local exit_processing_sealing = require('topics.sealing.helper.exit_processing_sealing')
local classify_sealing = require('topics.sealing.helper.classify_sealing')
local insert_sealing_surface = require('topics.sealing.helper.insert_sealing_surface')

---@param object OsmObject
local function sealing_lines(object)
  if exit_processing_sealing(object.tags) then
    return
  end

  local classification = classify_sealing.classify_way_line(object.tags)
  local sidewalks = classify_sealing.classify_road_sidewalks(object.tags)
  if not classification and #sidewalks == 0 then
    return
  end
  local geom = object:as_linestring()
  if geom:is_null() then
    return
  end
  if classification then
    insert_sealing_surface(object, classification, geom)
  end
  for _, sidewalk in ipairs(sidewalks) do
    insert_sealing_surface(object, sidewalk, geom)
  end
end

return sealing_lines
