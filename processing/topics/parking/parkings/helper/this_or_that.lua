local SANITIZE_VALUES = require('sanitize_values')

local function value_confidence_source(thisTable, thatTable)
  if thisTable.value and thisTable.value ~= SANITIZE_VALUES.disallowed then
    return thisTable
  elseif thatTable.value and thatTable.value ~= SANITIZE_VALUES.disallowed then
    return thatTable
  else
    -- Return a table with the same keys as `thisTable` but all nil values
    local nilTable = {}
    for key, _ in pairs(thisTable) do
      nilTable[key] = nil
    end
    return nilTable
  end
end

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
