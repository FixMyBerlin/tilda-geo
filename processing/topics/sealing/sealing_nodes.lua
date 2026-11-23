-- Tree points: `natural=tree` -> group `tree` with the crown diameter.
local exit_processing_sealing = require('topics.sealing.helper.exit_processing_sealing')
local classify_sealing = require('topics.sealing.helper.classify_sealing')
local insert_sealing_surface = require('topics.sealing.helper.insert_sealing_surface')

---@param object OsmObject
local function sealing_nodes(object)
  -- Hot path: nearly every node has no tags or is no tree.
  if object.tags.natural ~= 'tree' then
    return
  end
  if exit_processing_sealing(object.tags) then
    return
  end

  local classification = classify_sealing.classify_tree_node(object.tags)
  if not classification then
    return
  end
  local geom = object:as_point()
  if geom:is_null() then
    return
  end
  insert_sealing_surface(object, classification, geom)
end

return sealing_nodes
