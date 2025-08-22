local SANITIZE_VALUES = require('sanitize_values')

---@param check_key string The key to check in both tables
---@param this_table table<string, any> The primary table to check first
---@param that_table table<string, any> The fallback table to check if primary is invalid
---@return table<string, any> The selected table or a nilTable with same keys as this_table
local function value_confidence_source(check_key, this_table, that_table)
  if not check_key or type(check_key) ~= 'string' then
    error("`value_confidence_source` requires a string check_key as first parameter")
  end

  if not this_table or type(this_table) ~= 'table' then
    error("`value_confidence_source` requires a valid this_table as second parameter")
  end

  if not that_table or type(that_table) ~= 'table' then
    error("`value_confidence_source` requires a valid that_table as third parameter")
  end

  if this_table[check_key] and
    this_table[check_key] ~= nil and
    this_table[check_key] ~= SANITIZE_VALUES.disallowed
  then
    return this_table
  elseif that_table[check_key] and
    that_table[check_key] ~= nil and
    that_table[check_key] ~= SANITIZE_VALUES.disallowed
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
