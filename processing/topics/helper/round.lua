--- round `value` to `digits` decimal positions
---@param value number|nil
---@param digits integer
---@return number|nil
local function round(value, digits)
  if value == nil then
    return nil
  end
  local factor = 10^digits
  return math.floor(value * factor + 0.5) / factor
end

return round
