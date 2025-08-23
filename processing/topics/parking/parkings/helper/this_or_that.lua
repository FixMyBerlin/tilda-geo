local SANITIZE_VALUES = require('sanitize_values')

---@param this_table table<string, any> The primary table to check first
---@param that_table table<string, any> The fallback table to check if primary is invalid
---@return table<string, any> The selected table or a nilTable with same keys as this_table
local function value_confidence_source(this_table, that_table)
  if this_table.value and
    this_table.value ~= nil and
    this_table.value ~= SANITIZE_VALUES.disallowed
  then
    return this_table
  elseif that_table.value and
    that_table.value ~= nil and
    that_table.value ~= SANITIZE_VALUES.disallowed
  then
    return that_table
  else
    -- Return a table with the same keys as `this_table` but all nil values
    local nilTable = {}
    for key, _ in pairs(this_table) do
      nilTable[key] = nil
    end
    return nilTable
  end
end

---@param thisValue string|number|nil (The primary value to check first)
---@param thatValue string|number|nil (The fallback value to check if primary is invalid)
---@return string|number|nil (The selected value or nil if both are invalid)
local function value(thisValue, thatValue)
  if thisValue and thisValue ~= SANITIZE_VALUES.disallowed then
    return thisValue
  elseif thatValue and thatValue ~= SANITIZE_VALUES.disallowed then
    return thatValue
  else
    return nil
  end
end

local THIS_OR_THAT = {
  value_confidence_source = value_confidence_source,
  value = value,
}

return THIS_OR_THAT
