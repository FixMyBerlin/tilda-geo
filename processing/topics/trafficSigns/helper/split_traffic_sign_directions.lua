require('init')

---@param tags OsmTags
---@return table
local function split_traffic_sign_directions(tags)
  local direction_offsets = { ['forward'] = 0, ['backward'] = 180, }
  local traffic_signs = {}
  for direction, offset in pairs(direction_offsets) do
    local directed_tag = 'traffic_sign:' .. direction
    local both_tag = 'traffic_sign:both'
    if tags[directed_tag] or tags[both_tag] then
      traffic_signs[direction] = { ['traffic_sign'] = tags[directed_tag] or tags[both_tag], ['offset'] = offset, }
    elseif tags.direction == direction or tags.direction == 'both' then
      traffic_signs[direction] = { ['traffic_sign'] = tags.traffic_sign, ['offset'] = offset, }
    end
  end
  if traffic_signs.forward == nil and traffic_signs.backward == nil then
    traffic_signs.forward = { ['traffic_sign'] = tags.traffic_sign, ['offset'] = 0, }
  end
  return { traffic_signs.forward, traffic_signs.backward, }
end

return split_traffic_sign_directions
