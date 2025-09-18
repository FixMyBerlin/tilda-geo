local sanitize_cleaner = require('sanitize_cleaner')

---@param this_table table<string, any> The primary table to check first
---@param that_table table<string, any> The fallback table to check if primary is invalid
---@return table<string, any> The selected table or a nilTable with same keys as this_table
local function value_confidence_source(this_table, that_table)
  if this_table.value and sanitize_cleaner.remove_disallowed_value(this_table.value) ~= nil then
    return this_table
  elseif that_table.value and sanitize_cleaner.remove_disallowed_value(that_table.value) ~= nil then
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

---@param this_value string|number|nil (The primary value to check first)
---@param that_value string|number|nil (The fallback value to check if primary is invalid)
---@return string|number|nil (The selected value or nil if both are invalid)
local function value(this_value, that_value)
  if sanitize_cleaner.remove_disallowed_value(this_value) ~= nil then
    return this_value
  elseif sanitize_cleaner.remove_disallowed_value(that_value) ~= nil then
    return that_value
  else
    return nil
  end
end

local THIS_OR_THAT = {
  value_confidence_source = value_confidence_source,
  value = value,
}

return THIS_OR_THAT
