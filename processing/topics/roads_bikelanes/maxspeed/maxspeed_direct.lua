
---@param tags OsmTags
---@return number|nil, string|nil, string|nil
local function maxspeed_direct(tags)
  local maxspeed = nil
  local source = nil
  local confidence = nil
  local speed_tags = { 'maxspeed:forward', 'maxspeed:backward', 'maxspeed' }

  for _, tag in pairs(speed_tags) do
    if tags[tag] then
      local val = tonumber(tags[tag])

      if val ~= nil and (maxspeed == nil or val > maxspeed) then
        maxspeed = val
        source = tag .. '_tag'
        confidence = 'high'
      end
    end
  end

  return maxspeed, source, confidence
end

return maxspeed_direct
