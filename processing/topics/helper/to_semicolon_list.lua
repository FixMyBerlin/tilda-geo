-- Helper function to convert an array of strings to a semicolon-separated list
-- Filters out nil and empty values, sorts, and deduplicates
---@param array table Array of strings to join
---@return string|nil The normalized semicolon-separated string, or nil if input is empty
local function to_semicolon_list(array)

  if not array then return nil end

  -- Filter out nil and empty values using pairs to handle sparse arrays
  local filtered_array = {}
  for i, value in pairs(array) do
    if type(i) == 'number' and value and value ~= '' then
      table.insert(filtered_array, value)
    end
  end

  if #filtered_array == 0 then return nil end

  -- Sort and deduplicate
  local seen = {}
  local unique_array = {}
  for _, value in ipairs(filtered_array) do
    if not seen[value] then
      table.insert(unique_array, value)
      seen[value] = true
    end
  end

  table.sort(unique_array)
  return table.concat(unique_array, ';')
end

return to_semicolon_list
