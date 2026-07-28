local transformations = require('topics.roads_bikelanes.bikelanes.transformations')
local highway_classes = require('topics.helper.highway_classes')
local SET = require('topics.helper.sets')

---@param object_tags OsmTags
---@param cycleways table
---@return table|nil
local function bikelanes_presence(object_tags, cycleways)
  if highway_classes.sidepath_highway_classes[object_tags.highway] then
    return nil
  end
  if highway_classes.trunk_motorway_classes[object_tags.highway] then
    return nil
  end

  local presence = {}
  local sides = { 'left', 'self', 'right' }
  for _, cycleway in ipairs(cycleways) do
    local side = cycleway._side
    presence[side] = presence[side] or cycleway.category
  end

  local no_infrastructure_on_sides_expected = SET.set({
    'residential',
    'road',
    'living_street',
    'service',
    'pedestrian',
  })
  if no_infrastructure_on_sides_expected[object_tags.highway] or presence.self then
    for _, side in pairs(sides) do presence[side] = presence[side] or 'not_expected' end
  end

  if presence.right or presence.left then
    presence.self = presence.self or 'not_expected'
  end

  local no_infrastructure_on_self_assumed = SET.set({
    'unclassified',
    'primary', 'primary_link',
    'tertiary', 'tertiary_link',
    'secondary', 'secondary_link',
  })
  if no_infrastructure_on_self_assumed[object_tags.highway] then
    presence.self = presence.self or 'not_expected'

    if (
        (presence.left and presence.left ~= 'data_no') or
        (presence.right and presence.right ~= 'data_no')
      ) then
      presence.left = presence.left or 'assumed_no'
      presence.right = presence.right or 'assumed_no'
    end
  end

  if object_tags.oneway == 'yes' and object_tags['oneway:bicycle'] ~= 'no' then
    presence.left = presence.left or 'not_expected'
  end

  if object_tags.junction == 'roundabout' then
    presence.left = presence.left or 'not_expected'
  end

  for _, side in pairs(sides) do presence[side] = presence[side] or 'missing' end

  return {
    bikelane_left = presence.left,
    bikelane_self = presence.self,
    bikelane_right = presence.right,
  }
end

return bikelanes_presence
