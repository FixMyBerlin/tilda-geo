require('init')
require('SanitizeTrafficSign')

--- Derives traffic sign values from tags, always returning all three keys
--- @param tags table<string, string|nil> The input tags table
--- @return table<string, string|nil> Table with keys 'traffic_sign', 'traffic_sign:forward', 'traffic_sign:backward' (values can be nil)
function DeriveTrafficSigns(tags)
  local results = {
    ['traffic_sign'] = SanitizeTrafficSign(tags.traffic_sign or tags['traffic_sign:both']),
    ['traffic_sign:forward'] = SanitizeTrafficSign(tags['traffic_sign:forward']),
    ['traffic_sign:backward'] = SanitizeTrafficSign(tags['traffic_sign:backward']),
  }
  return results
end
