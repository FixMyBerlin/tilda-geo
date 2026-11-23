-- Areas: closed ways with area semantics and multipolygon relations.
local exit_processing_sealing = require('topics.sealing.helper.exit_processing_sealing')
local classify_sealing = require('topics.sealing.helper.classify_sealing')
local insert_sealing_surface = require('topics.sealing.helper.insert_sealing_surface')

---@param object OsmObject
local function sealing_areas(object)
  if exit_processing_sealing(object.tags) then
    return
  end

  local classification = classify_sealing.classify_polygon(object.tags, object.type == 'relation')
  if not classification then
    return
  end
  local geom = object:as_multipolygon()
  if geom:is_null() then
    return
  end
  insert_sealing_surface(object, classification, geom)
end

return sealing_areas
