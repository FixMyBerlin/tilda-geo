local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')

--- Derives traffic sign values from tags, always returning all three keys
---@param tags OsmTags<string, string|nil>|nil The input tags table
---@return table<string, string|nil> Table with keys 'traffic_sign', 'traffic_sign:forward', 'traffic_sign:backward' (values can be nil)
local function derive_traffic_signs(tags)
  if tags == nil then
    return {
      ['traffic_sign'] = nil,
      ['traffic_sign:forward'] = nil,
      ['traffic_sign:backward'] = nil,
    }
  end
  local results = {
    ['traffic_sign'] = sanitize_traffic_sign(tags.traffic_sign or tags['traffic_sign:both']),
    ['traffic_sign:forward'] = sanitize_traffic_sign(tags['traffic_sign:forward']),
    ['traffic_sign:backward'] = sanitize_traffic_sign(tags['traffic_sign:backward']),
  }
  return results
end

return derive_traffic_signs
