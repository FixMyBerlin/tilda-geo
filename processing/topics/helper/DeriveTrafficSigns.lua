require('init')
require('SanitizeTrafficSign')

--- Derives traffic sign values from tags, always returning all three keys
--- @param tags table<string, string|nil>|nil The input tags table
--- @return table<string, string|nil> Table with keys 'traffic_sign', 'traffic_sign:forward', 'traffic_sign:backward' (values can be nil)
function DeriveTrafficSigns(tags)
  if tags == nil then
    return {
      ['traffic_sign'] = nil,
      ['traffic_sign:forward'] = nil,
      ['traffic_sign:backward'] = nil,
    }
  end
  local results = {
    ['traffic_sign'] = SanitizeTrafficSign(tags.traffic_sign or tags['traffic_sign:both']),
    ['traffic_sign:forward'] = SanitizeTrafficSign(tags['traffic_sign:forward']),
    ['traffic_sign:backward'] = SanitizeTrafficSign(tags['traffic_sign:backward']),
  }
  return results
end
