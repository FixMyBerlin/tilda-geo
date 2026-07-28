local contains_substring = require('topics.helper.contains_substring')
local sanitize_traffic_sign = require('topics.helper.sanitize_traffic_sign')

---@param traffic_sign string
---@param traffic_sign_id string
---@return boolean
local function contains_traffic_sign_id(traffic_sign, traffic_sign_id)
  local clean_traffic_sign = sanitize_traffic_sign(traffic_sign)
  return contains_substring(clean_traffic_sign, 'DE:' .. traffic_sign_id)
        or contains_substring(clean_traffic_sign, ';' .. traffic_sign_id)
        or contains_substring(clean_traffic_sign, ',' .. traffic_sign_id)
end

return contains_traffic_sign_id
