require('init')
require('SanitizeTrafficSign')
local SANITIZE_TAGS = require('sanitize_tags')

function DeriveTrafficSigns(tags)
  local results = {
    ['traffic_sign'] = SANITIZE_TAGS.safe_string(SanitizeTrafficSign(tags.traffic_sign or tags['traffic_sign:both'])),
    ['traffic_sign:forward'] = SANITIZE_TAGS.safe_string(SanitizeTrafficSign(tags['traffic_sign:forward'])),
    ['traffic_sign:backward'] = SANITIZE_TAGS.safe_string(SanitizeTrafficSign(tags['traffic_sign:backward'])),
  }
  return results
end
